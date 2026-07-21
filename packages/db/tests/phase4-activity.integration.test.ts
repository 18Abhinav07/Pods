import { randomUUID } from "node:crypto";

import type { PublishedPodContract } from "@pods/domain";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/index";
import { runPodsMigrations } from "../src/migration-runner";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const repository = createPodsRepository(databaseUrl);
const testUserIds = new Set<string>();

const contract: PublishedPodContract = {
  version: 1,
  templateId: "build",
  evidenceMode: "per_occurrence_commitment",
  activity: {
    name: "Build Pods in Public",
    purpose: "Ship a visible and reviewable improvement on every scheduled occurrence.",
    startDate: "2027-04-05",
    endDate: "2027-04-05",
    timeZone: "UTC",
    weekdays: [1],
    config: {
      projectTheme: "A polished accountability product for Nimiq builders",
      allowedDeliverables: ["pull_request", "commit", "issue", "live_artifact"],
      commitmentCutoff: "09:00"
    }
  },
  community: {
    visibility: "public",
    minParticipants: 2,
    maxParticipants: 5,
    applicationQuestions: []
  },
  commitment: { lunaPerOccurrence: 10_000, occurrenceCount: 1, totalLuna: 10_000 },
  verification: { verifier: "pods_team", targetReviewHours: 12, timeoutProtectionHours: 24 }
};

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
    expiresAt: new Date("2028-01-01T00:00:00.000Z")
  });
  testUserIds.add(session.userId);
  return session;
}

async function createLockedFixture() {
  const owner = await createUser();
  const member = await createUser();
  const podId = randomUUID();
  const membershipId = randomUUID();
  const occurrenceId = randomUUID();
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(
      `INSERT INTO pods (id, creator_user_id, state, template_id, draft_data, contract_data, contract_hash, published_at, created_at, updated_at)
       VALUES ($1, $2, 'locked_scheduled', 'build', '{}', $3::jsonb, 'phase4-contract', $4, $4, $4)`,
      [podId, owner.userId, JSON.stringify(contract), new Date("2027-04-01T00:00:00.000Z")]
    );
    await pool.query(
      `INSERT INTO memberships (id, pod_id, user_id, admission_source, state, accepted_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'public_application', 'roster_locked', $4, $4, $4)`,
      [membershipId, podId, member.userId, new Date("2027-04-01T00:00:00.000Z")]
    );
    await pool.query(
      `INSERT INTO occurrences (id, pod_id, ordinal, local_date, opens_at, closes_at, commitment_deadline_at, state)
       VALUES ($1, $2, 1, '2027-04-05', $3, $4, $5, 'scheduled')`,
      [
        occurrenceId,
        podId,
        new Date("2027-04-05T00:00:00.000Z"),
        new Date("2027-04-05T23:59:59.999Z"),
        new Date("2027-04-05T09:00:00.000Z")
      ]
    );
  } finally {
    await pool.end();
  }
  return { owner, member, podId, membershipId, occurrenceId };
}

