import { createHash, randomBytes, randomUUID } from "node:crypto";
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

async function publishPod(context: BrowserContext, visibility: "public" | "private") {
  const suffix = randomUUID().slice(0, 6);
  const name = `${visibility === "public" ? "Public" : "Private"} Ship Circle ${suffix}`;
  const create = await context.request.post(`${baseUrl}/api/pods/drafts`, {
    data: { templateId: "build" }
  });
  expect(create.ok()).toBe(true);
  const { draft } = (await create.json()) as { draft: { id: string } };
  const activity = {
    name,
    purpose: "Ship one concrete, visible product improvement at every scheduled group occurrence.",
    startDate: dateInput(14),
    endDate: dateInput(18),
    timeZone: "UTC",
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    config: {
      projectTheme: "Pods Phase 2",
      allowedDeliverables: ["pull_request", "live_artifact"],
      commitmentCutoff: "09:00"
    }
  };
  const community = visibility === "public"
    ? {
        visibility,
        minParticipants: 2,
        maxParticipants: 4,
        applicationQuestions: ["What will you ship?", "Why does this cadence fit?"]
      }
    : { visibility, minParticipants: 2, maxParticipants: 4, inviteExpiryHours: 72 };
  for (const [step, value] of [
    ["activity", activity],
    ["community", community],
    ["commitment", { nimPerOccurrence: "0.1" }]
  ] as const) {
    const saved = await context.request.patch(`${baseUrl}/api/pods/drafts/${draft.id}`, {
      data: { step, value }
    });
    expect(saved.ok()).toBe(true);
  }
  const published = await context.request.post(`${baseUrl}/api/pods/drafts/${draft.id}/publish`, {
    data: { acceptedFrozenContract: true }
  });
  expect(published.ok()).toBe(true);
  return { id: draft.id, name };
}

test("public enrollment works from discovery through accepted funding handoff", async ({ browser, context, page }) => {
  await authenticate(context);
  const pod = await publishPod(context, "public");

  await page.goto(`${baseUrl}/discover?template=build`);
  const creatorCard = page.locator(".public-pod-card").filter({ hasText: pod.name });
  await expect(creatorCard.getByRole("link", { name: "Manage enrollment" })).toBeVisible();
  await expect(creatorCard.getByRole("link", { name: "Apply to join" })).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  await page.goto(`${baseUrl}/pods/${pod.id}`);
  await expect(page.getByRole("link", { name: "Manage enrollment" })).toHaveAttribute(
    "href",
    `/pods/${pod.id}/admin`
  );
  await expect(page.getByRole("link", { name: "Apply to join" })).toHaveCount(0);

  const applicantContext = await browser.newContext();
  const applicantPage = await applicantContext.newPage();
  try {
    await authenticate(applicantContext);
    await applicantPage.goto(`${baseUrl}/discover?template=build`);
    const card = applicantPage.locator(".public-pod-card").filter({ hasText: pod.name });
    await expect(card).toBeVisible();
    await expect(card.getByText("0.5 NIM upfront")).toBeVisible();
    await expect(card.getByText("Open to apply")).toBeVisible();
    await card.getByRole("link", { name: "View Pod" }).click();
    await expect(applicantPage.getByText("Applying does not reserve a place.", { exact: false })).toBeVisible();
    await applicantPage.getByRole("link", { name: "Apply to join" }).click();
    await applicantPage.getByLabel("What will you ship?").fill("A tested mobile enrollment flow");
    await applicantPage.getByLabel("Why does this cadence fit?").fill("The five-day cadence matches my build week");
    await applicantPage.getByLabel(/I understand that applying/).check();
    await applicantPage.getByRole("button", { name: "Send application" }).click();
    await expect(applicantPage).toHaveURL(new RegExp(`/applications\\?sent=1&pod=${pod.id}$`));
    await expect(applicantPage.getByText("Application pending")).toBeVisible();
    await applicantPage.goto(`${baseUrl}/discover?template=build`);
    const appliedCard = applicantPage.locator(".public-pod-card").filter({ hasText: pod.name });
    await expect(appliedCard.getByText("Application pending")).toBeVisible();
    await expect(appliedCard.getByRole("link", { name: "View application" })).toBeVisible();
    await expect(appliedCard.getByRole("link", { name: "Apply to join" })).toHaveCount(0);

    await page.goto(`${baseUrl}/pods/${pod.id}/admin/applications`);
    await expect(page.getByText("A tested mobile enrollment flow")).toBeVisible();
    const acceptButton = page.getByRole("button", { name: "Accept" });
    await expect(acceptButton).toHaveCSS("background-color", "rgb(59, 92, 204)");
    await expect(acceptButton).toHaveCSS("color", "rgb(255, 255, 255)");
    await acceptButton.click();
    await expect(page.getByText("Queue clear")).toBeVisible();

    await applicantPage.goto(`${baseUrl}/applications`);
    await expect(applicantPage.getByText("Accepted, funding required")).toBeVisible();
    await applicantPage.goto(`${baseUrl}/discover?template=build`);
    const acceptedCard = applicantPage.locator(".public-pod-card").filter({ hasText: pod.name });
    await expect(acceptedCard.getByText("Accepted, funding required")).toBeVisible();
    await acceptedCard.getByRole("link", { name: "Continue to funding" }).click();
    await expect(applicantPage.getByRole("heading", { name: "Back your place." })).toBeVisible();
    await expect(applicantPage.getByRole("button", { name: "Commit 0.5 NIM" })).toBeDisabled();

    await applicantPage.goto(`${baseUrl}/today`);
    await expect(applicantPage.getByRole("heading", { name: "Your accepted place is waiting for funding." })).toBeVisible();
    await applicantPage.goto(`${baseUrl}/pods/${pod.id}/admin`);
    await expect(applicantPage.getByText("This path is unavailable.")).toBeVisible();
  } finally {
    await applicantContext.close();
  }
});

