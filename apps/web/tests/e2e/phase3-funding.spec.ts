import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

import { KeyPair, PrivateKey } from "@nimiq/core";
import { expect, test, type BrowserContext } from "@playwright/test";
import { createPodsRepository } from "@pods/db";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3410";
const signedMessagePrefix = "\x16Nimiq Signed Message:\n";
const testWalletAddresses = new Set<string>();
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const phase3Repository = createPodsRepository(databaseUrl);

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
  return new Pool({
    connectionString: databaseUrl
  });
}

async function deleteTestUsersByWalletAddress(walletAddresses: string[]) {
  const pool = databasePool();
  try {
    await pool.query("DELETE FROM clock_events WHERE actor LIKE 'playwright-%'");
    if (walletAddresses.length > 0) {
      await pool.query(
        `DELETE FROM pods
         WHERE creator_user_id IN (
           SELECT id FROM users WHERE wallet_address = ANY($1::text[])
         )`,
        [walletAddresses]
      );
      await pool.query("DELETE FROM users WHERE wallet_address = ANY($1::text[])", [walletAddresses]);
    }
  } finally {
    await pool.end();
  }
}

test.afterEach(async () => {
  const walletAddresses = [...testWalletAddresses];
  testWalletAddresses.clear();
  await deleteTestUsersByWalletAddress(walletAddresses);
});

test.afterAll(async () => {
  await phase3Repository.close();
});

function dateInput(daysFromToday: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
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
  const signedPayload = Buffer.concat([
    Buffer.from(signedMessagePrefix, "utf8"),
    Buffer.from(String(messageBytes.byteLength), "utf8"),
    Buffer.from(messageBytes)
  ]);
  const digest = createHash("sha256").update(signedPayload).digest();
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

async function publishAndAccept(creatorContext: BrowserContext, memberContext: BrowserContext) {
  const create = await creatorContext.request.post(`${baseUrl}/api/pods/drafts`, {
    data: { templateId: "build" }
  });
  expect(create.ok()).toBe(true);
  const { draft } = (await create.json()) as { draft: { id: string } };
  const activity = {
    name: `Fund Pods ${randomUUID().slice(0, 6)}`,
    purpose: "Prove the exact NIM commitment, independent chain observation, and durable funding status.",
    startDate: dateInput(14),
    endDate: dateInput(18),
    timeZone: "UTC",
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    config: {
      projectTheme: "Pods Phase 3",
      allowedDeliverables: ["pull_request", "live_artifact"],
      commitmentCutoff: "09:00"
    }
  };
  for (const [step, value] of [
    ["activity", activity],
    ["community", {
      visibility: "public",
      minParticipants: 2,
      maxParticipants: 4,
      applicationQuestions: ["What will you ship?"]
    }],
    ["commitment", { nimPerOccurrence: "0.1" }]
  ] as const) {
    const saved = await creatorContext.request.patch(`${baseUrl}/api/pods/drafts/${draft.id}`, {
      data: { step, value }
    });
    expect(saved.ok()).toBe(true);
  }
  const published = await creatorContext.request.post(
    `${baseUrl}/api/pods/drafts/${draft.id}/publish`,
    { data: { acceptedFrozenContract: true } }
  );
  expect(published.ok()).toBe(true);
  const applied = await memberContext.request.post(`${baseUrl}/api/pods/${draft.id}/applications`, {
    data: { answers: ["A tested NIM funding flow"] }
  });
  expect(applied.ok()).toBe(true);
  const { application } = (await applied.json()) as { application: { id: string } };
  const accepted = await creatorContext.request.patch(
    `${baseUrl}/api/pods/${draft.id}/applications/${application.id}`,
    { data: { decision: "accept" } }
  );
  expect(accepted.ok()).toBe(true);
  return draft.id;
}

function dateFrom(anchor: Date, days: number) {
  const date = new Date(anchor);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function publishCutoffPod(input: {
  creatorContext: BrowserContext;
  name: string;
  minParticipants: number;
  maxParticipants: number;
  startDate: string;
  endDate: string;
}) {
  const create = await input.creatorContext.request.post(`${baseUrl}/api/pods/drafts`, {
    data: { templateId: "build" }
  });
  expect(create.ok()).toBe(true);
  const { draft } = (await create.json()) as { draft: { id: string } };
  for (const [step, value] of [
    ["activity", {
      name: input.name,
      purpose: "Prove deterministic roster lock and a full principal return.",
      startDate: input.startDate,
      endDate: input.endDate,
      timeZone: "UTC",
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      config: {
        projectTheme: "Pods Phase 3B",
        allowedDeliverables: ["pull_request"],
        commitmentCutoff: "09:00"
      }
    }],
    ["community", {
      visibility: "public",
      minParticipants: input.minParticipants,
      maxParticipants: input.maxParticipants,
      applicationQuestions: ["What will you ship?"]
    }],
    ["commitment", { nimPerOccurrence: "0.1" }]
  ] as const) {
    const saved = await input.creatorContext.request.patch(
      `${baseUrl}/api/pods/drafts/${draft.id}`,
      { data: { step, value } }
    );
    expect(saved.ok()).toBe(true);
  }
  const published = await input.creatorContext.request.post(
    `${baseUrl}/api/pods/drafts/${draft.id}/publish`,
    { data: { acceptedFrozenContract: true } }
  );
  expect(published.ok()).toBe(true);
  return draft.id;
}

async function applyAndAcceptCutoffMember(input: {
  creatorContext: BrowserContext;
  memberContext: BrowserContext;
  podId: string;
}) {
  const applied = await input.memberContext.request.post(
    `${baseUrl}/api/pods/${input.podId}/applications`,
    { data: { answers: ["A tested Phase 3B activity"] } }
  );
  expect(applied.ok()).toBe(true);
  const { application } = (await applied.json()) as { application: { id: string } };
  const accepted = await input.creatorContext.request.patch(
    `${baseUrl}/api/pods/${input.podId}/applications/${application.id}`,
    { data: { decision: "accept" } }
  );
  expect(accepted.ok()).toBe(true);
}

async function userIdForWallet(walletAddress: string) {
  const pool = databasePool();
  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE wallet_address = $1",
      [walletAddress]
    );
    const id = result.rows[0]?.id;
    if (typeof id !== "string") throw new Error("Authenticated test user was not found");
    return id;
  } finally {
    await pool.end();
  }
}

