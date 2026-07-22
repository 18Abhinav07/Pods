import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/index";
import { runPodsMigrations } from "../src/migration-runner";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const repository = createPodsRepository(databaseUrl);
const pool = new Pool({ connectionString: databaseUrl });
const userIds = new Set<string>();

async function user(label: string, dmPolicy: "friends" | "requests" | "none" = "requests") {
  const session = await repository.createSession({
    walletAddress: `NQTEST${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date("2028-01-01T00:00:00.000Z")
  });
  userIds.add(session.userId);
  await repository.saveProfile(session.userId, {
    handle: `${label}_${session.userId.slice(0, 6)}`,
    displayName: label,
    bio: `${label} is building on Pods.`,
    avatar: { kind: "preset", preset: "coral" },
    visibility: "public",
    dmPolicy,
    activityStatusVisible: true
  });
  return { ...session, profile: (await repository.getProfileForUser(session.userId))! };
}

beforeAll(async () => runPodsMigrations(databaseUrl));
afterAll(async () => {
  await repository.close();
  await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[...userIds]]);
  await pool.end();
});

describe("Phase 4F direct messaging", () => {
  it("opens one active conversation for friends and keeps message DTOs wallet-free", async () => {
    const first = await user("FirstFriend");
    const second = await user("SecondFriend");
    await repository.sendFriendRequest({ senderUserId: first.userId, handle: second.profile.handle, now: new Date() });
    await repository.sendFriendRequest({ senderUserId: second.userId, handle: first.profile.handle, now: new Date() });

    const opened = await repository.openDirectConversation({
      senderUserId: first.userId,
      handle: second.profile.handle,
      introduction: "Let us keep building together.",
      now: new Date("2027-06-01T10:00:00.000Z")
    });
    expect(opened).toMatchObject({ visibleState: "active" });
    const retry = await repository.openDirectConversation({
      senderUserId: first.userId,
      handle: second.profile.handle,
      introduction: "A retry must not create another thread.",
      now: new Date("2027-06-01T10:00:01.000Z")
    });
    expect(retry.conversation.id).toBe(opened.conversation.id);
    const listed = await repository.listConversationMessages({
      conversationId: opened.conversation.id,
      userId: second.userId,
      afterSequence: 0,
      limit: 20
    });
    expect(listed.messages[0]).toMatchObject({ body: "Let us keep building together." });
    expect(JSON.stringify(listed)).not.toContain("NQTEST");
  });

  it("requires approval for a non-friend and never reveals discard to the sender", async () => {
    const sender = await user("RequestSender");
    const recipient = await user("RequestRecipient");
    const opened = await repository.openDirectConversation({
      senderUserId: sender.userId,
      handle: recipient.profile.handle,
      introduction: "Your reading Pod inspired a useful accountability pattern.",
      now: new Date("2027-06-01T11:00:00.000Z")
    });
    expect(opened).toMatchObject({ visibleState: "pending" });
    await expect(repository.listConversationMessages({
      conversationId: opened.conversation.id,
      userId: sender.userId,
      afterSequence: 0,
      limit: 20
    })).rejects.toThrow("Direct conversation is not active");
    const requests = await repository.listDirectConversationRequests(recipient.userId);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ introduction: "Your reading Pod inspired a useful accountability pattern." });

    await repository.respondToDirectConversation({
      conversationId: opened.conversation.id,
      recipientUserId: recipient.userId,
      action: "discard",
      now: new Date("2027-06-01T11:05:00.000Z")
    });
    const reopened = await repository.openDirectConversation({
      senderUserId: sender.userId,
      handle: recipient.profile.handle,
      introduction: "The sender still sees a pending request.",
      now: new Date("2027-06-01T11:10:00.000Z")
    });
    expect(reopened).toMatchObject({ visibleState: "pending" });
    expect(reopened.conversation.directState).toBe("discarded");
  });

  it("activates an accepted request and rejects requests forbidden by profile policy", async () => {
    const sender = await user("AllowedSender");
    const recipient = await user("AllowedRecipient");
    const closed = await user("ClosedRecipient", "none");
    const opened = await repository.openDirectConversation({
      senderUserId: sender.userId,
      handle: recipient.profile.handle,
      introduction: "Can we compare our Build and Ship workflows?",
      now: new Date()
    });
    await repository.respondToDirectConversation({
      conversationId: opened.conversation.id,
      recipientUserId: recipient.userId,
      action: "accept",
      now: new Date()
    });
    expect((await repository.listConversationMessages({
      conversationId: opened.conversation.id,
      userId: sender.userId,
      afterSequence: 0,
      limit: 20
    })).messages).toHaveLength(1);
    await expect(repository.openDirectConversation({
      senderUserId: sender.userId,
      handle: closed.profile.handle,
      introduction: "This request should respect the closed policy.",
      now: new Date()
    })).rejects.toThrow("This profile does not accept message requests");
  });
});
