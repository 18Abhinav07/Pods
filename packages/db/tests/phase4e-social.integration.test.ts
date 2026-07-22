import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/index";
import { runPodsMigrations } from "../src/migration-runner";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const repository = createPodsRepository(databaseUrl);
const pool = new Pool({ connectionString: databaseUrl });
const userIds = new Set<string>();
const podIds = new Set<string>();

async function user(handle: string, visibility: "public" | "private" = "public") {
  const session = await repository.createSession({
    walletAddress: `NQTEST${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date("2028-01-01T00:00:00.000Z")
  });
  userIds.add(session.userId);
  await repository.saveProfile(session.userId, {
    handle,
    displayName: handle.replaceAll("_", " "),
    bio: `@${handle} is moving with Pods.`,
    avatar: { kind: "preset", preset: "moss" },
    visibility,
    dmPolicy: "requests",
    activityStatusVisible: true
  });
  return session;
}

beforeAll(async () => {
  await runPodsMigrations(databaseUrl);
});

afterAll(async () => {
  await repository.close();
  await pool.query("DELETE FROM pods WHERE id = ANY($1::uuid[])", [[...podIds]]);
  await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[...userIds]]);
  await pool.end();
});

describe("Phase 4E social graph", () => {
  it("follows only opted-in public profiles and projects a private following lane", async () => {
    const viewer = await user(`viewer_${randomUUID().slice(0, 6)}`);
    const publicPerson = await user(`public_${randomUUID().slice(0, 6)}`);
    const privatePerson = await user(`private_${randomUUID().slice(0, 6)}`, "private");
    const publicProfile = await repository.getProfileForUser(publicPerson.userId);
    const privateProfile = await repository.getProfileForUser(privatePerson.userId);

    await repository.followProfile({ viewerUserId: viewer.userId, handle: publicProfile!.handle });
    await expect(repository.followProfile({
      viewerUserId: viewer.userId,
      handle: privateProfile!.handle
    })).rejects.toThrow("Public profile not found");

    const lane = await repository.listFollowingProfiles(viewer.userId);
    expect(lane).toHaveLength(1);
    expect(lane[0]).toMatchObject({ handle: publicProfile!.handle });
    expect(JSON.stringify(lane)).not.toContain("NQTEST");
    const presence = await repository.getSocialProfilePresence({
      viewerUserId: viewer.userId,
      handle: publicProfile!.handle
    });
    expect(presence).toMatchObject({
      kind: "public",
      relationship: { following: true, friend: false }
    });
  });

  it("turns reverse pending requests into one canonical friendship", async () => {
    const first = await user(`first_${randomUUID().slice(0, 6)}`);
    const second = await user(`second_${randomUUID().slice(0, 6)}`);
    const firstProfile = await repository.getProfileForUser(first.userId);
    const secondProfile = await repository.getProfileForUser(second.userId);

    await repository.sendFriendRequest({
      senderUserId: first.userId,
      handle: secondProfile!.handle,
      now: new Date("2027-05-01T10:00:00.000Z")
    });
    const reverse = await repository.sendFriendRequest({
      senderUserId: second.userId,
      handle: firstProfile!.handle,
      now: new Date("2027-05-01T10:01:00.000Z")
    });
    expect(reverse).toMatchObject({ state: "accepted" });
    expect(await repository.areFriends(first.userId, second.userId)).toBe(true);
    expect(await repository.listFriends(first.userId)).toHaveLength(1);
    expect(await repository.listFriends(second.userId)).toHaveLength(1);
  });

  it("blocks social access transactionally without changing a locked Pod membership", async () => {
    const creator = await user(`creator_${randomUUID().slice(0, 6)}`);
    const member = await user(`member_${randomUUID().slice(0, 6)}`);
    const creatorProfile = await repository.getProfileForUser(creator.userId);
    const memberProfile = await repository.getProfileForUser(member.userId);
    const podId = randomUUID();
    podIds.add(podId);
    await pool.query(
      `INSERT INTO pods (id, creator_user_id, state, template_id, draft_data, created_at, updated_at)
       VALUES ($1, $2, 'locked_scheduled', 'build', '{}', NOW(), NOW())`,
      [podId, creator.userId]
    );
    await pool.query(
      `INSERT INTO memberships (id, pod_id, user_id, admission_source, state, created_at, updated_at)
       VALUES ($1, $2, $3, 'public_application', 'roster_locked', NOW(), NOW())`,
      [randomUUID(), podId, member.userId]
    );
    await repository.followProfile({ viewerUserId: creator.userId, handle: memberProfile!.handle });
    await repository.sendFriendRequest({
      senderUserId: creator.userId,
      handle: memberProfile!.handle,
      now: new Date()
    });

    await repository.blockProfile({
      blockerUserId: member.userId,
      handle: creatorProfile!.handle,
      now: new Date()
    });
    expect(await repository.areFriends(creator.userId, member.userId)).toBe(false);
    expect(await repository.listFollowingProfiles(creator.userId)).toEqual([]);
    expect(await repository.getMembershipForUser(member.userId, podId)).toMatchObject({
      state: "roster_locked"
    });
    await expect(repository.sendFriendRequest({
      senderUserId: creator.userId,
      handle: memberProfile!.handle,
      now: new Date()
    })).rejects.toThrow("Social access is blocked");
  });
});
