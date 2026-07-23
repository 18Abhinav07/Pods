import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

import { KeyPair, PrivateKey } from "@nimiq/core";
import { createPodsRepository } from "@pods/db";
import { expect, test, type BrowserContext } from "@playwright/test";
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
    version: 1,
    templateId: "build",
    evidenceMode: "per_occurrence_commitment",
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
      applicationQuestions: []
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

test("Build and Ship runs from task lock through creator approval", async ({ browser, context }) => {
  const creatorWallet = await authenticate(context);
  const memberContext = await browser.newContext();
  const peerContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  try {
    const memberWallet = await authenticate(memberContext);
    const peerWallet = await authenticate(peerContext);
    const effectiveNow = await repository.getEffectiveTime(new Date());
    const opensAt = new Date(effectiveNow.getTime() + 60_000);
    const fixture = await seedLockedBuildPod({
      creatorUserId: await userIdForWallet(creatorWallet),
      memberUserIds: [
        await userIdForWallet(memberWallet),
        await userIdForWallet(peerWallet)
      ],
      opensAt
    });
    const activityNow = new Date(opensAt.getTime() + 60_000);
    await repository.advanceClock({
      effectiveTime: activityNow,
      reason: "Phase 4 activity browser gate",
      actor: `playwright-phase4-${randomUUID()}`,
      realNow: new Date()
    });
    expect(await repository.runOccurrenceTransitions(activityNow)).toMatchObject({
      activatedPods: 1,
      activatedMemberships: 2
    });

    await memberPage.goto(`${baseUrl}/today`);
    await expect(memberPage.getByRole("heading", { name: "Name the work before you build." })).toBeVisible();
    await memberPage.getByRole("link", { name: "Lock today's task" }).click();
    expect(await memberPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await memberPage.getByLabel("Today's task").fill(
      "Ship the participant activity screen with private evidence and reviewer states."
    );
    await memberPage.getByLabel("Visible deliverable").selectOption("pull_request");
    await memberPage.getByRole("button", { name: "Lock this task" }).click();
    await expect(memberPage.getByText("Locked task")).toBeVisible();

    await memberPage.getByLabel("Result summary").fill(
      "Shipped the participant occurrence flow, private image handling, and manual review states."
    );
    await memberPage.getByLabel("Public artifact URL").fill(
      "https://github.com/18Abhinav07/Pods/pull/42"
    );
    await memberPage.getByRole("button", { name: "Save evidence draft" }).click();
    await expect(memberPage.getByText("Draft saved privately")).toBeVisible();
    const evidenceImage = await sharp({
      create: { width: 640, height: 480, channels: 3, background: "#3b5ccc" }
    }).png().toBuffer();
    await memberPage.getByLabel("Optional supporting image").setInputFiles({
      name: "build-proof.png",
      mimeType: "image/png",
      buffer: evidenceImage
    });
    await expect(memberPage.getByText("Image secured")).toBeVisible();
    await memberPage.getByRole("button", { name: "Review and submit" }).click();
    await expect(memberPage.getByRole("heading", { name: "Creator review in progress" })).toBeVisible();

    const creatorQueue = await context.request.get(
      `${baseUrl}/api/pods/${fixture.podId}/admin/reviews`
    );
    expect(creatorQueue.ok()).toBe(true);
    const queuePayload = (await creatorQueue.json()) as {
      reviews: Array<{
        submission: { id: string; state: string };
        commitment: { task: string };
        evidenceAvailable: boolean;
      }>;
    };
    const pendingReview = queuePayload.reviews.find(
      ({ commitment }) => commitment.task ===
        "Ship the participant activity screen with private evidence and reviewer states."
    );
    expect(pendingReview).toMatchObject({
      submission: { state: "reviewing" },
      evidenceAvailable: true
    });
    if (!pendingReview) throw new Error("Creator review queue did not include the submission");

    const creatorEvidence = await context.request.get(
      `${baseUrl}/api/pods/${fixture.podId}/admin/reviews/${pendingReview.submission.id}/evidence`
    );
    expect(creatorEvidence.ok()).toBe(true);
    expect(creatorEvidence.headers()["content-type"]).toBe("image/webp");
    expect((await creatorEvidence.body()).byteLength).toBeGreaterThan(0);

    const creatorDecision = await context.request.post(
      `${baseUrl}/api/pods/${fixture.podId}/admin/reviews/${pendingReview.submission.id}/decision`,
      {
        data: {
          decision: "approve",
          note: "The public pull request visibly completes the locked participant task."
        }
      }
    );
    expect(creatorDecision.ok()).toBe(true);
    await expect(creatorDecision.json()).resolves.toMatchObject({
      submission: {
        id: pendingReview.submission.id,
        state: "approved"
      }
    });

    await memberPage.reload();
    await expect(memberPage.getByRole("heading", { name: "Work approved" })).toBeVisible();
    await memberPage.goto(
      `${baseUrl}/pods/${fixture.podId}/submissions/${pendingReview.submission.id}`
    );
    await expect(memberPage.getByRole("heading", { name: "Work approved" })).toBeVisible();
    await expect(memberPage.getByText(
      "The Pod creator approved this proof. It counts toward your progress and streak."
    )).toBeVisible();
    await memberPage.goto(`${baseUrl}/today`);
    await expect(memberPage.getByRole("heading", { name: "Your work is counted." })).toBeVisible();
    await memberPage.goto(`${baseUrl}/pods/${fixture.podId}/room`);
    await expect(
      memberPage.getByRole("region", { name: "Current Pod activity" })
        .getByText("Proof submitted")
    ).toBeVisible();
  } finally {
    await memberContext.close();
    await peerContext.close();
  }
});
