import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

import { KeyPair, PrivateKey } from "@nimiq/core";
import { createPodsRepository } from "@pods/db";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3410";
const signedMessagePrefix = "\x16Nimiq Signed Message:\n";
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const repository = createPodsRepository(databaseUrl);
const testWalletAddresses = new Set<string>();

type QueryResult = { rows: Array<Record<string, unknown>> };
type DatabasePool = {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
  end(): Promise<void>;
};
type DatabasePoolConstructor = new (options: { connectionString: string }) => DatabasePool;

function databasePool() {
  const requireFromDatabaseWorkspace = createRequire(
    path.resolve(process.cwd(), "../../packages/db/package.json")
  );
  const { Pool } = requireFromDatabaseWorkspace("pg") as { Pool: DatabasePoolConstructor };
  return new Pool({ connectionString: databaseUrl });
}

async function waitForFlowStage(page: Page) {
  await expect.poll(() =>
    page.locator(".flow-stage").evaluate((element) =>
      window.getComputedStyle(element).opacity
    )
  ).toBe("1");
}

async function authenticate(context: BrowserContext) {
  const keyPair = KeyPair.derive(PrivateKey.fromHex(randomBytes(32).toString("hex")));
  const walletAddress = keyPair.toAddress().toUserFriendlyAddress();
  testWalletAddresses.add(walletAddress);
  const challengeResponse = await context.request.post(`${baseUrl}/api/auth/challenge`, {
    data: { walletAddress }
  });
  expect(challengeResponse.ok()).toBe(true);
  const challenge = (await challengeResponse.json()) as { id: string; message: string };
  const messageBytes = new TextEncoder().encode(challenge.message);
  const digest = createHash("sha256").update(Buffer.concat([
    Buffer.from(signedMessagePrefix, "utf8"),
    Buffer.from(String(messageBytes.byteLength), "utf8"),
    Buffer.from(messageBytes)
  ])).digest();
  const verifyResponse = await context.request.post(`${baseUrl}/api/auth/verify`, {
    data: {
      challengeId: challenge.id,
      publicKey: keyPair.publicKey.toHex(),
      signature: keyPair.sign(digest).toHex()
    }
  });
  expect(verifyResponse.ok()).toBe(true);
  await repository.saveProfile(await userIdForWallet(walletAddress), {
    handle: `phase4_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
    displayName: "Phase 4 builder",
    bio: "",
    avatar: { kind: "preset", preset: "indigo" },
    visibility: "public",
    dmPolicy: "requests",
    activityStatusVisible: true
  });
  return walletAddress;
}

async function userIdForWallet(walletAddress: string) {
  const pool = databasePool();
  try {
    const result = await pool.query("SELECT id FROM users WHERE wallet_address = $1", [walletAddress]);
    const id = result.rows[0]?.id;
    if (typeof id !== "string") throw new Error("Authenticated test user was not found");
    return id;
  } finally {
    await pool.end();
  }
}

async function seedLockedBuildPod(input: {
  creatorUserId: string;
  memberUserIds: string[];
  opensAt: Date;
}) {
  const podId = randomUUID();
  const occurrenceId = randomUUID();
  const name = `Build and Ship ${randomUUID().slice(0, 6)}`;
  const closesAt = new Date(input.opensAt.getTime() + 24 * 60 * 60 * 1000);
  const commitmentDeadlineAt = new Date(input.opensAt.getTime() + 9 * 60 * 60 * 1000);
  const localDate = input.opensAt.toISOString().slice(0, 10);
  const contract = {
    version: 2,
    templateId: "build",
    evidenceMode: "per_occurrence_commitment",
    settlementMode: "full_refund_alpha",
    activity: {
      name,
      purpose: "Ship one visible, reviewable improvement in a focused builder group.",
      startDate: localDate,
      endDate: localDate,
      timeZone: "UTC",
      weekdays: [input.opensAt.getUTCDay() || 7],
      config: {
        projectTheme: "A polished accountability product for Nimiq builders",
        allowedDeliverables: ["pull_request", "commit"],
        commitmentCutoff: commitmentDeadlineAt.toISOString().slice(11, 16)
      }
    },
    community: {
      visibility: "public",
      minParticipants: 2,
      maxParticipants: 5,
      applicationQuestions: [],
      roomAudience: "public_read_only"
    },
    commitment: { lunaPerOccurrence: 10_000, occurrenceCount: 1, totalLuna: 10_000 },
    verification: { verifier: "creator", targetReviewHours: 12, timeoutProtectionHours: 24 }
  };
  const pool = databasePool();
  try {
    await pool.query(
      `INSERT INTO pods (id, creator_user_id, state, template_id, draft_data, contract_data, contract_hash, published_at, created_at, updated_at)
       VALUES ($1, $2, 'locked_scheduled', 'build', '{}', $3::jsonb, 'phase4-e2e-contract', $4, $4, $4)`,
      [podId, input.creatorUserId, JSON.stringify(contract), new Date()]
    );
    await pool.query(
      `INSERT INTO occurrences (id, pod_id, ordinal, local_date, opens_at, closes_at, commitment_deadline_at, state)
       VALUES ($1, $2, 1, $3, $4, $5, $6, 'scheduled')`,
      [occurrenceId, podId, localDate, input.opensAt, closesAt, commitmentDeadlineAt]
    );
    for (const userId of input.memberUserIds) {
      await pool.query(
        `INSERT INTO memberships (id, pod_id, user_id, admission_source, state, accepted_at, created_at, updated_at)
         VALUES ($1, $2, $3, 'public_application', 'roster_locked', $4, $4, $4)`,
        [randomUUID(), podId, userId, new Date()]
      );
    }
  } finally {
    await pool.end();
  }
  return { podId, occurrenceId, name, closesAt };
}

async function createReviewingSubmission(input: {
  creatorUserId: string;
  memberUserId: string;
  peerUserId: string;
  opensAt: Date;
  now: Date;
  label: string;
  memberContext?: BrowserContext;
  includePrivateEvidence?: boolean;
}) {
  const fixture = await seedLockedBuildPod({
    creatorUserId: input.creatorUserId,
    memberUserIds: [input.memberUserId, input.peerUserId],
    opensAt: input.opensAt
  });
  await activateLockedPod({
    creatorUserId: input.creatorUserId,
    podId: fixture.podId,
    memberUserIds: [input.memberUserId, input.peerUserId],
    now: input.now
  });
  const task = `${input.label} through the creator review release gate.`;
  await repository.lockOccurrenceCommitment({
    userId: input.memberUserId,
    podId: fixture.podId,
    occurrenceId: fixture.occurrenceId,
    task,
    deliverableType: "pull_request",
    now: input.now
  });
  const draft = await repository.saveSubmissionDraft({
    userId: input.memberUserId,
    podId: fixture.podId,
    occurrenceId: fixture.occurrenceId,
    resultSummary: `${input.label} with a public artifact and participant-safe result.`,
    artifactUrl: "https://github.com/18Abhinav07/Pods/pull/43",
    evidence: null,
    proofShareMode: "reviewer_only",
    now: input.now
  });
  if (input.includePrivateEvidence) {
    if (!input.memberContext) {
      throw new Error("A member browser context is required to upload private evidence");
    }
    const evidenceImage = await sharp({
      create: { width: 640, height: 480, channels: 3, background: "#b9de45" }
    }).png().toBuffer();
    const evidenceResponse = await input.memberContext.request.post(
      `${baseUrl}/api/pods/${fixture.podId}/occurrences/${fixture.occurrenceId}/evidence`,
      {
        multipart: {
          submissionId: draft.id,
          image: {
            name: "private-review-proof.png",
            mimeType: "image/png",
            buffer: evidenceImage
          }
        }
      }
    );
    expect(evidenceResponse.ok()).toBe(true);
  }
  const submission = await repository.submitOccurrenceEvidence({
    userId: input.memberUserId,
    submissionId: draft.id,
    now: input.now
  });
  return { ...fixture, submission, task };
}

async function activateLockedPod(input: {
  creatorUserId: string;
  podId: string;
  memberUserIds: string[];
  now: Date;
}) {
  await repository.runOccurrenceTransitions(input.now);
  expect(await repository.getPodForOwner(input.creatorUserId, input.podId))
    .toMatchObject({ state: "active" });
  for (const memberUserId of input.memberUserIds) {
    expect(await repository.getMembershipForUser(memberUserId, input.podId))
      .toMatchObject({ state: "active" });
  }
}

async function creatorFinancialEntitlements(input: {
  creatorUserId: string;
  podIds: string[];
}) {
  const pool = databasePool();
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM memberships
          WHERE pod_id = ANY($1::uuid[]) AND user_id = $2) AS memberships,
         (SELECT COUNT(*) FROM deposit_intents
          WHERE pod_id = ANY($1::uuid[]) AND user_id = $2) AS deposits,
         (SELECT COUNT(*) FROM ledger_entries AS ledger
          INNER JOIN memberships AS membership ON membership.id = ledger.membership_id
          WHERE ledger.pod_id = ANY($1::uuid[]) AND membership.user_id = $2) AS ledger_entries,
         (SELECT COUNT(*) FROM transfer_legs AS transfer
          INNER JOIN memberships AS membership ON membership.id = transfer.membership_id
          WHERE transfer.pod_id = ANY($1::uuid[]) AND membership.user_id = $2) AS refund_transfers`,
      [input.podIds, input.creatorUserId]
    );
    const row = result.rows[0] ?? {};
    return {
      memberships: Number(row.memberships),
      deposits: Number(row.deposits),
      ledgerEntries: Number(row.ledger_entries),
      refundTransfers: Number(row.refund_transfers)
    };
  } finally {
    await pool.end();
  }
}

