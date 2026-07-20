import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

import { KeyPair, PrivateKey } from "@nimiq/core";
import { expect, test, type BrowserContext } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3410";
const signedMessagePrefix = "\x16Nimiq Signed Message:\n";
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
  return new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://pods:pods-local-only@127.0.0.1:54329/pods"
  });
}

async function deleteTestUsersByWalletAddress(walletAddresses: string[]) {
  if (walletAddresses.length === 0) return;
  const pool = databasePool();
  try {
    await pool.query("DELETE FROM users WHERE wallet_address = ANY($1::text[])", [walletAddresses]);
  } finally {
    await pool.end();
  }
}

test.afterEach(async () => {
  const walletAddresses = [...testWalletAddresses];
  testWalletAddresses.clear();
  await deleteTestUsersByWalletAddress(walletAddresses);
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
    await expect(memberPage.getByText("Verification is performed by the Pods team.", { exact: false })).toBeVisible();
    await expect(memberPage.getByText("If Pods does not review within 24 hours", { exact: false })).toBeVisible();
    const commitButton = memberPage.getByRole("button", { name: "Commit 0.5 NIM" });
    await expect(commitButton).toBeDisabled();
    await memberPage.getByRole("checkbox", { name: /I accept the frozen terms/ }).check();
    await commitButton.click();
    await expect(memberPage.locator(".funding-error")).toContainText("Wallet closed for test");

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
