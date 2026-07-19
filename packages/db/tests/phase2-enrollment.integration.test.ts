import { createHash, randomUUID } from "node:crypto";

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

async function createUser() {
  const session = await repository.createSession({
    walletAddress: `NQTEST${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date(Date.now() + 60_000)
  });
  testUserIds.add(session.userId);
  return session;
}

async function publishPod(
  creatorUserId: string,
  visibility: "public" | "private",
  name = `${visibility} Phase 2 Pod ${randomUUID()}`
) {
  const draft = await repository.createDraft(creatorUserId, "build");
  const activity = {
    name,
    purpose: "Ship a visible improvement on every scheduled build occurrence with the group.",
    startDate: "2027-03-01",
    endDate: "2027-03-05",
    timeZone: "UTC",
    weekdays: [1, 3, 5],
    config: {
      projectTheme: "Pods",
      allowedDeliverables: ["pull_request"],
      commitmentCutoff: "09:00"
    }
  };
  const community =
    visibility === "public"
      ? {
          visibility: "public" as const,
          minParticipants: 2,
          maxParticipants: 4,
          applicationQuestions: ["What will you ship?", "Why this group?"]
        }
      : {
          visibility: "private" as const,
          minParticipants: 2,
          maxParticipants: 4,
          inviteExpiryHours: 48
        };
  const commitment = { nimPerOccurrence: "0.5" };

  await repository.saveActivityStep(creatorUserId, draft.id, activity);
  await repository.saveCommunityStep(creatorUserId, draft.id, community);
  await repository.saveCommitmentStep(creatorUserId, draft.id, commitment);
  const frozen = buildPublishedContract({
    templateId: "build",
    activity,
    community,
    commitment
  });
  if (!frozen.success) throw new Error(frozen.errors.join(", "));
  return repository.publishDraft({
    creatorUserId,
    podId: draft.id,
    contract: frozen.contract,
    occurrences: frozen.occurrences
  });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function invitationToken(suffix = "a") {
  return `${randomUUID().replaceAll("-", "")}${suffix.repeat(11)}`;
}

describe("public enrollment", () => {
  it("lists only public Pods and hides private Pod identities from direct lookup", async () => {
    const owner = await createUser();
    const publicPod = await publishPod(owner.userId, "public");
    const privatePod = await publishPod(owner.userId, "private");
    const now = new Date("2026-08-01T00:00:00.000Z");

    const discoverable = await repository.listPublicPods({ now });
    expect(discoverable).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: publicPod.id })])
    );
    expect(discoverable).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: privatePod.id })])
    );
    expect(await repository.getPublicPod(publicPod.id, now)).toMatchObject({
      id: publicPod.id
    });
    expect(await repository.getPublicPod(privatePod.id, now)).toBeNull();
    expect(await repository.getPublicPod(randomUUID(), now)).toBeNull();
  });

  it("snapshots an application once and lets only the creator decide it", async () => {
    const owner = await createUser();
    const applicant = await createUser();
    const stranger = await createUser();
    const pod = await publishPod(owner.userId, "public");
    const answers = [
      { question: "What will you ship?", answer: "A tested enrollment flow" },
      { question: "Why this group?", answer: "Accountability helps me finish" }
    ];
    const now = new Date("2026-08-01T00:00:00.000Z");

    const application = await repository.applyToPublicPod({
      podId: pod.id,
      applicantUserId: applicant.userId,
      answers,
      now
    });
    expect(application).toMatchObject({ state: "applied", answers });
    expect(await repository.getMembershipForUser(applicant.userId, pod.id)).toMatchObject({
      state: "applied",
      admissionSource: "public_application"
    });
    await expect(
      repository.applyToPublicPod({
        podId: pod.id,
        applicantUserId: applicant.userId,
        answers,
        now
      })
    ).rejects.toThrow("Application already exists");

    expect(
      await repository.decideApplication({
        creatorUserId: stranger.userId,
        podId: pod.id,
        applicationId: application.id,
        decision: "accept",
        now
      })
    ).toBeNull();
    expect(
      await repository.decideApplication({
        creatorUserId: owner.userId,
        podId: pod.id,
        applicationId: application.id,
        decision: "accept",
        now
      })
    ).toMatchObject({ state: "accepted_unfunded" });
    expect(await repository.getMembershipForUser(applicant.userId, pod.id)).toMatchObject({
      state: "accepted_unfunded"
    });
    expect(await repository.getPodForAcceptedMember(applicant.userId, pod.id)).toMatchObject({
      id: pod.id,
      contractData: pod.contractData
    });
    expect(await repository.getPodForAcceptedMember(stranger.userId, pod.id)).toBeNull();
    expect(
      await repository.decideApplication({
        creatorUserId: owner.userId,
        podId: pod.id,
        applicationId: application.id,
        decision: "reject",
        now
      })
    ).toBeNull();
  });

  it("supports rejection and rejects applications to private or closed Pods", async () => {
    const owner = await createUser();
    const applicant = await createUser();
    const publicPod = await publishPod(owner.userId, "public");
    const privatePod = await publishPod(owner.userId, "private");
    const now = new Date("2026-08-01T00:00:00.000Z");
    const answers = [
      { question: "What will you ship?", answer: "A clear public application" },
      { question: "Why this group?", answer: "The schedule matches my week" }
    ];

    const application = await repository.applyToPublicPod({
      podId: publicPod.id,
      applicantUserId: applicant.userId,
      answers,
      now
    });
    expect(
      await repository.decideApplication({
        creatorUserId: owner.userId,
        podId: publicPod.id,
        applicationId: application.id,
        decision: "reject",
        now
      })
    ).toMatchObject({ state: "application_rejected" });

    await expect(
      repository.applyToPublicPod({
        podId: privatePod.id,
        applicantUserId: applicant.userId,
        answers,
        now
      })
    ).rejects.toThrow("Pod is not accepting public applications");
    await expect(
      repository.applyToPublicPod({
        podId: publicPod.id,
        applicantUserId: (await createUser()).userId,
        answers,
        now: new Date("2027-03-01T00:00:00.000Z")
      })
    ).rejects.toThrow("Pod is not accepting public applications");
  });
});

describe("private invitations", () => {
  it("shows a minimal preview and accepts an opaque invite exactly once", async () => {
    const owner = await createUser();
    const firstInvitee = await createUser();
    const secondInvitee = await createUser();
    const pod = await publishPod(owner.userId, "private");
    const rawToken = invitationToken();
    const tokenHash = hashToken(rawToken);
    const now = new Date("2026-08-01T00:00:00.000Z");

    const invitation = await repository.createInvitation({
      creatorUserId: owner.userId,
      podId: pod.id,
      tokenHash,
      now
    });
    expect(invitation).toMatchObject({ podId: pod.id, tokenHash });
    const preview = await repository.getInvitationPreviewByTokenHash(tokenHash, now);
    expect(preview).toMatchObject({
      podId: pod.id,
      activityName: pod.contractData?.activity.name
    });
    expect(preview).not.toHaveProperty("creatorUserId");

    const results = await Promise.all([
      repository.acceptInvitation({ tokenHash, userId: firstInvitee.userId, now }),
      repository.acceptInvitation({ tokenHash, userId: secondInvitee.userId, now })
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    const winner = results.find(Boolean);
    expect(winner ? await repository.getPodForAcceptedMember(winner.userId, pod.id) : null)
      .toMatchObject({ id: pod.id });
    expect(await repository.acceptInvitation({
      tokenHash,
      userId: (await createUser()).userId,
      now
    })).toBeNull();
  });

  it("treats revoked and expired invitations as the same unavailable preview", async () => {
    const owner = await createUser();
    const pod = await publishPod(owner.userId, "private");
    const now = new Date("2026-08-01T00:00:00.000Z");

    const revokedHash = hashToken(invitationToken("b"));
    const revoked = await repository.createInvitation({
      creatorUserId: owner.userId,
      podId: pod.id,
      tokenHash: revokedHash,
      now
    });
    expect(
      await repository.revokeInvitation({
        creatorUserId: owner.userId,
        podId: pod.id,
        invitationId: revoked.id,
        now
      })
    ).toBe(true);
    expect(await repository.getInvitationPreviewByTokenHash(revokedHash, now)).toBeNull();

    const expiredHash = hashToken(invitationToken("c"));
    await repository.createInvitation({
      creatorUserId: owner.userId,
      podId: pod.id,
      tokenHash: expiredHash,
      now: new Date("2027-02-28T23:00:00.000Z")
    });
    expect(
      await repository.getInvitationPreviewByTokenHash(
        expiredHash,
        new Date("2027-03-01T00:00:00.000Z")
      )
    ).toBeNull();
  });
});

describe("creator enrollment control", () => {
  it("cancels an unfunded enrollment Pod without deleting its frozen contract", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const pod = await publishPod(owner.userId, "public");
    const now = new Date("2026-08-01T00:00:00.000Z");

    expect(
      await repository.cancelEnrollmentPod({
        creatorUserId: stranger.userId,
        podId: pod.id,
        now
      })
    ).toBeNull();
    const cancelled = await repository.cancelEnrollmentPod({
      creatorUserId: owner.userId,
      podId: pod.id,
      now
    });
    expect(cancelled).toMatchObject({ state: "cancelled", contractData: pod.contractData });
    expect(await repository.getPublicPod(pod.id, now)).toBeNull();
    expect(await repository.getPodForOwner(owner.userId, pod.id)).toMatchObject({
      state: "cancelled",
      contractData: pod.contractData
    });
  });
});