test.afterEach(async () => {
  const pool = databasePool();
  try {
    await pool.query("DELETE FROM clock_events WHERE actor LIKE 'playwright-phase4-%'");
    if (testWalletAddresses.size > 0) {
      await pool.query("DELETE FROM users WHERE wallet_address = ANY($1::text[])", [
        [...testWalletAddresses]
      ]);
    }
  } finally {
    await pool.end();
    testWalletAddresses.clear();
  }
});

test.afterAll(async () => {
  await repository.close();
});

test("creator approves proof through the UI without gaining member finances", async ({
  browser,
  context
}, testInfo) => {
  test.setTimeout(60_000);
  const creatorWallet = await authenticate(context);
  const memberContext = await browser.newContext();
  const peerContext = await browser.newContext();
  const creatorPage = await context.newPage();
  const memberPage = await memberContext.newPage();
  for (const page of [creatorPage, memberPage]) {
    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(10_000);
  }
  try {
    const memberWallet = await authenticate(memberContext);
    const peerWallet = await authenticate(peerContext);
    const creatorUserId = await userIdForWallet(creatorWallet);
    const memberUserId = await userIdForWallet(memberWallet);
    const peerUserId = await userIdForWallet(peerWallet);
    const effectiveNow = await repository.getEffectiveTime(new Date());
    const opensAt = new Date(effectiveNow.getTime() + 60_000);
    const fixture = await seedLockedBuildPod({
      creatorUserId,
      memberUserIds: [memberUserId, peerUserId],
      opensAt
    });
    const activityNow = new Date(opensAt.getTime() + 60_000);
    await repository.advanceClock({
      effectiveTime: activityNow,
      reason: "Phase 4 activity browser gate",
      actor: `playwright-phase4-${randomUUID()}`,
      realNow: new Date()
    });
    await activateLockedPod({
      creatorUserId,
      podId: fixture.podId,
      memberUserIds: [memberUserId, peerUserId],
      now: activityNow
    });

    await memberPage.goto(`${baseUrl}/today`);
    await expect(memberPage.getByRole("heading", { name: "Name the work before you build." })).toBeVisible();
    await memberPage.getByRole("link", { name: "Lock today's task" }).click();
    expect(await memberPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await memberPage.getByLabel("Today's task").fill(
      "Ship the participant activity screen with private evidence and reviewer states."
    );
    await waitForFlowStage(memberPage);
    await memberPage.screenshot({
      path: testInfo.outputPath("commitment-define-mobile.png")
    });
    await memberPage.getByRole("button", { name: "Choose proof type" }).click();
    await expect(
      memberPage.getByRole("heading", {
        name: "Choose how the work will be verified."
      })
    ).toBeVisible();
    await expect(
      memberPage.getByText("GitHub pull request", { exact: true })
    ).toBeInViewport({ ratio: 1 });
    await waitForFlowStage(memberPage);
    await memberPage.screenshot({
      path: testInfo.outputPath("commitment-proof-type-mobile.png")
    });
    await memberPage.getByRole("radio", { name: "GitHub pull request" }).check();
    await memberPage.getByRole("button", { name: "Review commitment" }).click();
    await expect(
      memberPage.getByRole("heading", { name: "Make it official." })
    ).toBeVisible();
    await waitForFlowStage(memberPage);
    await memberPage.screenshot({
      path: testInfo.outputPath("commitment-review-mobile.png")
    });
    await memberPage.getByRole("button", { name: "Lock this task" }).click();
    await expect(
      memberPage.getByText("Locked task · occurrence 1", { exact: true })
    ).toBeVisible();

    await memberPage.getByLabel("Result summary").fill(
      "Shipped the participant occurrence flow, private image handling, and manual review states."
    );
    await memberPage.getByRole("button", { name: "Continue to evidence" }).click();
    await memberPage.getByRole("button", { name: "Add artifact link" }).click();
    await memberPage.getByLabel("Public artifact URL").fill(
      "https://github.com/18Abhinav07/Pods/pull/42"
    );
    await expect(memberPage.getByText("Draft saved automatically")).toBeVisible();
    const evidenceImage = await sharp({
      create: { width: 640, height: 480, channels: 3, background: "#3b5ccc" }
    }).png().toBuffer();
    await memberPage.getByLabel("Choose evidence image").setInputFiles({
      name: "build-proof.png",
      mimeType: "image/png",
      buffer: evidenceImage
    });
    await expect(memberPage.getByText("Image secured")).toBeVisible();
    await expect(
      memberPage.getByRole("heading", { name: "Show the finished work." })
    ).toBeVisible();
    await waitForFlowStage(memberPage);
    await memberPage.screenshot({
      path: testInfo.outputPath("proof-evidence-mobile.png")
    });
    await memberPage.getByRole("button", { name: "Continue to visibility" }).click();
    await expect(
      memberPage.getByRole("heading", { name: "Choose the right visibility." })
    ).toBeVisible();
    await waitForFlowStage(memberPage);
    await memberPage.screenshot({
      path: testInfo.outputPath("proof-visibility-mobile.png")
    });
    await memberPage.getByRole("button", { name: "Review submission" }).click();
    await expect(
      memberPage.getByRole("heading", { name: "Ready for creator review." })
    ).toBeVisible();
    await waitForFlowStage(memberPage);
    await memberPage.screenshot({
      path: testInfo.outputPath("proof-review-mobile.png")
    });
    await memberPage.getByRole("button", { name: "Submit to creator" }).click();
    await expect(memberPage.getByRole("heading", { name: "Creator review in progress" })).toBeVisible();

    await creatorPage.goto(`${baseUrl}/today`);
    await expect(
      creatorPage.getByRole("heading", { name: "Members are waiting for your review." })
    ).toBeVisible();
    await expect(creatorPage.getByRole("link", { name: "Review proofs" })).toBeVisible();
    await expect(creatorPage.getByRole("link", { name: "Lock today's task" })).toHaveCount(0);
    await expect(creatorPage.getByRole("link", { name: "Add today's proof" })).toHaveCount(0);
    await creatorPage.getByRole("link", { name: "Review proofs" }).click();
    await expect(creatorPage).toHaveURL(`${baseUrl}/pods/${fixture.podId}/admin/reviews`);
    await expect(
      creatorPage.getByRole("heading", { name: "1 proof to review." })
    ).toBeVisible();
    const firstReviewLink = creatorPage.getByRole("link", {
      name: "Review Phase 4 builder proof"
    });
    const firstReviewHref = await firstReviewLink.getAttribute("href");
    const firstSubmissionId = firstReviewHref?.split("/").at(-1);
    if (!firstSubmissionId) throw new Error("Creator review detail did not expose a submission id");
    await firstReviewLink.click();
    await expect(creatorPage).toHaveURL(
      `${baseUrl}/pods/${fixture.podId}/admin/reviews/${firstSubmissionId}`
    );
    await expect(
      creatorPage.getByText(
        "Ship the participant activity screen with private evidence and reviewer states."
      )
    ).toBeVisible();
    const creatorOnlyEvidence = creatorPage.getByRole("img", {
      name: "Creator-only evidence"
    });
    await expect(creatorOnlyEvidence).toBeVisible();
    await expect.poll(
      () => creatorOnlyEvidence.evaluate((image: HTMLImageElement) => image.naturalWidth)
    ).toBeGreaterThan(0);
    await creatorPage.getByLabel("Approval note").fill(
      "The public pull request visibly completes the locked participant task."
    );
    await creatorPage.getByRole("button", { name: "Approve proof" }).click();
    await expect.poll(async () =>
      (await repository.getSubmissionForOwner({
        userId: memberUserId,
        submissionId: firstSubmissionId
      }))?.submission.state
    ).toBe("approved");
    await expect(creatorPage).toHaveURL(`${baseUrl}/pods/${fixture.podId}/admin/reviews`);

    await memberPage.goto(`${baseUrl}/today`);
    await expect(memberPage.getByRole("heading", { name: "Your work is counted." })).toBeVisible();
    await memberPage.goto(
      `${baseUrl}/pods/${fixture.podId}/submissions/${firstSubmissionId}`
    );
    await expect(memberPage.getByRole("heading", { name: "Work approved" })).toBeVisible();
    await expect(memberPage.getByText(
      "The Pod creator approved this proof. It counts toward your progress and streak."
    )).toBeVisible();
    await memberPage.goto(`${baseUrl}/pods/${fixture.podId}/room`);
    const approvedRoomCard = memberPage.getByRole("article").filter({
      hasText: "Ship the participant activity screen with private evidence and reviewer states."
    });
    await expect(approvedRoomCard.getByText("Approved", { exact: true })).toBeVisible();
    await memberPage.goto(`${baseUrl}/pods/${fixture.podId}/activity`);
    const approvedProof = memberPage.getByRole("article").filter({
      hasText: "Ship the participant activity screen with private evidence and reviewer states."
    });
    await expect(approvedProof.getByText("Approved", { exact: true })).toBeVisible();
    await memberPage.goto(`${baseUrl}/updates`);
    await expect(memberPage.getByText("Work approved", { exact: true })).toBeVisible();

    expect(
      (await context.request.get(`${baseUrl}/pods/${fixture.podId}/fund`)).status()
    ).toBe(404);

    await expect(
      creatorFinancialEntitlements({
        creatorUserId,
        podIds: [fixture.podId]
      })
    ).resolves.toEqual({
      memberships: 0,
      deposits: 0,
      ledgerEntries: 0,
      refundTransfers: 0
    });
  } finally {
    await memberContext.close();
    await peerContext.close();
  }
});

test("creator rejection keeps the reason private from peers and public visitors", async ({
  browser,
  context
}) => {
  test.setTimeout(60_000);
  const creatorWallet = await authenticate(context);
  const memberContext = await browser.newContext();
  const peerContext = await browser.newContext();
  const visitorContext = await browser.newContext();
  const creatorPage = await context.newPage();
  const memberPage = await memberContext.newPage();
  const peerPage = await peerContext.newPage();
  const visitorPage = await visitorContext.newPage();
  for (const page of [creatorPage, memberPage, peerPage, visitorPage]) {
    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(10_000);
  }
  try {
    const memberWallet = await authenticate(memberContext);
    const peerWallet = await authenticate(peerContext);
    const creatorUserId = await userIdForWallet(creatorWallet);
    const memberUserId = await userIdForWallet(memberWallet);
    const peerUserId = await userIdForWallet(peerWallet);
    const effectiveNow = await repository.getEffectiveTime(new Date());
    const opensAt = new Date(effectiveNow.getTime() + 60_000);
    const activityNow = new Date(opensAt.getTime() + 60_000);
    await repository.advanceClock({
      effectiveTime: activityNow,
      reason: "Phase 4 creator rejection privacy gate",
      actor: `playwright-phase4-${randomUUID()}`,
      realNow: new Date()
    });
    const rejectedFixture = await createReviewingSubmission({
      creatorUserId,
      memberUserId,
      peerUserId,
      opensAt,
      now: activityNow,
      label: "Ship the private rejection projection",
      memberContext,
      includePrivateEvidence: true
    });
    await creatorPage.goto(`${baseUrl}/pods/${rejectedFixture.podId}/admin/reviews`);
    await expect(
      creatorPage.getByRole("heading", { name: "1 proof to review." })
    ).toBeVisible();
    await creatorPage.getByRole("link", { name: "Review Phase 4 builder proof" }).click();
    await expect(creatorPage.getByText(rejectedFixture.task)).toBeVisible();
    await creatorPage.getByRole("button", { name: "Reject proof" }).click();
    const privateReason = "The artifact does not match the locked task.";
    expect(privateReason.length).toBeGreaterThanOrEqual(12);
    await creatorPage.getByLabel("Rejection reason").fill(privateReason);
    await creatorPage.getByRole("button", { name: "Confirm rejection" }).click();
    await expect.poll(async () =>
      (await repository.getSubmissionForOwner({
        userId: memberUserId,
        submissionId: rejectedFixture.submission.id
      }))?.submission.state
    ).toBe("rejected");
    await expect(creatorPage).toHaveURL(
      `${baseUrl}/pods/${rejectedFixture.podId}/admin/reviews`
    );

    const creatorEvidence = await context.request.get(
      `${baseUrl}/api/pods/${rejectedFixture.podId}/admin/reviews/${rejectedFixture.submission.id}/evidence`
    );
    expect(creatorEvidence.status()).toBe(200);
    expect(creatorEvidence.headers()["content-type"]).toContain("image/webp");
    expect((await creatorEvidence.body()).byteLength).toBeGreaterThan(0);

    await memberPage.goto(
      `${baseUrl}/pods/${rejectedFixture.podId}/submissions/${rejectedFixture.submission.id}`
    );
    await expect(memberPage.getByRole("heading", { name: "Not verified" })).toBeVisible();
    await expect(memberPage.getByText(privateReason)).toBeVisible();

    const peerEvidence = await peerContext.request.get(
      `${baseUrl}/api/pods/${rejectedFixture.podId}/admin/reviews/${rejectedFixture.submission.id}/evidence`
    );
    expect(peerEvidence.status()).toBe(404);
    await peerPage.goto(`${baseUrl}/pods/${rejectedFixture.podId}/room`);
    const peerRoomCard = peerPage.getByRole("article").filter({
      hasText: rejectedFixture.task
    });
    await expect(peerRoomCard.getByText("Not verified", { exact: true })).toBeVisible();
    await expect(peerPage.getByText(privateReason)).toHaveCount(0);
    await peerPage.goto(`${baseUrl}/pods/${rejectedFixture.podId}/activity`);
    const peerSafeProof = peerPage.getByRole("article").filter({
      hasText: rejectedFixture.task
    });
    await expect(peerSafeProof.getByText("Not verified", { exact: true })).toBeVisible();
    await expect(peerPage.getByText(privateReason)).toHaveCount(0);
    const peerPrivateDetail = await peerContext.request.get(
      `${baseUrl}/pods/${rejectedFixture.podId}/submissions/${rejectedFixture.submission.id}`
    );
    expect(peerPrivateDetail.status()).toBe(404);
    expect(await peerPrivateDetail.text()).not.toContain(privateReason);

    const anonymousEvidence = await visitorContext.request.get(
      `${baseUrl}/api/pods/${rejectedFixture.podId}/admin/reviews/${rejectedFixture.submission.id}/evidence`
    );
    expect(anonymousEvidence.status()).toBe(401);
    await visitorPage.goto(`${baseUrl}/pods/${rejectedFixture.podId}/room`);
    await expect(visitorPage.getByText("Read-only visitor")).toBeVisible();
    const publicSafeProof = visitorPage.getByRole("article").filter({
      hasText: rejectedFixture.task
    });
    await expect(publicSafeProof.getByText("Not verified", { exact: true })).toBeVisible();
    await expect(visitorPage.getByText(privateReason)).toHaveCount(0);
    await expect(
      publicSafeProof.getByRole("link", {
        name: "Connect wallet to report proof by Phase 4 builder"
      })
    ).toBeVisible();
    await expect(
      publicSafeProof.getByRole("img", { name: "Creator-only evidence" })
    ).toHaveCount(0);

    await expect(
      creatorFinancialEntitlements({
        creatorUserId,
        podIds: [rejectedFixture.podId]
      })
    ).resolves.toEqual({
      memberships: 0,
      deposits: 0,
      ledgerEntries: 0,
      refundTransfers: 0
    });
  } finally {
    await memberContext.close();
    await peerContext.close();
    await visitorContext.close();
  }
});

test("creator review timeout protects the participant and rejects late decisions", async ({
  browser,
  context
}) => {
  test.setTimeout(60_000);
  const creatorWallet = await authenticate(context);
  const memberContext = await browser.newContext();
  const peerContext = await browser.newContext();
  const creatorPage = await context.newPage();
  const memberPage = await memberContext.newPage();
  for (const page of [creatorPage, memberPage]) {
    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(10_000);
  }
  try {
    const memberWallet = await authenticate(memberContext);
    const peerWallet = await authenticate(peerContext);
    const creatorUserId = await userIdForWallet(creatorWallet);
    const memberUserId = await userIdForWallet(memberWallet);
    const peerUserId = await userIdForWallet(peerWallet);
    const effectiveNow = await repository.getEffectiveTime(new Date());
    const opensAt = new Date(effectiveNow.getTime() + 60_000);
    const activityNow = new Date(opensAt.getTime() + 60_000);
    await repository.advanceClock({
      effectiveTime: activityNow,
      reason: "Phase 4 creator timeout gate",
      actor: `playwright-phase4-${randomUUID()}`,
      realNow: new Date()
    });
    const timeoutFixture = await createReviewingSubmission({
      creatorUserId,
      memberUserId,
      peerUserId,
      opensAt,
      now: activityNow,
      label: "Ship the hard deadline timeout projection"
    });
    await creatorPage.goto(`${baseUrl}/pods/${timeoutFixture.podId}/admin/reviews`);
    await expect(
      creatorPage.getByRole("heading", { name: "1 proof to review." })
    ).toBeVisible();
    const hardDeadlineAt = timeoutFixture.submission.reviewHardDeadlineAt;
    if (!hardDeadlineAt) throw new Error("Review hard deadline was not persisted");
    await repository.advanceClock({
      effectiveTime: hardDeadlineAt,
      reason: "Phase 4 creator review hard deadline gate",
      actor: `playwright-phase4-${randomUUID()}`,
      realNow: new Date()
    });
    expect(await repository.protectTimedOutReviews(hardDeadlineAt)).toEqual({
      protectedSubmissions: 1
    });
    await creatorPage.goto(
      `${baseUrl}/pods/${timeoutFixture.podId}/admin/reviews/${timeoutFixture.submission.id}`
    );
    await expect(
      creatorPage.getByText("Protected after review timeout", { exact: true })
    ).toBeVisible();
    await expect(creatorPage.getByRole("button", { name: "Approve proof" })).toHaveCount(0);
    await expect(creatorPage.getByRole("button", { name: "Reject proof" })).toHaveCount(0);
    const lateDecision = await context.request.post(
      `${baseUrl}/api/pods/${timeoutFixture.podId}/admin/reviews/${timeoutFixture.submission.id}/decision`,
      { data: { decision: "approve" } }
    );
    expect(lateDecision.status()).toBe(409);
    await memberPage.goto(
      `${baseUrl}/pods/${timeoutFixture.podId}/submissions/${timeoutFixture.submission.id}`
    );
    await expect(
      memberPage.getByRole("heading", { name: "Protected after review timeout" })
    ).toBeVisible();

    await expect(
      creatorFinancialEntitlements({
        creatorUserId,
        podIds: [timeoutFixture.podId]
      })
    ).resolves.toEqual({
      memberships: 0,
      deposits: 0,
      ledgerEntries: 0,
      refundTransfers: 0
    });
  } finally {
    await memberContext.close();
    await peerContext.close();
  }
});
