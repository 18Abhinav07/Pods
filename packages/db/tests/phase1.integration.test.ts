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
const testUserIds = new Set<string>();

async function createTestUser(walletAddress = `NQTEST${randomUUID()}`) {
  const session = await repository.createSession({
    walletAddress,
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
  if (testUserIds.size === 0) return;
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[...testUserIds]]);
  } finally {
    await pool.end();
  }
});

describe("wallet challenge and session persistence", () => {
  it("consumes a live challenge once and never consumes an expired challenge", async () => {
    const live = await repository.createChallenge({
      walletAddress: `NQTEST${randomUUID()}`,
      message: `Pods sign-in ${randomUUID()}`,
      expiresAt: new Date(Date.now() + 60_000)
    });
    expect(await repository.consumeChallenge(live.id, new Date())).toMatchObject({
      id: live.id,
      message: live.message
    });
    expect(await repository.consumeChallenge(live.id, new Date())).toBeNull();

    const expired = await repository.createChallenge({
      walletAddress: `NQTEST${randomUUID()}`,
      message: `Pods sign-in ${randomUUID()}`,
      expiresAt: new Date(Date.now() - 1)
    });
    expect(await repository.consumeChallenge(expired.id, new Date())).toBeNull();
  });

  it("resolves only a live hashed session", async () => {
    const walletAddress = `NQTEST${randomUUID()}`;
    const session = await createTestUser(walletAddress);

    expect(await repository.getSession(session.tokenHash, new Date())).toMatchObject({
      walletAddress,
      userId: session.userId
    });
    expect(await repository.getSession("missing", new Date())).toBeNull();
    expect(await repository.getSession(session.tokenHash, new Date(Date.now() + 120_000)))
      .toBeNull();
  });
});

describe("owner-scoped immutable Pod creation", () => {
  it("persists a draft, publishes atomically, and rejects every later material edit", async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const draft = await repository.createDraft(owner.userId, "build");

    const activity = {
      name: "Build Pods in Public",
      purpose: "A focused group that ships one visible Pods improvement on every scheduled build day.",
      startDate: "2026-03-02",
      endDate: "2026-03-06",
      timeZone: "UTC",
      weekdays: [1, 3, 5],
      config: {
        projectTheme: "Pods",
        allowedDeliverables: ["pull_request"],
        commitmentCutoff: "09:00"
      }
    };
    const community = {
      visibility: "public" as const,
      minParticipants: 3,
      maxParticipants: 8,
      applicationQuestions: ["What will you ship?"]
    };
    const commitment = { nimPerOccurrence: "0.5" };

    await repository.saveActivityStep(owner.userId, draft.id, activity);
    await repository.saveCommunityStep(owner.userId, draft.id, community);
    await repository.saveCommitmentStep(owner.userId, draft.id, commitment);

    expect(await repository.getPodForOwner(stranger.userId, draft.id)).toBeNull();
    expect(await repository.getPodForOwner(owner.userId, draft.id)).toMatchObject({
      state: "draft",
      templateId: "build",
      draftData: { activity, community, commitment }
    });

    const frozen = buildPublishedContract({
      templateId: "build",
      activity,
      community,
      commitment
    });
    expect(frozen.success).toBe(true);
    if (!frozen.success) return;

    const published = await repository.publishDraft({
      creatorUserId: owner.userId,
      podId: draft.id,
      contract: frozen.contract,
      occurrences: frozen.occurrences
    });
    expect(published).toMatchObject({
      state: "enrollment_open",
      contractData: frozen.contract,
      occurrenceCount: 3
    });
    expect(published.contractHash).toMatch(/^[a-f0-9]{64}$/);
    expect(await repository.deleteDraft(owner.userId, draft.id)).toBe(false);
    expect(await repository.listPodsForOwner(owner.userId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: draft.id, state: "enrollment_open" })
      ])
    );

    await expect(
      repository.saveCommitmentStep(owner.userId, draft.id, { nimPerOccurrence: "1" })
    ).rejects.toThrow("Pod contract is immutable after publication");
  });

  it("permanently deletes only an owner-owned unpublished draft", async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const draft = await repository.createDraft(owner.userId, "build");

    expect(await repository.deleteDraft(stranger.userId, draft.id)).toBe(false);
    expect(await repository.getPodForOwner(owner.userId, draft.id)).not.toBeNull();
    expect(await repository.deleteDraft(owner.userId, draft.id)).toBe(true);
    expect(await repository.getPodForOwner(owner.userId, draft.id)).toBeNull();
  });
});
