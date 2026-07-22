import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/index";
import { runPodsMigrations } from "../src/migration-runner";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";

const repository = createPodsRepository(databaseUrl);
const testUserIds = new Set<string>();

async function createTestUser() {
  const session = await repository.createSession({
    walletAddress: `NQTEST${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date(Date.now() + 60_000)
  });
  testUserIds.add(session.userId);
  return session;
}

beforeAll(async () => {
  await runPodsMigrations(databaseUrl);
});

afterAll(async () => {
  await repository.close();
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[...testUserIds]]);
  } finally {
    await pool.end();
  }
});

describe("wallet-owned profile persistence", () => {
  it("creates and updates one profile for a wallet user", async () => {
    const user = await createTestUser();
    const created = await repository.saveProfile(user.userId, {
      handle: `builder_${user.userId.slice(0, 6)}`,
      displayName: "Pods Builder",
      bio: "Building the social accountability layer.",
      avatar: { kind: "preset", preset: "ember" },
      visibility: "public",
      dmPolicy: "requests",
      activityStatusVisible: true
    });

    expect(await repository.getProfileForUser(user.userId)).toMatchObject({
      userId: user.userId,
      handle: created.handle,
      displayName: "Pods Builder"
    });

    const updated = await repository.saveProfile(user.userId, {
      handle: created.handle,
      displayName: "Abhinav",
      bio: "Shipping Pods in public.",
      avatar: { kind: "preset", preset: "moss" },
      visibility: "private",
      dmPolicy: "friends",
      activityStatusVisible: false
    });

    expect(updated.createdAt).toEqual(created.createdAt);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    expect(updated).toMatchObject({
      displayName: "Abhinav",
      visibility: "private",
      dmPolicy: "friends"
    });
  });

  it("enforces case-insensitive handle uniqueness and exposes safe presence states", async () => {
    const first = await createTestUser();
    const second = await createTestUser();
    const handle = `shared_${first.userId.slice(0, 6)}`;
    const base = {
      handle,
      displayName: "First Builder",
      bio: "",
      avatar: { kind: "preset" as const, preset: "indigo" as const },
      visibility: "public" as const,
      dmPolicy: "requests" as const,
      activityStatusVisible: true
    };

    await repository.saveProfile(first.userId, base);
    await expect(
      repository.saveProfile(second.userId, { ...base, handle: handle.toUpperCase() })
    ).rejects.toThrow("Profile handle is already taken");

    expect(await repository.getPublicProfilePresence(handle)).toMatchObject({
      kind: "public",
      profile: { handle, displayName: "First Builder" }
    });
    await repository.saveProfile(first.userId, { ...base, visibility: "private" });
    expect(await repository.getPublicProfilePresence(handle)).toEqual({ kind: "private" });
    expect(await repository.getPublicProfilePresence("missing_handle")).toEqual({
      kind: "not_found"
    });
  });

  it("searches only public profiles after a meaningful query", async () => {
    const publicUser = await createTestUser();
    const privateUser = await createTestUser();
    const suffix = publicUser.userId.slice(0, 6);
    await repository.saveProfile(publicUser.userId, {
      handle: `runner_${suffix}`,
      displayName: `Morning Runner ${suffix}`,
      bio: "Moves before sunrise.",
      avatar: { kind: "preset", preset: "moss" },
      visibility: "public",
      dmPolicy: "requests",
      activityStatusVisible: true
    });
    await repository.saveProfile(privateUser.userId, {
      handle: `hidden_${suffix}`,
      displayName: `Hidden Runner ${suffix}`,
      bio: "Private movement.",
      avatar: { kind: "preset", preset: "ember" },
      visibility: "private",
      dmPolicy: "friends",
      activityStatusVisible: false
    });

    await expect(repository.searchPublicProfiles({ query: "r", limit: 20 })).resolves.toEqual([]);
    const results = await repository.searchPublicProfiles({
      query: `runner ${suffix}`,
      limit: 20
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      handle: `runner_${suffix}`,
      displayName: `Morning Runner ${suffix}`
    });
    expect(results[0]).not.toHaveProperty("walletAddress");
  });
});