describe("Phase 4 Build and Ship persistence", () => {
  it("activates the Pod and roster when the first occurrence opens", async () => {
    const fixture = await createLockedFixture();
    const result = await repository.runOccurrenceTransitions(
      new Date("2027-04-05T00:01:00.000Z")
    );

    expect(result).toMatchObject({ activatedPods: 1, activatedMemberships: 1 });
    expect(await repository.getPodForOwner(fixture.owner.userId, fixture.podId))
      .toMatchObject({ state: "active" });
    expect(await repository.getMembershipForUser(fixture.member.userId, fixture.podId))
      .toMatchObject({ state: "active" });
  });

  it("locks one immutable task before the frozen cutoff", async () => {
    const fixture = await createLockedFixture();
    const now = new Date("2027-04-05T08:00:00.000Z");
    await repository.runOccurrenceTransitions(now);
    const locked = await repository.lockOccurrenceCommitment({
      userId: fixture.member.userId,
      podId: fixture.podId,
      occurrenceId: fixture.occurrenceId,
      task: "Implement the participant activity screen with complete mobile states.",
      deliverableType: "pull_request",
      now
    });

    expect(locked).toMatchObject({ deliverableType: "pull_request" });
    await expect(repository.lockOccurrenceCommitment({
      userId: fixture.member.userId,
      podId: fixture.podId,
      occurrenceId: fixture.occurrenceId,
      task: "Replace the task after seeing the deadline.",
      deliverableType: "issue",
      now
    })).rejects.toThrow("commitment is already locked");
  });

  it("persists a draft, submits it, and permits only a Pods reviewer to approve", async () => {
    const fixture = await createLockedFixture();
    await repository.runOccurrenceTransitions(new Date("2027-04-05T08:00:00.000Z"));
    const commitment = await repository.lockOccurrenceCommitment({
      userId: fixture.member.userId,
      podId: fixture.podId,
      occurrenceId: fixture.occurrenceId,
      task: "Ship the activity repository and its integration tests.",
      deliverableType: "pull_request",
      now: new Date("2027-04-05T08:05:00.000Z")
    });
    const draft = await repository.saveSubmissionDraft({
      userId: fixture.member.userId,
      podId: fixture.podId,
      occurrenceId: fixture.occurrenceId,
      resultSummary: "Implemented immutable task locks, evidence drafts, and reviewer-controlled approval.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
      evidence: {
        objectKey: `pods/${fixture.podId}/proof.webp`,
        contentType: "image/webp",
        byteSize: 1234
      },
      now: new Date("2027-04-05T10:00:00.000Z")
    });
    expect(draft).toMatchObject({ commitmentId: commitment.id, state: "draft" });

    const submitted = await repository.submitOccurrenceEvidence({
      userId: fixture.member.userId,
      submissionId: draft.id,
      now: new Date("2027-04-05T11:00:00.000Z")
    });
    expect(submitted).toMatchObject({ state: "reviewing" });
    expect(submitted.reviewTargetAt?.toISOString()).toBe("2027-04-05T23:00:00.000Z");
    expect(submitted.reviewHardDeadlineAt?.toISOString()).toBe("2027-04-06T11:00:00.000Z");

    const queue = await repository.listPendingReviews();
    expect(queue).toEqual(expect.arrayContaining([
      expect.objectContaining({ submission: expect.objectContaining({ id: draft.id }) })
    ]));
    await expect(repository.approveSubmission({
      submissionId: draft.id,
      reviewerId: fixture.member.userId,
      note: "Participant approval must not be accepted.",
      now: new Date("2027-04-05T12:00:00.000Z"),
      authority: "participant"
    })).rejects.toThrow("Pods reviewer authority is required");

    const approved = await repository.approveSubmission({
      submissionId: draft.id,
      reviewerId: "pods-team-reviewer",
      note: "The public pull request visibly completes the locked task.",
      now: new Date("2027-04-05T12:01:00.000Z"),
      authority: "reviewer"
    });
    expect(approved).toMatchObject({ state: "approved" });
    expect(await repository.getSubmissionForOwner({
      userId: fixture.member.userId,
      submissionId: draft.id
    })).toMatchObject({ submission: { state: "approved" } });
  });

  it("does not attach a late image to an otherwise editable draft", async () => {
    const fixture = await createLockedFixture();
    await repository.runOccurrenceTransitions(new Date("2027-04-05T08:00:00.000Z"));
    await repository.lockOccurrenceCommitment({
      userId: fixture.member.userId,
      podId: fixture.podId,
      occurrenceId: fixture.occurrenceId,
      task: "Ship a deadline-safe evidence upload path for the activity flow.",
      deliverableType: "pull_request",
      now: new Date("2027-04-05T08:05:00.000Z")
    });
    const draft = await repository.saveSubmissionDraft({
      userId: fixture.member.userId,
      podId: fixture.podId,
      occurrenceId: fixture.occurrenceId,
      resultSummary: "The evidence upload now checks the frozen occurrence close time.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/43",
      now: new Date("2027-04-05T10:00:00.000Z")
    });

    await expect(repository.attachSubmissionEvidence({
      userId: fixture.member.userId,
      submissionId: draft.id,
      evidence: {
        objectKey: `pods/${fixture.podId}/late.webp`,
        contentType: "image/webp",
        byteSize: 900
      },
      now: new Date("2027-04-06T00:00:00.000Z")
    })).rejects.toThrow("evidence deadline has passed");
  });
});
