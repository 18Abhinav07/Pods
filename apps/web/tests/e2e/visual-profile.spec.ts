import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

import { KeyPair, PrivateKey } from "@nimiq/core";
import { expect, test, type BrowserContext } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3410";
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const signedMessagePrefix = "\x16Nimiq Signed Message:\n";
const testWallets = new Set<string>();
const testPodIds = new Set<string>();

type QueryResult = { rows: Array<Record<string, unknown>> };
type DatabasePool = {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
  end(): Promise<void>;
};
type DatabasePoolConstructor = new (options: { connectionString: string }) => DatabasePool;

function databasePool() {
  const requireFromDatabaseWorkspace = createRequire(path.resolve(process.cwd(), "../../packages/db/package.json"));
  const { Pool } = requireFromDatabaseWorkspace("pg") as { Pool: DatabasePoolConstructor };
  return new Pool({ connectionString: databaseUrl });
}

async function authenticate(context: BrowserContext) {
  const keyPair = KeyPair.derive(PrivateKey.fromHex(randomBytes(32).toString("hex")));
  const walletAddress = keyPair.toAddress().toUserFriendlyAddress();
  testWallets.add(walletAddress);
  const challengeResponse = await context.request.post(`${baseUrl}/api/auth/challenge`, { data: { walletAddress } });
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

async function seedActiveBuildPod(walletAddress: string) {
  const pool = databasePool();
  const podId = randomUUID();
  const creatorUserId = randomUUID();
  const creatorWallet = `NQVISUAL${randomBytes(12).toString("hex").toUpperCase()}`;
  const occurrenceId = randomUUID();
  testPodIds.add(podId);
  testWallets.add(creatorWallet);
  try {
    const userResult = await pool.query("SELECT id FROM users WHERE wallet_address = $1", [walletAddress]);
    const userId = userResult.rows[0]?.id;
    if (typeof userId !== "string") throw new Error("Visual test user was not found");
    const clockResult = await pool.query("SELECT effective_time FROM clock_events ORDER BY effective_time DESC LIMIT 1");
    const effectiveValue = clockResult.rows[0]?.effective_time;
    const now = effectiveValue instanceof Date ? effectiveValue : new Date();
    const opensAt = new Date(now.getTime() - 60 * 60 * 1000);
    const closesAt = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const localDate = now.toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO users (id, wallet_address, public_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)`,
      [creatorUserId, creatorWallet, randomBytes(32).toString("hex"), now]
    );
    const contract = {
      version: 1,
      settlementMode: "full_refund_alpha",
      templateId: "build",
      evidenceMode: "per_occurrence_commitment",
      activity: {
        name: "Pods Build Room",
        purpose: "Ship one visible improvement with the community.",
        startDate: localDate,
        endDate: localDate,
        timeZone: "UTC",
        weekdays: [now.getUTCDay() || 7],
        config: {
          projectTheme: "Build Pods in public",
          allowedDeliverables: ["pull_request", "commit"],
          commitmentCutoff: closesAt.toISOString().slice(11, 16)
        }
      },
      community: { visibility: "public", minParticipants: 1, maxParticipants: 5, applicationQuestions: [] },
      commitment: { lunaPerOccurrence: 10_000, occurrenceCount: 1, totalLuna: 10_000 },
      verification: { verifier: "pods_team", targetReviewHours: 12, timeoutProtectionHours: 24 }
    };
    await pool.query(
      `INSERT INTO pods (id, creator_user_id, state, template_id, draft_data, contract_data, contract_hash, published_at, created_at, updated_at)
       VALUES ($1, $2, 'active', 'build', '{}', $3::jsonb, 'visual-today-contract', $4, $4, $4)`,
      [podId, creatorUserId, JSON.stringify(contract), now]
    );
    await pool.query(
      `INSERT INTO memberships (id, pod_id, user_id, admission_source, state, accepted_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'public_application', 'active', $4, $4, $4)`,
      [randomUUID(), podId, userId, now]
    );
    await pool.query(
      `INSERT INTO occurrences (id, pod_id, ordinal, local_date, opens_at, closes_at, commitment_deadline_at, state)
       VALUES ($1, $2, 1, $3, $4, $5, $5, 'open')`,
      [occurrenceId, podId, localDate, opensAt, closesAt]
    );
    return { occurrenceId, podId };
  } finally {
    await pool.end();
  }
}

async function preparePodForDiscover(podId: string) {
  const pool = databasePool();
  try {
    const opensAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const closesAt = new Date(opensAt.getTime() + 24 * 60 * 60 * 1000);
    await pool.query("UPDATE pods SET state = 'enrollment_open', updated_at = NOW() WHERE id = $1", [podId]);
    await pool.query("UPDATE memberships SET state = 'applied', updated_at = NOW() WHERE pod_id = $1", [podId]);
    await pool.query(
      "UPDATE occurrences SET opens_at = $2, closes_at = $3, commitment_deadline_at = $2, state = 'scheduled' WHERE pod_id = $1",
      [podId, opensAt, closesAt]
    );
  } finally {
    await pool.end();
  }
}

async function approveVisualSubmission(occurrenceId: string) {
  const pool = databasePool();
  try {
    const now = new Date();
    await pool.query(
      "UPDATE submissions SET state = 'approved', approved_at = $2, updated_at = $2 WHERE occurrence_id = $1",
      [occurrenceId, now]
    );
  } finally {
    await pool.end();
  }
}

test.afterAll(async () => {
  const pool = databasePool();
  try {
    if (testPodIds.size > 0) {
      await pool.query("DELETE FROM pods WHERE id = ANY($1::uuid[])", [[...testPodIds]]);
    }
    if (testWallets.size > 0) {
      await pool.query("DELETE FROM users WHERE wallet_address = ANY($1::text[])", [[...testWallets]]);
    }
  } finally {
    await pool.end();
  }
});

test("captures the complete first-run wallet and profile journey", async ({ context, page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Show up for what matters." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Connect wallet" })).toHaveAttribute(
    "href",
    "/connect?returnTo=%2Ftoday"
  );
  await page.waitForTimeout(750);
  await page.screenshot({ path: testInfo.outputPath("landing.png"), fullPage: true });

  await page.goto("/connect?returnTo=/today");
  await expect(page.getByRole("button", { name: "Connect Nimiq wallet" })).toBeVisible();
  await page.waitForTimeout(650);
  await page.screenshot({ path: testInfo.outputPath("connect-wallet.png"), fullPage: true });

  await authenticate(context);
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Choose how people know you." })).toBeVisible();
  await expect(page.locator(".onboarding-progress > span")).toHaveCount(3);
  await expect(page.getByText(/wallet verified/i)).toHaveCount(0);
  await page.waitForTimeout(450);
  await page.screenshot({ path: testInfo.outputPath("onboarding-profile.png"), fullPage: true });

  const handle = `new_${randomBytes(3).toString("hex")}`;
  await page.getByRole("button", { name: "Choose moss avatar" }).click();
  await page.getByLabel("Handle").fill(handle);
  await page.getByLabel("Display name").fill("Mira");
  await page.getByRole("button", { name: "Continue to your story" }).click();
  await expect(page.getByRole("heading", { name: "What are you showing up for?" })).toBeVisible();
  await page.getByLabel("Short bio").fill("Building useful rituals with people who show up.");
  await page.getByLabel("Public profile").check();
  await expect(page.getByLabel("Public profile")).toBeChecked();
  await expect(page.getByLabel("Private profile")).not.toBeChecked();
  await expect(page.getByLabel("Public profile").locator("xpath=ancestor::label")).toHaveClass(/is-selected/);
  await page.waitForTimeout(280);
  await page.screenshot({ path: testInfo.outputPath("onboarding-story.png"), fullPage: true });
  await page.getByRole("button", { name: "Continue to privacy" }).click();

  await expect(page.getByRole("heading", { name: "Stay social on your terms." })).toBeVisible();
  await page.getByLabel("Allow message requests").check();
  await expect(page.getByLabel("Allow message requests")).toBeChecked();
  await expect(page.getByLabel("Friends only")).not.toBeChecked();
  await expect(page.getByLabel("Allow message requests").locator("xpath=ancestor::label")).toHaveClass(/is-selected/);
  await page.waitForTimeout(280);
  await page.screenshot({ path: testInfo.outputPath("onboarding-privacy.png"), fullPage: true });
  await page.getByRole("button", { name: "Enter Pods" }).click();
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { name: "Start moving." })).toBeVisible();
});

test("captures a two-wallet message request and direct conversation", async ({ browser, context, page }, testInfo) => {
  const recipientContext = await browser.newContext({
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 664 }
  });
  const recipientPage = await recipientContext.newPage();
  try {
    await authenticate(context);
    await authenticate(recipientContext);
    const senderHandle = `sender_${randomBytes(3).toString("hex")}`;
    const recipientHandle = `maker_${randomBytes(3).toString("hex")}`;
    const senderProfile = await context.request.put(`${baseUrl}/api/profile`, {
      data: {
        handle: senderHandle,
        displayName: "Mira",
        bio: "Building the social layer with care.",
        avatar: { kind: "preset", preset: "moss" },
        visibility: "public",
        dmPolicy: "requests",
        activityStatusVisible: true
      }
    });
    const recipientProfile = await recipientContext.request.put(`${baseUrl}/api/profile`, {
      data: {
        handle: recipientHandle,
        displayName: "Noah",
        bio: "Shipping one useful detail every day.",
        avatar: { kind: "preset", preset: "coral" },
        visibility: "public",
        dmPolicy: "requests",
        activityStatusVisible: true
      }
    });
    expect(senderProfile.ok()).toBe(true);
    expect(recipientProfile.ok()).toBe(true);

    await page.goto(`/people/search?q=${encodeURIComponent(recipientHandle)}`);
    const publicPerson = page.getByRole("link", { name: /Noah/ });
    await expect(publicPerson).toBeVisible();
    await page.waitForTimeout(600);
    await page.screenshot({ path: testInfo.outputPath("people-search-noah.png"), fullPage: true });
    await publicPerson.click();
    await page.getByRole("button", { name: "Follow", exact: true }).click();
    await expect(page.getByRole("button", { name: "Following", exact: true })).toBeVisible();

    await page.goto("/profile");
    await expect(page.getByRole("link", { name: /Noah/ })).toBeVisible();
    await page.waitForTimeout(600);
    await page.screenshot({ path: testInfo.outputPath("profile-following.png"), fullPage: true });

    await page.goto(`/u/${recipientHandle}`);
    await expect(page.getByRole("heading", { name: "Noah" })).toBeVisible();
    await expect(page.locator("details")).toHaveCount(0);
    await page.getByRole("link", { name: "Message request" }).click();
    await expect(page.getByRole("heading", { name: `Introduce yourself to @${recipientHandle}` })).toBeVisible();
    await page.getByLabel("Introduction").fill("I would like to compare notes on making Pod rooms feel alive.");
    await page.waitForTimeout(450);
    await page.screenshot({ path: testInfo.outputPath("dm-introduction.png"), fullPage: true });
    await page.getByRole("button", { name: "Send one request" }).click();
    await expect(page).toHaveURL(/\/messages\?view=requests&sent=1$/);

    await recipientPage.goto(`${baseUrl}/messages?view=requests`);
    await expect(recipientPage.getByText("I would like to compare notes on making Pod rooms feel alive.")).toBeVisible();
    await recipientPage.waitForTimeout(650);
    await recipientPage.screenshot({ path: testInfo.outputPath("dm-request.png"), fullPage: true });
    await recipientPage.getByRole("button", { name: "Accept" }).click();
    await expect(recipientPage).toHaveURL(/\/messages\/[0-9a-f-]+$/);
    await expect(recipientPage.getByText("I would like to compare notes on making Pod rooms feel alive.")).toBeVisible();
    const introduction = "I would like to compare notes on making Pod rooms feel alive.";
    const introductionEntry = recipientPage.locator(".room-entry").filter({ hasText: introduction }).first();
    const introductionId = await introductionEntry.getAttribute("id");
    expect(introductionId).not.toBeNull();
    await introductionEntry.getByRole("button", { name: "More actions for Mira" }).click();
    await recipientPage.getByRole("button", { name: "Reply", exact: true }).click();
    await expect(recipientPage.locator(".reply-context")).toContainText(introduction);
    await recipientPage.getByRole("textbox", { name: "Message" }).fill("Absolutely. The direct thread is ready too.");
    await expect(recipientPage.getByRole("button", { name: "Send message" })).toHaveCSS("background-color", "rgb(217, 237, 114)");
    await recipientPage.screenshot({ path: testInfo.outputPath("dm-reply-composer.png") });
    await recipientPage.getByRole("button", { name: "Send message" }).click();
    await expect(recipientPage.getByText("Absolutely. The direct thread is ready too.")).toBeVisible();
    await expect(recipientPage.getByRole("button", { name: `Reply to Mira: ${introduction}` })).toBeVisible();
    await expect(recipientPage.locator(".delivery-state.is-sending")).toHaveCount(0);
    await recipientPage.waitForTimeout(350);
    await recipientPage.locator(".room-entry").last().scrollIntoViewIfNeeded();
    await recipientPage.screenshot({ path: testInfo.outputPath("dm-thread-recipient.png") });

    await page.goto("/messages?view=people");
    const conversation = page.getByRole("link", { name: /Noah/ });
    await expect(conversation).toBeVisible();
    await page.waitForTimeout(650);
    await page.screenshot({ path: testInfo.outputPath("dm-people-list.png"), fullPage: true });
    await conversation.click();
    await expect(page.getByText("Absolutely. The direct thread is ready too.")).toBeVisible({ timeout: 8_000 });
    const directReply = page.getByRole("button", { name: `Reply to Mira: ${introduction}` });
    await expect(directReply).toBeVisible();
    await directReply.click();
    await expect(page.locator(`[id="${introductionId}"]`)).toHaveClass(/is-reply-target/);
    await page.locator(".room-entry").last().scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("dm-thread-reply.png") });

    await page.goto(`/u/${recipientHandle}`);
    await page.getByRole("button", { name: "Add friend" }).click();
    await expect(page.getByRole("button", { name: "Request sent" })).toBeVisible();

    await recipientPage.goto(`${baseUrl}/messages?view=requests`);
    const friendLane = recipientPage.locator(".friend-request-list");
    await expect(friendLane.getByText("Mira")).toBeVisible();
    await recipientPage.waitForTimeout(500);
    await recipientPage.screenshot({ path: testInfo.outputPath("friend-request.png"), fullPage: true });
    await friendLane.getByRole("button", { name: "Accept" }).click();
    await expect(friendLane).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("link", { name: "Message", exact: true })).toBeVisible();
  } finally {
    await recipientContext.close();
  }
});

test("captures the private profile, settings sheet, and public profile", async ({ context, page }, testInfo) => {
  await authenticate(context);
  const handle = `visual_${randomBytes(3).toString("hex")}`;
  const response = await context.request.put(`${baseUrl}/api/profile`, {
    data: {
      handle,
      displayName: "Ryuk",
      bio: "Building Pods in public, one honest commitment at a time.",
      avatar: { kind: "preset", preset: "ember" },
      visibility: "public",
      dmPolicy: "requests",
      activityStatusVisible: true
    }
  });
  expect(response.ok()).toBe(true);

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Ryuk" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your people" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Search people" })).toHaveAttribute("href", "/people/search");
  await page.screenshot({ path: testInfo.outputPath("profile-private.png"), fullPage: true });

  await page.getByRole("button", { name: "Open profile settings" }).click();
  await expect(page.getByRole("dialog", { name: "Profile settings" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("profile-settings.png") });
  await page.locator(".profile-settings-sheet").screenshot({ path: testInfo.outputPath("profile-settings-isolated.png") });

  await page.goto(`/u/${handle}`);
  await expect(page.getByRole("heading", { name: "Ryuk" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("profile-public.png"), fullPage: true });

  await page.goto("/people/search");
  await expect(page.getByRole("heading", { name: "Find people" })).toBeVisible();
  await expect(page.getByText("Type at least 2 characters.")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search by name or handle" }).fill(handle);
  await page.getByRole("searchbox", { name: "Search by name or handle" }).press("Enter");
  await expect(page.getByRole("link", { name: /Ryuk/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("people-search.png"), fullPage: true });
});

test("captures a single meaningful Today action", async ({ context, page }, testInfo) => {
  const walletAddress = await authenticate(context);
  const handle = `today_${randomBytes(3).toString("hex")}`;
  const profileResponse = await context.request.put(`${baseUrl}/api/profile`, {
    data: {
      handle,
      displayName: "Ari",
      bio: "Shipping one honest improvement at a time.",
      avatar: { kind: "preset", preset: "indigo" },
      visibility: "public",
      dmPolicy: "friends",
      activityStatusVisible: true
    }
  });
  expect(profileResponse.ok()).toBe(true);
  const { occurrenceId, podId } = await seedActiveBuildPod(walletAddress);

  await page.goto("/today");
  await expect(page.getByRole("link", { name: /Lock today's task/ })).toBeVisible();
  await expect(page.getByText(/Pod connection/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open", exact: true })).toHaveCount(0);
  await page.waitForTimeout(700);
  await page.screenshot({ path: testInfo.outputPath("today-action.png"), fullPage: true });

  await page.getByRole("link", { name: /Lock today's task/ }).click();
  await expect(page.getByRole("button", { name: "Lock this task" })).toBeVisible();
  await page.getByLabel("Today's task").fill("Ship the mobile room composer and proof entry flow.");
  await page.getByRole("button", { name: "Lock this task" }).click();
  await expect(page.getByLabel("Result summary")).toBeVisible();
  await expect(page.getByText("Activity slice")).toBeVisible();
  await expect(page.getByText("Your full Testnet principal remains returnable.")).toBeVisible();
  await expect(page.getByText("At risk")).toHaveCount(0);
  await page.waitForTimeout(400);
  await page.screenshot({ path: testInfo.outputPath("proof-entry.png"), fullPage: true });

  await page.getByLabel("Result summary").fill("Shipped the mobile room composer and restored the complete proof entry path.");
  await page.getByLabel("Public artifact URL").fill("https://github.com/18Abhinav07/Pods/pull/42");
  await page.getByRole("radio", { name: /Share with Pod/ }).check();
  await page.getByRole("button", { name: "Add evidence" }).click();
  await expect(page.getByRole("button", { name: /Image/ })).toBeVisible();
  await page.locator("#evidence-image").setInputFiles(path.resolve(process.cwd(), "public/media/build-proof.jpg"));
  await expect(page.getByText("Image secured")).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: testInfo.outputPath("proof-added.png"), fullPage: true });
  await page.getByRole("button", { name: "Review and submit" }).click();
  await expect(page.getByRole("link", { name: "View submission" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("proof-submitted.png"), fullPage: true });

  await page.goto(`/pods/${podId}/room`);
  await expect(page.getByRole("heading", { name: "Pods Build Room" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to My Pods" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open Pod tools" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Pod sections" })).toHaveCount(0);
  const occurrenceProgress = page.getByText("Occurrence 1 of 1");
  await expect(occurrenceProgress).toBeVisible();
  expect(await occurrenceProgress.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(page.getByRole("form", { name: "Send a room message" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to message" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  const plusBox = await page.getByRole("button", { name: "Add to message" }).boundingBox();
  const messageBox = await page.getByRole("textbox", { name: "Message" }).boundingBox();
  const sendBox = await page.getByRole("button", { name: "Send message" }).boundingBox();
  expect(plusBox).not.toBeNull();
  expect(messageBox).not.toBeNull();
  expect(sendBox).not.toBeNull();
  expect(Math.abs((plusBox?.y ?? 0) - (sendBox?.y ?? 0))).toBeLessThan(2);
  expect((messageBox?.x ?? 0)).toBeGreaterThan((plusBox?.x ?? 0) + (plusBox?.width ?? 0));
  expect((sendBox?.x ?? 0)).toBeGreaterThan((messageBox?.x ?? 0) + (messageBox?.width ?? 0));
  const composerBox = await page.getByRole("form", { name: "Send a room message" }).boundingBox();
  const viewport = page.viewportSize();
  expect(composerBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs((composerBox?.y ?? 0) + (composerBox?.height ?? 0) - (viewport?.height ?? 0))).toBeLessThan(2);
  await page.waitForTimeout(500);
  await page.screenshot({ path: testInfo.outputPath("room-empty.png") });

  await page.getByRole("textbox", { name: "Message" }).fill("The mobile proof flow is live. Review is next.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("The mobile proof flow is live. Review is next.")).toBeVisible();
  await expect(page.locator(".delivery-state.is-sending")).toHaveCount(0);
  const roomMessage = "The mobile proof flow is live. Review is next.";
  const roomMessageEntry = page.locator(".room-entry").filter({ hasText: roomMessage }).first();
  const roomMessageId = await roomMessageEntry.getAttribute("id");
  expect(roomMessageId).not.toBeNull();
  await roomMessageEntry.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("room-message.png") });

  await roomMessageEntry.getByRole("button", { name: "More actions for Ari" }).click();
  await page.getByRole("button", { name: "Reply", exact: true }).click();
  await expect(page.locator(".reply-context")).toContainText(roomMessage);
  await page.getByRole("textbox", { name: "Message" }).fill("The reply interaction is ready for the room.");
  await expect(page.getByRole("button", { name: "Send message" })).toHaveCSS("background-color", "rgb(217, 237, 114)");
  await page.screenshot({ path: testInfo.outputPath("room-reply-composer.png") });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("The reply interaction is ready for the room.")).toBeVisible();
  await expect(page.locator(".delivery-state.is-sending")).toHaveCount(0);
  await page.reload();
  const roomReply = page.getByRole("button", { name: `Reply to Ari: ${roomMessage}` });
  await expect(roomReply).toBeVisible();
  await roomReply.click();
  await expect(page.locator(`[id="${roomMessageId}"]`)).toHaveClass(/is-reply-target/);
  await page.screenshot({ path: testInfo.outputPath("room-reply.png") });

  await page.getByRole("button", { name: "Add to message" }).click();
  await expect(page.getByRole("link", { name: "View submission" })).toHaveAttribute(
    "href",
    `/pods/${podId}/activity/${occurrenceId}`
  );
  await page.screenshot({ path: testInfo.outputPath("room-actions.png") });

  await approveVisualSubmission(occurrenceId);
  await page.goto(`/pods/${podId}/activity`);
  await expect(page.getByRole("searchbox", { name: "Search proofs by member" })).toBeVisible();
  await expect(page.getByText("Ari")).toBeVisible();
  await expect(page.getByText(`@${handle}`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ship the mobile room composer and proof entry flow." })).toBeVisible();
  await expect(page.getByRole("img", { name: "Pod-shared proof from Ari" })).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: testInfo.outputPath("pod-activity.png"), fullPage: true });

  await page.goto(`/pods/${podId}/members`);
  await expect(page.getByRole("heading", { name: "The people showing up." })).toBeVisible();
  await expect(page.getByText("Ari")).toBeVisible();
  await expect(page.getByRole("link", { name: /Ari/ })).toHaveAttribute("href", `/u/${handle}`);
  await page.waitForTimeout(450);
  await page.screenshot({ path: testInfo.outputPath("pod-members.png"), fullPage: true });

  await page.goto(`/pods/${podId}/rules`);
  await expect(page.getByRole("heading", { name: "Pods Build Room" })).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: testInfo.outputPath("pod-contract.png"), fullPage: true });

  await page.goto("/updates");
  await expect(page.getByRole("heading", { name: "Updates" })).toBeVisible();
  await expect(page.getByText("Occurrence approved")).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: testInfo.outputPath("updates-approved.png"), fullPage: true });

  await page.goto("/my-pods");
  await expect(page.getByRole("heading", { name: "My Pods" })).toBeVisible();
  await expect(page.getByText("Pods Build Room")).toBeVisible();
  await page.waitForTimeout(650);
  const podThumbnail = await page.locator(".my-pod-thumbnail").boundingBox();
  expect(podThumbnail).not.toBeNull();
  expect(podThumbnail?.width).toBeLessThanOrEqual(60);
  expect(podThumbnail?.height).toBeLessThanOrEqual(60);
  await expect(page.getByRole("link", { name: /Pods Build Room/ })).toHaveAttribute("href", `/pods/${podId}/room`);
  await page.screenshot({ path: testInfo.outputPath("my-pods.png"), fullPage: true });

  await page.goto("/messages");
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await expect(page.getByRole("link", { name: "People", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Requests", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Pods Build Room/ })).toHaveCount(0);
  await page.waitForTimeout(650);
  await page.screenshot({ path: testInfo.outputPath("messages-people.png"), fullPage: true });

  await preparePodForDiscover(podId);
  await page.goto("/discover");
  await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Discover sections" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "People", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Following", exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Pods Build Room" })).toBeVisible();
  await expect(page.getByText("Application pending")).toBeVisible();
  await expect(page.getByRole("link", { name: /Apply to join/i })).toHaveCount(0);
  await expect(page.locator("details")).toHaveCount(0);
  const discoverCard = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Pods Build Room" })
  });
  await page.waitForTimeout(650);
  await page.screenshot({ path: testInfo.outputPath("discover-card.png"), fullPage: true });
  await discoverCard.getByRole("button", { name: "Show Pod details" }).click();
  await expect(discoverCard.getByText("1 occurrence")).toBeVisible();
  await discoverCard.screenshot({ path: testInfo.outputPath("discover-details.png") });
});