async function creditCutoffMember(input: {
  podId: string;
  userId: string;
  walletAddress: string;
  blockNumber: number;
  transactionIndex: number;
  finalizedAt: Date;
}) {
  const now = new Date();
  const transactionHash = randomBytes(32).toString("hex");
  const intent = await phase3Repository.createDepositIntent({
    podId: input.podId,
    userId: input.userId,
    walletAddress: input.walletAddress,
    treasuryAddress: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
    network: "testnet",
    reference: `pods-${randomBytes(12).toString("hex")}`,
    now
  });
  await phase3Repository.recordDepositWalletAttempt({
    intentId: intent.id,
    userId: input.userId,
    event: "open",
    now
  });
  await phase3Repository.recordDepositTransactionHint({
    intentId: intent.id,
    userId: input.userId,
    transactionHash,
    now
  });
  await phase3Repository.recordObservedDeposit({
    intentId: intent.id,
    transactionHash,
    observedFrom: input.walletAddress,
    observedFromType: 0,
    observedRelatedAddresses: [
      input.walletAddress,
      "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A"
    ],
    blockNumber: input.blockNumber,
    transactionIndex: input.transactionIndex,
    transactionBatch: 100,
    now
  });
  await phase3Repository.finalizeObservedDeposit({
    intentId: intent.id,
    now: input.finalizedAt
  });
  await phase3Repository.creditFinalizedDeposit({
    intentId: intent.id,
    now: input.finalizedAt
  });
  return intent;
}

async function confirmTestRefund(legId: string, now: Date) {
  await phase3Repository.markRefundTransferPrepared({
    legId,
    rawTransactionHex: randomBytes(32).toString("hex"),
    transactionHash: randomBytes(32).toString("hex"),
    validityStartHeight: 900,
    now
  });
  await phase3Repository.markRefundTransferBroadcast({ legId, now });
  await phase3Repository.confirmRefundTransfer({ legId, now });
}

