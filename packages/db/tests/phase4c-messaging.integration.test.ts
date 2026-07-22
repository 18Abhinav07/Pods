import { randomUUID } from "node:crypto";

import { buildPublishedContract } from "../../domain/src/index";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/index";
import { runPodsMigrations } from "../src/migration-runner";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const repository = createPodsRepository(databaseUrl);
const pool = new Pool({ connectionString: databaseUrl });
const testUserIds = new Set<string>();
const testPodIds = new Set<string>();

async function createUser(label: string) {
  const session = await repository.createSession({
    walletAddress: `NQTEST${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date(Date.now() + 60_000)
  });
  testUserIds.add(session.userId);
  await repository.saveProfile(session.userId, {
    handle: `${label}_${session.userId.slice(0, 6)}`,
    displayName: label,
    bio: `${label} is building with the Pods alpha.`,
    avatar: { kind: "preset", preset: "indigo" },
    visibility: "public",
    dmPolicy: "requests",
    activityStatusVisible: true
  });
  return session;
}

async function createPublishedPod(creatorUserId: string, name: string) {
  const draft = await repository.createDraft(creatorUserId, "build");
  const result = buildPublishedContract({
    templateId: "build",
    activity: {
      name,
      purpose: "A focused build room that ships one visible improvement on every occurrence.",
      startDate: "2027-03-01",
      endDate: "2027-03-05",
      timeZone: "UTC",
      weekdays: [1, 3, 5],
      config: {
        projectTheme: "Pods",
        allowedDeliverables: ["pull_request"],
        commitmentCutoff: "09:00"
      }
    },
    community: {
      visibility: "public",
      minParticipants: 2,
      maxParticipants: 8,
      applicationQuestions: []
    },
    commitment: { nimPerOccurrence: "0.1" }
  });
  if (!result.success) throw new Error(result.errors.join(", "));
  const pod = await repository.publishDraft({
    creatorUserId,
    podId: draft.id,
    contract: result.contract,
    occurrences: result.occurrences
  });
  testPodIds.add(pod.id);
  return pod;
}

async function addLockedMember(podId: string, userId: string) {
  const membershipId = randomUUID();
  await pool.query(
    `INSERT INTO memberships
      (id, pod_id, user_id, admission_source, state, accepted_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'public_application', 'roster_locked', NOW(), NOW(), NOW())`,
    [membershipId, podId, userId]
  );
  return membershipId;
}

beforeAll(async () => {
  await runPodsMigrations(databaseUrl);
});

afterAll(async () => {
  await repository.close();
  await pool.query("DELETE FROM pods WHERE id = ANY($1::uuid[])", [[...testPodIds]]);
  await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[...testUserIds]]);
  await pool.end();
});

describe("durable Pod rooms", () => {
  it("authorizes only the creator and locked roster members", async () => {
    const creator = await createUser("Creator");
    const member = await createUser("Member");
    const stranger = await createUser("Stranger");
    const pod = await createPublishedPod(creator.userId, "Pods Room Access");
    await addLockedMember(pod.id, member.userId);

    const first = await repository.ensurePodConversation({ podId: pod.id, userId: creator.userId });
    const second = await repository.ensurePodConversation({ podId: pod.id, userId: member.userId });
    expect(second.id).toBe(first.id);
    const members = await repository.listPodRoomMembers({ podId: pod.id, userId: member.userId });
    expect(members.map(({ displayName }) => displayName).sort()).toEqual(["Creator", "Member"]);
    expect(JSON.stringify(members)).not.toContain("NQTEST");
    await expect(
      repository.ensurePodConversation({ podId: pod.id, userId: stranger.userId })
    ).rejects.toThrow("Pod room access requires a locked roster place");
  });

  it("orders messages, makes retries idempotent, and confines replies to one room", async () => {
    const creator = await createUser("RoomCreator");
    const member = await createUser("RoomMember");
    const pod = await createPublishedPod(creator.userId, "Ordered Pod Room");
    await addLockedMember(pod.id, member.userId);
    const room = await repository.ensurePodConversation({ podId: pod.id, userId: member.userId });
    const clientMessageId = randomUUID();

    const first = await repository.postConversationMessage({
      conversationId: room.id,
      userId: member.userId,
      clientMessageId,
      body: "The responsive room is ready for review.",
      replyToMessageId: null,
      kind: "member_message",
      now: new Date("2027-03-01T10:00:00.000Z")
    });
    const retry = await repository.postConversationMessage({
      conversationId: room.id,
      userId: member.userId,
      clientMessageId,
      body: "The responsive room is ready for review.",
      replyToMessageId: null,
      kind: "member_message",
      now: new Date("2027-03-01T10:00:01.000Z")
    });
    expect(retry.id).toBe(first.id);
    expect(first.sequence).toBe(1);

    const reply = await repository.postConversationMessage({
      conversationId: room.id,
      userId: creator.userId,
      clientMessageId: randomUUID(),
      body: "Great. I am opening the review path now.",
      replyToMessageId: first.id,
      kind: "member_message",
      now: new Date("2027-03-01T10:01:00.000Z")
    });
    expect(reply.sequence).toBe(2);

    const anotherPod = await createPublishedPod(creator.userId, "Another Room");
    const anotherRoom = await repository.ensurePodConversation({
      podId: anotherPod.id,
      userId: creator.userId
    });
    await expect(
      repository.postConversationMessage({
        conversationId: anotherRoom.id,
        userId: creator.userId,
        clientMessageId: randomUUID(),
        body: "This reply points across rooms.",
        replyToMessageId: first.id,
        kind: "member_message",
        now: new Date("2027-03-01T10:02:00.000Z")
      })
    ).rejects.toThrow("Reply target must be in the same conversation");

    const listed = await repository.listConversationMessages({
      conversationId: room.id,
      userId: member.userId,
      afterSequence: 0,
      limit: 50
    });
    expect(listed.messages.map((message) => message.sequence)).toEqual([1, 2]);
    expect(listed.messages[0]).toMatchObject({
      body: "The responsive room is ready for review.",
      sender: { displayName: "RoomMember" }
    });
    expect(listed.messages[1]?.replyPreview).toEqual({
      messageId: first.id,
      sequence: 1,
      senderDisplayName: "RoomMember",
      kind: "member_message",
      excerpt: "The responsive room is ready for review.",
      available: true
    });

    const around = await repository.listConversationMessages({
      conversationId: room.id,
      userId: member.userId,
      afterSequence: 99,
      aroundMessageId: first.id,
      limit: 40
    });
    expect(around.messages.map((message) => message.sequence)).toEqual([1, 2]);

    await repository.hideConversationMessage({
      conversationId: room.id,
      messageId: first.id,
      moderatorUserId: creator.userId,
      now: new Date("2027-03-01T10:03:00.000Z")
    });
    const redacted = await repository.listConversationMessages({
      conversationId: room.id,
      userId: member.userId,
      afterSequence: 0,
      limit: 50
    });
    expect(redacted.messages[1]?.replyPreview).toEqual({
      messageId: first.id,
      sequence: 1,
      senderDisplayName: null,
      kind: "member_message",
      excerpt: "Message unavailable",
      available: false
    });
    expect(JSON.stringify(redacted.messages[1]?.replyPreview)).not.toContain(
      "responsive room"
    );
    expect(JSON.stringify(listed)).not.toContain("NQTEST");
  });

  it("supports one reaction per user, monotonic reads, announcements, and visible tombstones", async () => {
    const creator = await createUser("Moderator");
    const member = await createUser("Reactor");
    const pod = await createPublishedPod(creator.userId, "Moderated Pod Room");
    await addLockedMember(pod.id, member.userId);
    const room = await repository.ensurePodConversation({ podId: pod.id, userId: creator.userId });
    const message = await repository.postConversationMessage({
      conversationId: room.id,
      userId: member.userId,
      clientMessageId: randomUUID(),
      body: "I finished the room empty state.",
      replyToMessageId: null,
      kind: "member_message",
      now: new Date("2027-03-01T11:00:00.000Z")
    });
    await repository.setMessageReaction({
      messageId: message.id,
      userId: creator.userId,
      reaction: "heart",
      now: new Date("2027-03-01T11:01:00.000Z")
    });
    await repository.setMessageReaction({
      messageId: message.id,
      userId: creator.userId,
      reaction: "celebrate",
      now: new Date("2027-03-01T11:02:00.000Z")
    });
    expect(
      (await repository.listConversationMessages({
        conversationId: room.id,
        userId: member.userId,
        afterSequence: 0,
        limit: 20
      })).messages[0]?.reactions
    ).toEqual([{ code: "celebrate", count: 1, reactedByViewer: false }]);

    await repository.removeMessageReaction({
      messageId: message.id,
      userId: creator.userId,
      now: new Date("2027-03-01T11:02:30.000Z")
    });
    expect(
      (await repository.listConversationMessages({
        conversationId: room.id,
        userId: member.userId,
        afterSequence: 0,
        limit: 20
      })).messages[0]?.reactions
    ).toEqual([]);

    await repository.markConversationRead({ conversationId: room.id, userId: member.userId, sequence: 1 });
    await repository.markConversationRead({ conversationId: room.id, userId: member.userId, sequence: 0 });
    expect(await repository.getConversationReadSequence({ conversationId: room.id, userId: member.userId })).toBe(1);

    const announcement = await repository.postConversationMessage({
      conversationId: room.id,
      userId: creator.userId,
      clientMessageId: randomUUID(),
      body: "The room walkthrough begins at 8 PM.",
      replyToMessageId: null,
      kind: "announcement",
      now: new Date("2027-03-01T11:03:00.000Z")
    });
    await expect(
      repository.pinConversationAnnouncement({
        conversationId: room.id,
        messageId: announcement.id,
        creatorUserId: member.userId,
        pinned: true,
        now: new Date("2027-03-01T11:03:10.000Z")
      })
    ).rejects.toThrow("Only the Pod creator can pin announcements");
    await repository.pinConversationAnnouncement({
      conversationId: room.id,
      messageId: announcement.id,
      creatorUserId: creator.userId,
      pinned: true,
      now: new Date("2027-03-01T11:03:20.000Z")
    });
    await repository.hideConversationMessage({
      conversationId: room.id,
      messageId: message.id,
      moderatorUserId: creator.userId,
      now: new Date("2027-03-01T11:04:00.000Z")
    });
    await expect(
      repository.hideConversationMessage({
        conversationId: room.id,
        messageId: announcement.id,
        moderatorUserId: creator.userId,
        now: new Date("2027-03-01T11:05:00.000Z")
      })
    ).rejects.toThrow("Authoritative room entries cannot be hidden");

    const result = await repository.listConversationMessages({
      conversationId: room.id,
      userId: creator.userId,
      afterSequence: 0,
      limit: 20
    });
    expect(result.messages[0]).toMatchObject({ body: null, hidden: true });
    expect(result.messages[1]).toMatchObject({
      body: "The room walkthrough begins at 8 PM.",
      kind: "announcement",
      pinned: true
    });

    await repository.setPodRoomState({
      conversationId: room.id,
      creatorUserId: creator.userId,
      roomState: "archived",
      now: new Date("2027-03-01T11:06:00.000Z")
    });
    await expect(
      repository.postConversationMessage({
        conversationId: room.id,
        userId: member.userId,
        clientMessageId: randomUUID(),
        body: "This should wait until the archive is reopened.",
        replyToMessageId: null,
        kind: "member_message",
        now: new Date("2027-03-01T11:07:00.000Z")
      })
    ).rejects.toThrow("This room is archived and read only");
    await repository.setPodRoomState({
      conversationId: room.id,
      creatorUserId: creator.userId,
      roomState: "open",
      now: new Date("2027-03-01T11:08:00.000Z")
    });
  });
});