test("private enrollment stays hidden and consumes one opaque invitation once", async ({ browser, context, page }) => {
  await authenticate(context);
  const pod = await publishPod(context, "private");
  await page.goto(`${baseUrl}/discover`);
  await expect(page.getByText(pod.name)).toHaveCount(0);
  await page.goto(`${baseUrl}/pods/${pod.id}`);
  await expect(page.getByText("This path is unavailable.")).toBeVisible();

  await page.goto(`${baseUrl}/pods/${pod.id}/admin`);
  await page.getByRole("button", { name: "Create link" }).click();
  const linkField = page.getByLabel("New link, shown once");
  await expect(linkField).toBeVisible();
  const inviteUrl = await linkField.inputValue();
  expect(inviteUrl).toMatch(/\/invite#[A-Za-z0-9_-]{43}$/);

  const inviteeContext = await browser.newContext();
  const inviteePage = await inviteeContext.newPage();
  try {
    await authenticate(inviteeContext);
    await inviteePage.goto(inviteUrl);
    await expect(inviteePage.getByRole("heading", { name: pod.name })).toBeVisible();
    await inviteePage.getByLabel(/I accept this frozen contract/).check();
    await inviteePage.getByRole("button", { name: "Accept private invitation" }).click();
    await expect(inviteePage).toHaveURL(new RegExp(`/pods/${pod.id}/fund$`));
    await expect(inviteePage.getByRole("heading", { name: "Back your place." })).toBeVisible();
    await expect(inviteePage.getByRole("button", { name: "Commit 0.5 NIM" })).toBeDisabled();
  } finally {
    await inviteeContext.close();
  }

  const replayContext = await browser.newContext();
  const replayPage = await replayContext.newPage();
  try {
    await replayPage.goto(inviteUrl);
    await expect(replayPage.getByText("This path is unavailable.")).toBeVisible();
  } finally {
    await replayContext.close();
  }
});