test("funding commitment survives rejection, submission, refresh, and owner isolation", async ({ browser, context }) => {
  await authenticate(context);
  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  const strangerContext = await browser.newContext();
  const strangerPage = await strangerContext.newPage();
  try {
    const memberWallet = await authenticate(memberContext);
    await authenticate(strangerContext);
    const podId = await publishAndAccept(context, memberContext);
    const transactionHash = randomBytes(32).toString("hex");

    await memberPage.addInitScript(({ hash }) => {
      (window as typeof window & { __podsPaymentMode?: "reject" | "success" }).__podsPaymentMode = "reject";
      Object.defineProperty(window, "nimiq", {
        configurable: true,
        value: {
          sendBasicTransactionWithData: async () =>
            (window as typeof window & { __podsPaymentMode?: string }).__podsPaymentMode === "reject"
              ? { error: { type: "rejected", message: "Wallet closed for test" } }
              : hash
        }
      });
    }, { hash: transactionHash });

    await memberPage.goto(`${baseUrl}/pods/${podId}/fund`);
    await expect(memberPage.getByRole("heading", { name: "Back your place." })).toBeVisible();
    await expect(memberPage.getByText("5 scheduled occurrences")).toBeVisible();
    await expect(memberPage.getByText("0.1 NIM per occurrence")).toBeVisible();
    await expect(memberPage.getByText("0.5 NIM", { exact: true }).first()).toBeVisible();
    await expect(memberPage.getByText("The Pod creator reviews member proofs.", { exact: false })).toBeVisible();
    await expect(memberPage.getByText("If the creator does not review within 24 hours", { exact: false })).toBeVisible();
    expect(await memberPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const commitButton = memberPage.getByRole("button", { name: "Commit 0.5 NIM" });
    await expect(commitButton).toBeDisabled();
    await memberPage.getByRole("checkbox", { name: /I accept the frozen terms/ }).check();
    await commitButton.click();
    await expect(memberPage.locator(".funding-error")).toContainText("Wallet closed for test");
    await expect(commitButton).toHaveText("Commit 0.5 NIM");
    await memberPage.waitForLoadState("networkidle");

    const pool = databasePool();
    try {
      const result = await pool.query(
        `SELECT count(*)::int AS credits
         FROM ledger_entries le
         JOIN memberships m ON m.id = le.membership_id
         JOIN users u ON u.id = m.user_id
         WHERE u.wallet_address = $1 AND le.movement_type = 'deposit_credit'`,
        [memberWallet]
      );
      expect(result.rows[0]?.credits).toBe(0);
    } finally {
      await pool.end();
    }

    await memberPage.goto(`${baseUrl}/discover?template=build`);
    const recoveryCard = memberPage.locator(".public-pod-card").filter({ hasText: "Fund Pods" });
    await expect(recoveryCard.getByText("Funding needs attention")).toBeVisible();
    await expect(recoveryCard.getByRole("link", { name: "Retry funding" })).toBeVisible();
    await memberPage.waitForLoadState("networkidle");
    await memberPage.goto(`${baseUrl}/today`);
    await expect(memberPage.getByRole("heading", { name: "Your funding attempt did not complete." })).toBeVisible();
    await memberPage.getByRole("link", { name: "Retry funding" }).click();

    await memberPage.evaluate(() => {
      (window as typeof window & { __podsPaymentMode?: "reject" | "success" }).__podsPaymentMode = "success";
    });
    await memberPage.getByRole("checkbox", { name: /I accept the frozen terms/ }).check();
    await memberPage.getByRole("button", { name: "Commit 0.5 NIM" }).click();
    await expect(memberPage).toHaveURL(new RegExp(`/pods/${podId}/fund/status\\?intent=`));
    await expect(memberPage.getByRole("status")).toContainText("Transaction submitted");
    await expect(memberPage.getByText(transactionHash)).toBeVisible();
    const statusUrl = memberPage.url();

    await memberPage.reload();
    await expect(memberPage.getByRole("status")).toContainText("Transaction submitted");
    await expect(memberPage.getByText(transactionHash)).toBeVisible();

    await memberPage.goto(`${baseUrl}/my-pods`);
    const participantPod = memberPage.locator(".my-pod-row").filter({ hasText: "Fund Pods" });
    await expect(participantPod.getByText("Funding in progress")).toBeVisible();
    await participantPod.getByRole("link").click();
    await expect(memberPage).toHaveURL(statusUrl);
    await expect(memberPage.getByText(transactionHash)).toBeVisible();

    await strangerPage.goto(statusUrl);
    await expect(strangerPage.getByRole("heading", { name: "This path is unavailable." })).toBeVisible();
  } finally {
    await memberContext.close();
    await strangerContext.close();
  }
});

test("audited cutoff connects roster lock, exclusion, cancellation, and refund rooms", async ({ browser, context }) => {
  await authenticate(context);
  const memberContexts = await Promise.all(
    Array.from({ length: 4 }, async () => {
      const memberContext = await browser.newContext();
      const walletAddress = await authenticate(memberContext);
      return { memberContext, walletAddress, page: await memberContext.newPage() };
    })
  );
  try {
    const currentEffective = await phase3Repository.getEffectiveTime(new Date());
    const anchor = currentEffective.getTime() > Date.now()
      ? currentEffective
      : new Date();
    const startDate = dateFrom(anchor, 14);
    const endDate = dateFrom(anchor, 18);
    const capacityPodId = await publishCutoffPod({
      creatorContext: context,
      name: `Capacity Pod ${randomUUID().slice(0, 6)}`,
      minParticipants: 2,
      maxParticipants: 2,
      startDate,
      endDate
    });
    const cancelledPodId = await publishCutoffPod({
      creatorContext: context,
      name: `Return Pod ${randomUUID().slice(0, 6)}`,
      minParticipants: 2,
      maxParticipants: 4,
      startDate,
      endDate
    });
    for (const member of memberContexts.slice(0, 3)) {
      await applyAndAcceptCutoffMember({
        creatorContext: context,
        memberContext: member.memberContext,
        podId: capacityPodId
      });
    }
    await applyAndAcceptCutoffMember({
      creatorContext: context,
      memberContext: memberContexts[3]!.memberContext,
      podId: cancelledPodId
    });

    const capacityPod = await phase3Repository.getPublicPod(capacityPodId, new Date());
    const cancelledPod = await phase3Repository.getPublicPod(cancelledPodId, new Date());
    if (!capacityPod || !cancelledPod) throw new Error("Published cutoff fixtures were not found");
    const cutoffAt = capacityPod.firstOccurrenceOpensAt;
    const finalizedAt = new Date(cutoffAt.getTime() - 60_000);
    const funded: Array<Awaited<ReturnType<typeof creditCutoffMember>>> = [];
    for (const [index, member] of memberContexts.slice(0, 3).entries()) {
      funded.push(await creditCutoffMember({
        podId: capacityPodId,
        userId: await userIdForWallet(member.walletAddress),
        walletAddress: member.walletAddress,
        blockNumber: 200 + index,
        transactionIndex: 0,
        finalizedAt
      }));
    }
    const cancelledIntent = await creditCutoffMember({
      podId: cancelledPodId,
      userId: await userIdForWallet(memberContexts[3]!.walletAddress),
      walletAddress: memberContexts[3]!.walletAddress,
      blockNumber: 300,
      transactionIndex: 0,
      finalizedAt
    });

    await phase3Repository.advanceClock({
      effectiveTime: cutoffAt,
      reason: "Phase 3B isolated browser cutoff gate",
      actor: `playwright-${randomUUID()}`,
      realNow: new Date()
    });
    const effectiveNow = await phase3Repository.getEffectiveTime(new Date());
    const capacityResult = await phase3Repository.applyPodCutoff({
      podId: capacityPodId,
      now: effectiveNow
    });
    const cancelledResult = await phase3Repository.applyPodCutoff({
      podId: cancelledPodId,
      now: effectiveNow
    });
    expect(capacityResult.includedMembershipIds).toHaveLength(2);
    expect(capacityResult.refundLegIds).toHaveLength(1);
    expect(cancelledResult.podState).toBe("cancelled_refunding");
    expect(cancelledResult.refundLegIds).toHaveLength(1);
    await confirmTestRefund(capacityResult.refundLegIds[0]!, effectiveNow);
    await confirmTestRefund(cancelledResult.refundLegIds[0]!, effectiveNow);

    const includedPage = memberContexts[0]!.page;
    await includedPage.goto(`${baseUrl}/today`);
    await expect(includedPage.getByRole("heading", { name: "You are part of this Pod." })).toBeVisible();
    await includedPage.getByRole("link", { name: "Open Pod" }).click();
    await expect(includedPage).toHaveURL(`${baseUrl}/pods/${capacityPodId}/today`);
    await expect(includedPage.getByText("Place secured")).toBeVisible();
    await expect(includedPage.getByText("2 confirmed")).toBeVisible();

    const excludedPage = memberContexts[2]!.page;
    await excludedPage.goto(`${baseUrl}/pods/${capacityPodId}/today`);
    await expect(excludedPage.getByRole("status")).toContainText("Refund confirmed");
    await expect(excludedPage.locator(".refund-rail").getByText("0.5 NIM", { exact: true })).toBeVisible();

    const cancelledPage = memberContexts[3]!.page;
    await cancelledPage.goto(`${baseUrl}/pods/${cancelledPodId}/today`);
    await expect(cancelledPage.getByRole("status")).toContainText("Refund confirmed");
    await expect(
      cancelledPage.locator(".refund-rail").getByText(
        cancelledIntent.amountLuna / 100_000 + " NIM",
        { exact: true }
      )
    ).toBeVisible();

    const creatorPage = await context.newPage();
    await creatorPage.goto(`${baseUrl}/pods/${capacityPodId}/admin/funding`);
    await expect(creatorPage.getByText("2 of 2 confirmed")).toBeVisible();
    await expect(creatorPage.locator(".creator-funding-list article")).toHaveCount(3);
    await expect(creatorPage.locator("main")).not.toContainText(memberContexts[0]!.walletAddress);
    await expect(creatorPage.locator("main")).not.toContainText(funded[0]!.reference);
  } finally {
    await Promise.all(memberContexts.map(({ memberContext }) => memberContext.close()));
  }
});
