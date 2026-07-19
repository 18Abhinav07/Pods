import { createHash, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

import { KeyPair, PrivateKey } from "@nimiq/core";
import { expect, test, type BrowserContext } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3410";
const signedMessagePrefix = "\x16Nimiq Signed Message:\n";
const testWalletAddresses = new Set<string>();

type DatabasePool = {
  query(text: string, values?: unknown[]): Promise<unknown>;
  end(): Promise<void>;
};

type DatabasePoolConstructor = new (options: { connectionString: string }) => DatabasePool;

async function deleteTestUsersByWalletAddress(walletAddresses: string[]) {
  if (walletAddresses.length === 0) return;
  const requireFromDatabaseWorkspace = createRequire(
    path.resolve(process.cwd(), "../../packages/db/package.json")
  );
  const { Pool } = requireFromDatabaseWorkspace("pg") as { Pool: DatabasePoolConstructor };
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://pods:pods-local-only@127.0.0.1:54329/pods"
  });
  try {
    await pool.query("DELETE FROM users WHERE wallet_address = ANY($1::text[])", [
      walletAddresses
    ]);
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
}

test("an unauthenticated creator is sent to the signed wallet gate", async ({ page }) => {
  await page.goto("/pods/create/template");

  await expect(page).toHaveURL(/\/connect\?returnTo=%2Fpods%2Fcreate%2Ftemplate$/);
  await expect(page.getByRole("heading", { name: "One signature. No account form." })).toBeVisible();
});

test("the hydrated connect control reaches the injected wallet provider", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "nimiq", {
      configurable: true,
      value: {
        listAccounts: async () => ["NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6"],
        sign: async () => ({ publicKey: "test-public-key", signature: "test-signature" })
      }
    });
  });
  await page.route("**/api/auth/challenge", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: "test-challenge", message: "Sign the Pods test challenge" })
    });
  });
  await page.route("**/api/auth/verify", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Hydrated wallet verification reached" })
    });
  });

  await page.goto("/connect?returnTo=%2Ftoday");
  await page.getByRole("button", { name: "Connect Nimiq wallet" }).click();

  await expect(page.locator(".inline-error")).toContainText(
    "Hydrated wallet verification reached"
  );
});

test("a creator publishes one immutable Build and Ship contract", async ({ context, page }) => {
  await authenticate(context);
  await page.goto("/pods/create/template");
  if (process.env.CAPTURE_PHASE1_VISUAL === "1") {
    await page.waitForTimeout(900);
    await page.screenshot({ path: "/tmp/pods-phase1-template.png", fullPage: true });
  }

  await page.getByRole("button", { name: /Build & Ship/ }).click();
  await expect(page).toHaveURL(/\/pods\/create\/activity\?draft=/);
  if (process.env.CAPTURE_PHASE1_VISUAL === "1") {
    await page.waitForTimeout(900);
    await page.screenshot({ path: "/tmp/pods-phase1-activity.png", fullPage: true });
  }

  await page.getByLabel("Pod name").fill("Build Pods in Public");
  await page
    .getByLabel("Purpose")
    .fill("A focused public builder group that ships one visible product improvement on every scheduled occurrence.");
  await page.getByLabel("Project theme").fill("Pods Cycle I");
  await page.getByLabel("Pull request").check();
  await page.getByLabel("Live artifact").check();
  await page.getByLabel("Daily commitment cutoff").fill("09:00");
  await page.getByLabel("Start date").fill(dateInput(14));
  await page.getByLabel("End date").fill(dateInput(21));
  await page.getByLabel("Pod timezone").fill("Asia/Kolkata");
  await page.getByLabel("Mon").check();
  await page.getByLabel("Wed").check();
  await page.getByLabel("Fri").check();
  await page.getByRole("button", { name: "Continue to community" }).click();

  await expect(page).toHaveURL(/\/pods\/create\/community\?draft=/);
  await page.getByLabel("Public activity").check();
  await page.getByLabel("Minimum people").fill("3");
  await page.getByLabel("Maximum people").fill("8");
  await page
    .getByLabel("Application questions")
    .fill("What will you ship?\nWhere will your proof be visible?");
  await page.getByRole("button", { name: "Continue to commitment" }).click();

  await expect(page).toHaveURL(/\/pods\/create\/commitment\?draft=/);
  await page.getByLabel("NIM per occurrence").fill("0.1");
  await expect(page.getByText("Total upfront")).toBeVisible();
  await page.getByRole("button", { name: "Review frozen contract" }).click();

  await expect(page).toHaveURL(/\/pods\/create\/review\?draft=/);
  await expect(page.getByText("Public, application-based")).toBeVisible();
  await expect(page.getByText("Pods team", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: /Freeze this contract/ }).check();
  await page.getByRole("button", { name: "Publish Pod" }).click();

  await expect(page).toHaveURL(/\/pods\/[^/]+\/rules$/);
  await expect(page.getByText("Contract frozen", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Build Pods in Public", level: 1 })).toBeVisible();
  const fingerprint = await page.locator(".contract-hash code").textContent();
  expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);

  const podId = new URL(page.url()).pathname.split("/")[2];
  const editResponse = await page.request.patch(`/api/pods/drafts/${podId}`, {
    data: {
      step: "commitment",
      value: { nimPerOccurrence: "9" }
    }
  });
  expect(editResponse.status()).toBe(409);
  await page.getByRole("link", { name: "Open creator controls" }).click();
  await expect(page).toHaveURL(new RegExp(`/pods/${podId}/admin$`));
  await page.goto("/my-pods");
  const publishedRow = page.locator(
    `.my-pod-row[href="/pods/${podId}/admin"], .my-pod-row:has(a[href="/pods/${podId}/admin"])`
  );
  await expect(publishedRow.getByText("Creator controls", { exact: true })).toBeVisible();
  await expect(publishedRow.getByText("Enrollment open", { exact: true })).toBeVisible();
  await expect(publishedRow.locator(".template-symbol.template-build svg")).toBeVisible();
});

test("a creator explicitly confirms permanent deletion of an unpublished draft", async ({ context, page }) => {
  await authenticate(context);
  const createResponse = await page.request.post("/api/pods/drafts", {
    data: { templateId: "build" }
  });
  expect(createResponse.ok()).toBe(true);
  const { draft } = (await createResponse.json()) as { draft: { id: string } };

  await page.goto("/my-pods");
  const row = page.locator(
    `.my-pod-row[href*="${draft.id}"], .my-pod-row:has(a[href*="${draft.id}"])`
  );
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Delete draft" }).click();
  await expect(row.getByText("Delete this draft?")).toBeVisible();
  await expect(row.getByText("It has not been published and no funds are involved.")).toBeVisible();
  await row.getByRole("button", { name: "Delete permanently" }).click();

  await expect(row).toHaveCount(0);
  expect((await page.request.get(`/api/pods/drafts/${draft.id}`)).status()).toBe(404);
});
