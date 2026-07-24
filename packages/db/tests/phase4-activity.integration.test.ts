import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

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
  settlementMode: "proportional",
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
  verification: { verifier: "creator", targetReviewHours: 12, timeoutProtectionHours: 24 }
};
const legacyReviewerContract: PublishedPodContract = {
  ...contract,
  verification: {
    verifier: "pods_team",
    targetReviewHours: 12,
    timeoutProtectionHours: 24
  }
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
  await repository.saveProfile(session.userId, {
    handle: `builder_${session.userId.slice(0, 8)}`,
    displayName: "Pods Builder",
    bio: "Shipping a visible improvement with Pods.",
    avatar: { kind: "preset", preset: "indigo" },
    visibility: "public",
    dmPolicy: "requests",
    activityStatusVisible: true
  });
  return session;
}

async function createLockedFixture(publishedContract: PublishedPodContract = contract) {
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
      [
        podId,
        owner.userId,
        JSON.stringify(publishedContract),
        new Date("2027-04-01T00:00:00.000Z")
      ]
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

async function createReviewingFixture(
  proofShareMode: "reviewer_only" | "pod_shared" = "reviewer_only",
  publishedContract: PublishedPodContract = contract
) {
  const fixture = await createLockedFixture(publishedContract);
  await repository.runOccurrenceTransitions(new Date("2027-04-05T08:00:00.000Z"));
  const commitment = await repository.lockOccurrenceCommitment({
    userId: fixture.member.userId,
    podId: fixture.podId,
    occurrenceId: fixture.occurrenceId,
    task: "Ship creator-scoped proof review persistence with race-safe terminal decisions.",
    deliverableType: "pull_request",
    now: new Date("2027-04-05T08:05:00.000Z")
  });
  const conversation = await repository.ensurePodConversation({
    podId: fixture.podId,
    userId: fixture.member.userId
  });
  const draft = await repository.saveSubmissionDraft({
    userId: fixture.member.userId,
    podId: fixture.podId,
    occurrenceId: fixture.occurrenceId,
    resultSummary: "Implemented creator-scoped proof review persistence and concurrency coverage.",
    artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
    evidence: {
      objectKey: `private/${fixture.podId}/${randomUUID()}.webp`,
      contentType: "image/webp",
      byteSize: 2048
    },
    proofShareMode,
    now: new Date("2027-04-05T10:00:00.000Z")
  });
  const submission = await repository.submitOccurrenceEvidence({
    userId: fixture.member.userId,
    submissionId: draft.id,
    now: new Date("2027-04-05T11:00:00.000Z")
  });
  return { ...fixture, commitment, conversation, submission };
}

async function inspectReviewRecords(submissionId: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const decisions = await pool.query<{
      action: string;
      reviewer_id: string;
      reason_code: string;
      note: string;
    }>(
      `SELECT action, reviewer_id, reason_code, note
       FROM review_decisions
       WHERE submission_id = $1`,
      [submissionId]
    );
    const events = await pool.query<{ kind: string; payload: Record<string, unknown> }>(
      `SELECT kind, payload
       FROM realtime_events
       WHERE payload->>'submissionId' = $1
         AND kind IN ('submission.approved', 'submission.rejected', 'submission.timeout_protected')
       ORDER BY id`,
      [submissionId]
    );
    return { decisions: decisions.rows, events: events.rows };
  } finally {
    await pool.end();
  }
}

describe("Phase 4 Build and Ship persistence", () => {
  it("keeps proportional Pods in final review until immutable settlement exists", async () => {
    const fixture = await createLockedFixture(contract);
    await repository.runOccurrenceTransitions(
      new Date("2027-04-05T08:00:00.000Z")
    );

    const result = await repository.runOccurrenceTransitions(
      new Date("2027-04-06T00:00:00.000Z")
    );

    expect(result.completedPods).toBe(0);
    expect(
      await repository.getPodForOwner(fixture.owner.userId, fixture.podId)
    ).toMatchObject({ state: "final_review", completedAt: null });
  });

  it("retains automatic completion for immutable full-return alpha Pods", async () => {
    const fixture = await createLockedFixture({
      ...contract,
      settlementMode: "full_refund_alpha"
    });
    await repository.runOccurrenceTransitions(
      new Date("2027-04-05T08:00:00.000Z")
    );

    const result = await repository.runOccurrenceTransitions(
      new Date("2027-04-06T00:00:00.000Z")
    );

    expect(result.completedPods).toBe(1);
    expect(
      await repository.getPodForOwner(fixture.owner.userId, fixture.podId)
    ).toMatchObject({ state: "completed" });
  });

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

  it("returns the complete frozen occurrence schedule for one active member", async () => {
    const fixture = await createLockedFixture();
    const secondOccurrenceId = randomUUID();
    const recurringContract: PublishedPodContract = {
      ...contract,
      activity: {
        ...contract.activity,
        endDate: "2027-04-07",
        weekdays: [1, 3]
      },
      commitment: { lunaPerOccurrence: 10_000, occurrenceCount: 2, totalLuna: 20_000 }
    };
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query("UPDATE pods SET contract_data = $2::jsonb WHERE id = $1", [
        fixture.podId,
        JSON.stringify(recurringContract)
      ]);
      await pool.query(
        `INSERT INTO occurrences (id, pod_id, ordinal, local_date, opens_at, closes_at, commitment_deadline_at, state)
         VALUES ($1, $2, 2, '2027-04-07', $3, $4, $5, 'scheduled')`,
        [
          secondOccurrenceId,
          fixture.podId,
          new Date("2027-04-07T00:00:00.000Z"),
          new Date("2027-04-07T23:59:59.999Z"),
          new Date("2027-04-07T09:00:00.000Z")
        ]
      );
    } finally {
      await pool.end();
    }
    await repository.runOccurrenceTransitions(new Date("2027-04-05T08:00:00.000Z"));

    const schedule = await repository.listActivityScheduleForMember({
      userId: fixture.member.userId,
      podId: fixture.podId
    });
    expect(schedule?.map(({ occurrence }) => occurrence.id)).toEqual([
      fixture.occurrenceId,
      secondOccurrenceId
    ]);
    expect(schedule?.every(({ commitment, submission }) => !commitment && !submission)).toBe(true);
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

  it("persists a draft, submits it, and permits only the Pod creator to approve", async () => {
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
    const room = await repository.ensurePodConversation({
      podId: fixture.podId,
      userId: fixture.member.userId
    });
    const committedRoom = await repository.listConversationMessages({
      conversationId: room.id,
      userId: fixture.member.userId,
      afterSequence: 0,
      limit: 20
    });
    expect(committedRoom.messages).toHaveLength(1);
    expect(committedRoom.messages[0]).toMatchObject({
      kind: "activity",
      activity: { commitmentId: commitment.id, state: "committed" }
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
      proofShareMode: "pod_shared",
      now: new Date("2027-04-05T10:00:00.000Z")
    });
    expect(draft).toMatchObject({ commitmentId: commitment.id, state: "draft" });
    expect(await repository.getReviewSubmissionForCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: draft.id
    })).toBeNull();

    const submitted = await repository.submitOccurrenceEvidence({
      userId: fixture.member.userId,
      submissionId: draft.id,
      now: new Date("2027-04-05T11:00:00.000Z")
    });
    expect(submitted).toMatchObject({ state: "reviewing" });
    expect(submitted.reviewTargetAt?.toISOString()).toBe("2027-04-05T23:00:00.000Z");
    expect(submitted.reviewHardDeadlineAt?.toISOString()).toBe("2027-04-06T11:00:00.000Z");
    const reviewingRoom = await repository.listConversationMessages({
      conversationId: room.id,
      userId: fixture.owner.userId,
      afterSequence: 0,
      limit: 20
    });
    expect(reviewingRoom.messages).toHaveLength(1);
    expect(reviewingRoom.messages[0]).toMatchObject({
      activity: {
        state: "reviewing",
        resultSummary: "Implemented immutable task locks, evidence drafts, and reviewer-controlled approval.",
        artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
        sharedEvidenceAvailable: true
      }
    });
    const visibleProofs = await repository.listPodVisibleSubmissions({
      userId: fixture.owner.userId,
      podId: fixture.podId,
      memberQuery: "builder_",
      viewerOnly: false,
      page: 1,
      limit: 20
    });
    expect(visibleProofs?.items).toHaveLength(1);
    expect(visibleProofs?.items[0]).toMatchObject({
      submission: { id: draft.id, state: "reviewing" },
      participant: { displayName: "Pods Builder" },
      sharedEvidenceAvailable: true
    });
    expect(visibleProofs?.items[0]?.submission).not.toHaveProperty("evidenceObjectKey");
    expect(await repository.getSharedSubmissionEvidence({
      podId: fixture.podId,
      submissionId: draft.id,
      userId: fixture.owner.userId
    })).toMatchObject({
      objectKey: `pods/${fixture.podId}/proof.webp`,
      contentType: "image/webp"
    });

    const unrelatedCreator = await createUser();
    const queue = await repository.listPendingReviewsForCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId
    });
    expect(queue).toEqual(expect.arrayContaining([
      expect.objectContaining({ submission: expect.objectContaining({ id: draft.id }) })
    ]));
    expect(queue?.[0]).toMatchObject({
      timeZone: "UTC",
      commitment: { id: commitment.id },
      occurrence: { id: fixture.occurrenceId },
      participant: {
        handle: expect.any(String),
        displayName: "Pods Builder",
        avatar: { kind: "preset", preset: "indigo" }
      }
    });
    expect(queue?.[0]?.participant).not.toHaveProperty("userId");
    expect(queue?.[0]?.participant).not.toHaveProperty("bio");
    expect(await repository.listPendingReviewsForCreator({
      creatorUserId: fixture.member.userId,
      podId: fixture.podId
    })).toBeNull();
    expect(await repository.listPendingReviewsForCreator({
      creatorUserId: unrelatedCreator.userId,
      podId: fixture.podId
    })).toBeNull();

    expect(await repository.getReviewSubmissionForCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: draft.id
    })).toMatchObject({
      submission: { id: draft.id, state: "reviewing" },
      commitment: { id: commitment.id },
      occurrence: { id: fixture.occurrenceId },
      pod: { id: fixture.podId },
      participant: { displayName: "Pods Builder" },
      reviewDecision: null
    });
    expect(await repository.getReviewSubmissionForCreator({
      creatorUserId: fixture.member.userId,
      podId: fixture.podId,
      submissionId: draft.id
    })).toBeNull();
    expect(await repository.getReviewSubmissionForCreator({
      creatorUserId: unrelatedCreator.userId,
      podId: fixture.podId,
      submissionId: draft.id
    })).toBeNull();
    expect(await repository.getCreatorSubmissionEvidence({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: draft.id
    })).toMatchObject({
      objectKey: `pods/${fixture.podId}/proof.webp`,
      contentType: "image/webp",
      byteSize: 1234
    });
    expect(await repository.getCreatorSubmissionEvidence({
      creatorUserId: fixture.member.userId,
      podId: fixture.podId,
      submissionId: draft.id
    })).toBeNull();
    expect(await repository.getCreatorSubmissionEvidence({
      creatorUserId: unrelatedCreator.userId,
      podId: fixture.podId,
      submissionId: draft.id
    })).toBeNull();

    const decision = await repository.decideSubmissionAsCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: draft.id,
      decision: {
        decision: "approve",
        note: "The public pull request visibly completes the locked task."
      },
      now: new Date("2027-04-05T12:01:00.000Z")
    });
    expect(decision).toMatchObject({
      kind: "decided",
      submission: {
        state: "approved",
        approvedAt: new Date("2027-04-05T12:01:00.000Z"),
        reviewedAt: new Date("2027-04-05T12:01:00.000Z")
      }
    });
    expect(await repository.decideSubmissionAsCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: draft.id,
      decision: {
        decision: "reject",
        reason: "A later decision must not mutate terminal approval."
      },
      now: new Date("2027-04-05T12:02:00.000Z")
    })).toMatchObject({
      kind: "already_decided",
      submission: {
        state: "approved",
        approvedAt: new Date("2027-04-05T12:01:00.000Z"),
        reviewedAt: new Date("2027-04-05T12:01:00.000Z")
      }
    });
    const approvedRoom = await repository.listConversationMessages({
      conversationId: room.id,
      userId: fixture.member.userId,
      afterSequence: 0,
      limit: 20
    });
    expect(approvedRoom.messages[0]).toMatchObject({
      id: committedRoom.messages[0]?.id,
      activity: { state: "approved", sharedEvidenceAvailable: true }
    });
    expect(await repository.getSubmissionForOwner({
      userId: fixture.member.userId,
      submissionId: draft.id
    })).toMatchObject({
      submission: { state: "approved" },
      reviewDecision: {
        action: "approved",
        reviewerId: fixture.owner.userId,
        reasonCode: "meets_commitment",
        note: "The public pull request visibly completes the locked task."
      }
    });
    expect(await repository.getReviewSubmissionForCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: draft.id
    })).toMatchObject({
      submission: { state: "approved" },
      reviewDecision: { action: "approved" }
    });
    expect(await inspectReviewRecords(draft.id)).toMatchObject({
      decisions: [{ action: "approved", reviewer_id: fixture.owner.userId }],
      events: [{
        kind: "submission.approved",
        payload: {
          messageId: committedRoom.messages[0]?.id,
          submissionId: draft.id
        }
      }]
    });
  });

  it("finds the first pending creator review with one active-Pod aggregate query", async () => {
    const laterActive = await createReviewingFixture();
    const earlierFinalReview = await createReviewingFixture();
    const legacyEarlier = await createReviewingFixture(
      "reviewer_only",
      legacyReviewerContract
    );
    const historicalEarlier = await createReviewingFixture();
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query(
        `UPDATE pods
         SET creator_user_id = $1,
             state = CASE
               WHEN id = $2 THEN 'final_review'
               WHEN id = $3 THEN 'completed'
               ELSE state
             END
         WHERE id = ANY($4::uuid[])`,
        [
          laterActive.owner.userId,
          earlierFinalReview.podId,
          historicalEarlier.podId,
          [
            earlierFinalReview.podId,
            legacyEarlier.podId,
            historicalEarlier.podId
          ]
        ]
      );
      await pool.query(
        `UPDATE submissions
         SET review_target_at = CASE
           WHEN id = $1 THEN $5::timestamptz
           WHEN id = $2 THEN $6::timestamptz
           WHEN id = $3 THEN $7::timestamptz
           WHEN id = $4 THEN $8::timestamptz
         END
         WHERE id = ANY($9::uuid[])`,
        [
          laterActive.submission.id,
          earlierFinalReview.submission.id,
          legacyEarlier.submission.id,
          historicalEarlier.submission.id,
          new Date("2027-04-05T22:00:00.000Z"),
          new Date("2027-04-05T20:00:00.000Z"),
          new Date("2027-04-05T18:00:00.000Z"),
          new Date("2027-04-05T17:00:00.000Z"),
          [
            laterActive.submission.id,
            earlierFinalReview.submission.id,
            legacyEarlier.submission.id,
            historicalEarlier.submission.id
          ]
        ]
      );

      expect(await repository.findFirstPendingReviewForCreator({
        creatorUserId: laterActive.owner.userId
      })).toMatchObject({
        id: earlierFinalReview.podId,
        creatorUserId: laterActive.owner.userId,
        state: "final_review",
        contractData: { verification: { verifier: "creator" } }
      });
      expect(await repository.findFirstPendingReviewForCreator({
        creatorUserId: laterActive.member.userId
      })).toBeNull();
    } finally {
      await pool.query(
        "DELETE FROM pods WHERE id = ANY($1::uuid[])",
        [[
          laterActive.podId,
          earlierFinalReview.podId,
          legacyEarlier.podId,
          historicalEarlier.podId
        ]]
      );
      await pool.end();
    }
  });

  it("denies creator review authority for a legacy Pods-team verifier contract", async () => {
    const fixture = await createReviewingFixture(
      "reviewer_only",
      legacyReviewerContract
    );
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query(
        "UPDATE submissions SET review_hard_deadline_at = $2 WHERE id = $1",
        [fixture.submission.id, new Date("2027-04-07T11:00:00.000Z")]
      );
    } finally {
      await pool.end();
    }

    expect(await repository.listPendingReviewsForCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId
    })).toBeNull();
    expect(await repository.getReviewSubmissionForCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    })).toBeNull();
    expect(await repository.getCreatorSubmissionEvidence({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    })).toBeNull();
    expect(await repository.decideSubmissionAsCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      decision: { decision: "approve" },
      now: new Date("2027-04-05T12:00:00.000Z")
    })).toBeNull();
    expect(await repository.getSubmissionForOwner({
      userId: fixture.member.userId,
      submissionId: fixture.submission.id
    })).toMatchObject({
      submission: { state: "reviewing" },
      reviewDecision: null
    });
    expect(await inspectReviewRecords(fixture.submission.id)).toMatchObject({
      decisions: [],
      events: []
    });
  });

  it("stores a creator rejection privately and leaves the room projection reason-free", async () => {
    const fixture = await createReviewingFixture();
    const reason = "The artifact does not implement the locked persistence deliverable.";

    expect(await repository.decideSubmissionAsCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      decision: { decision: "reject", reason },
      now: new Date("2027-04-05T12:00:00.000Z")
    })).toMatchObject({
      kind: "decided",
      submission: {
        state: "rejected",
        reviewedAt: new Date("2027-04-05T12:00:00.000Z"),
        approvedAt: null
      }
    });

    expect(await repository.getSubmissionForOwner({
      userId: fixture.member.userId,
      submissionId: fixture.submission.id
    })).toMatchObject({
      submission: { state: "rejected" },
      reviewDecision: {
        action: "rejected",
        reviewerId: fixture.owner.userId,
        reasonCode: "does_not_meet_commitment",
        note: reason
      }
    });
    const room = await repository.listConversationMessages({
      conversationId: fixture.conversation.id,
      userId: fixture.member.userId,
      afterSequence: 0,
      limit: 20
    });
    expect(room.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "activity",
        activity: expect.objectContaining({ state: "rejected" })
      })
    ]));
    expect(JSON.stringify(room)).not.toContain(reason);
    expect(await inspectReviewRecords(fixture.submission.id)).toMatchObject({
      decisions: [{
        action: "rejected",
        reviewer_id: fixture.owner.userId,
        reason_code: "does_not_meet_commitment",
        note: reason
      }],
      events: [{
        kind: "submission.rejected",
        payload: {
          messageId: expect.any(String),
          submissionId: fixture.submission.id
        }
      }]
    });
  });

  it("upgrades legacy approvals to the creator-review timestamp and reason contract", async () => {
    const schemaName = `creator_review_${randomUUID().replaceAll("-", "")}`;
    const submissionId = randomUUID();
    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`CREATE SCHEMA "${schemaName}"`);
      await client.query(`SET LOCAL search_path TO "${schemaName}"`);
      await client.query(
        `CREATE TABLE submissions (
          id uuid PRIMARY KEY,
          state text NOT NULL,
          review_target_at timestamp with time zone,
          review_hard_deadline_at timestamp with time zone,
          approved_at timestamp with time zone,
          updated_at timestamp with time zone NOT NULL
        )`
      );
      await client.query(
        `CREATE TABLE review_decisions (
          id uuid PRIMARY KEY,
          submission_id uuid NOT NULL,
          action text NOT NULL,
          reviewer_id text NOT NULL,
          reason_code text NOT NULL,
          note text NOT NULL,
          created_at timestamp with time zone NOT NULL
        )`
      );
      await client.query(
        `CREATE UNIQUE INDEX review_decisions_submission_action_unique
         ON review_decisions (submission_id, action)`
      );
      await client.query(
        `INSERT INTO submissions
          (id, state, review_target_at, review_hard_deadline_at, approved_at, updated_at)
         VALUES
          ($1, 'approved', '2027-04-05T23:00:00.000Z', '2027-04-06T11:00:00.000Z',
           '2027-04-05T12:00:00.000Z', '2027-04-05T12:00:00.000Z')`,
        [submissionId]
      );
      await client.query(
        `INSERT INTO review_decisions
          (id, submission_id, action, reviewer_id, reason_code, note, created_at)
         VALUES
          ($1, $2, 'approved', 'pods-team-reviewer', 'meets_frozen_commitment',
           'Legacy centralized approval.', '2027-04-05T12:00:00.000Z')`,
        [randomUUID(), submissionId]
      );
      const migrationSql = await readFile(
        new URL("../migrations/0012_creator_review_mvp.sql", import.meta.url),
        "utf8"
      );
      const statements = migrationSql
        .split("--> statement-breakpoint")
        .map((statement) => statement.trim())
        .filter(Boolean);
      for (const statement of statements) await client.query(statement);

      const upgraded = await client.query<{
        reviewed_at: Date | null;
        approved_at: Date | null;
        reason_code: string;
      }>(
        `SELECT submissions.reviewed_at, submissions.approved_at, review_decisions.reason_code
         FROM submissions
         INNER JOIN review_decisions ON review_decisions.submission_id = submissions.id
         WHERE submissions.id = $1`,
        [submissionId]
      );
      expect(upgraded.rows[0]).toMatchObject({
        reviewed_at: new Date("2027-04-05T12:00:00.000Z"),
        approved_at: new Date("2027-04-05T12:00:00.000Z"),
        reason_code: "meets_commitment"
      });
      const indexes = await client.query<{ indexname: string }>(
        `SELECT indexname
         FROM pg_indexes
         WHERE schemaname = $1
           AND indexname IN (
             'review_decisions_submission_unique',
             'submissions_state_hard_deadline_idx'
           )
         ORDER BY indexname`,
        [schemaName]
      );
      expect(indexes.rows.map(({ indexname }) => indexname)).toEqual([
        "review_decisions_submission_unique",
        "submissions_state_hard_deadline_idx"
      ]);
    } finally {
      await client.query("ROLLBACK");
      client.release();
      await pool.end();
    }
  });

  it("protects a review at the exact hard deadline without creating a manual decision", async () => {
    const fixture = await createReviewingFixture();

    expect(await repository.protectTimedOutReviews(
      new Date("2027-04-06T10:59:59.999Z")
    )).toEqual({ protectedSubmissions: 0 });
    expect(await repository.protectTimedOutReviews(
      new Date("2027-04-06T11:00:00.000Z")
    )).toEqual({ protectedSubmissions: 1 });

    expect(await repository.getSubmissionForOwner({
      userId: fixture.member.userId,
      submissionId: fixture.submission.id
    })).toMatchObject({
      submission: {
        state: "timeout_protected",
        reviewedAt: new Date("2027-04-06T11:00:00.000Z"),
        approvedAt: null
      },
      reviewDecision: null
    });
    expect(await repository.decideSubmissionAsCreator({
      creatorUserId: fixture.owner.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      decision: { decision: "approve" },
      now: new Date("2027-04-06T11:00:00.001Z")
    })).toMatchObject({
      kind: "already_decided",
      submission: { state: "timeout_protected" }
    });
    expect(await repository.protectTimedOutReviews(
      new Date("2027-04-06T11:00:00.002Z")
    )).toEqual({ protectedSubmissions: 0 });
    expect(await inspectReviewRecords(fixture.submission.id)).toMatchObject({
      decisions: [],
      events: [{
        kind: "submission.timeout_protected",
        payload: {
          messageId: expect.any(String),
          submissionId: fixture.submission.id
        }
      }]
    });
  });

  it("serializes concurrent creator decisions into one immutable terminal result", async () => {
    const fixture = await createReviewingFixture();
    const results = await Promise.all([
      repository.decideSubmissionAsCreator({
        creatorUserId: fixture.owner.userId,
        podId: fixture.podId,
        submissionId: fixture.submission.id,
        decision: { decision: "approve", note: "The artifact satisfies the commitment." },
        now: new Date("2027-04-05T12:00:00.000Z")
      }),
      repository.decideSubmissionAsCreator({
        creatorUserId: fixture.owner.userId,
        podId: fixture.podId,
        submissionId: fixture.submission.id,
        decision: {
          decision: "reject",
          reason: "The artifact does not satisfy the locked commitment."
        },
        now: new Date("2027-04-05T12:00:00.001Z")
      })
    ]);

    expect(results.map((result) => result?.kind).sort()).toEqual([
      "already_decided",
      "decided"
    ]);
    const records = await inspectReviewRecords(fixture.submission.id);
    expect(records.decisions).toHaveLength(1);
    expect(records.events).toHaveLength(1);
    expect(records.events[0]?.payload).toEqual({
      messageId: expect.any(String),
      submissionId: fixture.submission.id
    });
    const owner = await repository.getSubmissionForOwner({
      userId: fixture.member.userId,
      submissionId: fixture.submission.id
    });
    expect(["approved", "rejected"]).toContain(owner?.submission.state);
  });

  it("serializes the timeout worker against a creator decision", async () => {
    const fixture = await createReviewingFixture();
    const [creatorResult, timeoutResult] = await Promise.all([
      repository.decideSubmissionAsCreator({
        creatorUserId: fixture.owner.userId,
        podId: fixture.podId,
        submissionId: fixture.submission.id,
        decision: { decision: "approve", note: "The artifact satisfies the commitment." },
        now: new Date("2027-04-06T11:00:00.000Z")
      }),
      repository.protectTimedOutReviews(new Date("2027-04-06T11:00:00.000Z"))
    ]);

    expect(creatorResult?.kind).toBe("already_decided");
    expect([0, 1]).toContain(timeoutResult.protectedSubmissions);
    const owner = await repository.getSubmissionForOwner({
      userId: fixture.member.userId,
      submissionId: fixture.submission.id
    });
    expect(owner?.submission.state).toBe("timeout_protected");
    const records = await inspectReviewRecords(fixture.submission.id);
    expect(records.decisions).toHaveLength(0);
    expect(records.events).toHaveLength(1);
  });

  it("counts timeout protection as success while a rejected occurrence breaks the streak", async () => {
    const fixture = await createLockedFixture();
    const secondOccurrenceId = randomUUID();
    const thirdOccurrenceId = randomUUID();
    const commitmentIds = [randomUUID(), randomUUID(), randomUUID()];
    const submissionIds = [randomUUID(), randomUUID(), randomUUID()];
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query(
        `INSERT INTO occurrences
          (id, pod_id, ordinal, local_date, opens_at, closes_at, commitment_deadline_at, state)
         VALUES
          ($1, $3, 2, '2027-04-06', '2027-04-06T00:00:00.000Z', '2027-04-06T23:59:59.999Z', '2027-04-06T09:00:00.000Z', 'review_open'),
          ($2, $3, 3, '2027-04-07', '2027-04-07T00:00:00.000Z', '2027-04-07T23:59:59.999Z', '2027-04-07T09:00:00.000Z', 'review_open')`,
        [secondOccurrenceId, thirdOccurrenceId, fixture.podId]
      );
      await pool.query(
        `INSERT INTO occurrence_commitments
          (id, occurrence_id, membership_id, task, deliverable_type, locked_at)
         VALUES
          ($1, $4, $7, 'Rejected first occurrence commitment.', 'pull_request', '2027-04-05T08:00:00.000Z'),
          ($2, $5, $7, 'Approved second occurrence commitment.', 'pull_request', '2027-04-06T08:00:00.000Z'),
          ($3, $6, $7, 'Protected third occurrence commitment.', 'pull_request', '2027-04-07T08:00:00.000Z')`,
        [
          ...commitmentIds,
          fixture.occurrenceId,
          secondOccurrenceId,
          thirdOccurrenceId,
          fixture.membershipId
        ]
      );
      await pool.query(
        `INSERT INTO submissions
          (id, occurrence_id, membership_id, commitment_id, state, result_summary,
           artifact_url, proof_share_mode, submitted_at, reviewed_at, approved_at,
           created_at, updated_at)
         VALUES
          ($1, $4, $7, $8, 'rejected', 'Rejected proof result for streak coverage.',
           'https://github.com/18Abhinav07/Pods/pull/41', 'reviewer_only',
           '2027-04-05T10:00:00.000Z', '2027-04-06T10:00:00.000Z', NULL,
           '2027-04-05T10:00:00.000Z', '2027-04-06T10:00:00.000Z'),
          ($2, $5, $7, $9, 'approved', 'Approved proof result for streak coverage.',
           'https://github.com/18Abhinav07/Pods/pull/42', 'reviewer_only',
           '2027-04-06T10:00:00.000Z', '2027-04-07T10:00:00.000Z', '2027-04-07T10:00:00.000Z',
           '2027-04-06T10:00:00.000Z', '2027-04-07T10:00:00.000Z'),
          ($3, $6, $7, $10, 'timeout_protected', 'Protected proof result for streak coverage.',
           'https://github.com/18Abhinav07/Pods/pull/43', 'reviewer_only',
           '2027-04-07T10:00:00.000Z', '2027-04-08T10:00:00.000Z', NULL,
           '2027-04-07T10:00:00.000Z', '2027-04-08T10:00:00.000Z')`,
        [
          ...submissionIds,
          fixture.occurrenceId,
          secondOccurrenceId,
          thirdOccurrenceId,
          fixture.membershipId,
          ...commitmentIds
        ]
      );
    } finally {
      await pool.end();
    }

    expect(await repository.getActivityStreak({
      membershipId: fixture.membershipId,
      podId: fixture.podId,
      now: new Date("2027-04-09T00:00:00.000Z")
    })).toBe(2);
    expect((await repository.listApprovedFeedForPod({
      userId: fixture.owner.userId,
      podId: fixture.podId
    }))?.map(({ submission }) => submission.state)).toEqual([
      "approved",
      "timeout_protected"
    ]);
  });

  it("breaks an approved streak as soon as the current occurrence is rejected", async () => {
    const fixture = await createLockedFixture();
    const currentOccurrenceId = randomUUID();
    const commitmentIds = [randomUUID(), randomUUID()];
    const submissionIds = [randomUUID(), randomUUID()];
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query(
        `INSERT INTO occurrences
          (id, pod_id, ordinal, local_date, opens_at, closes_at, commitment_deadline_at, state)
         VALUES
          ($1, $2, 2, '2027-04-06', '2027-04-06T00:00:00.000Z',
           '2027-04-06T23:59:59.999Z', '2027-04-06T09:00:00.000Z', 'evidence_open')`,
        [currentOccurrenceId, fixture.podId]
      );
      await pool.query(
        `INSERT INTO occurrence_commitments
          (id, occurrence_id, membership_id, task, deliverable_type, locked_at)
         VALUES
          ($1, $3, $5, 'Approved prior occurrence commitment.', 'pull_request',
           '2027-04-05T08:00:00.000Z'),
          ($2, $4, $5, 'Rejected current occurrence commitment.', 'pull_request',
           '2027-04-06T08:00:00.000Z')`,
        [
          ...commitmentIds,
          fixture.occurrenceId,
          currentOccurrenceId,
          fixture.membershipId
        ]
      );
      await pool.query(
        `INSERT INTO submissions
          (id, occurrence_id, membership_id, commitment_id, state, result_summary,
           artifact_url, proof_share_mode, submitted_at, reviewed_at, approved_at,
           created_at, updated_at)
         VALUES
          ($1, $3, $5, $6, 'approved', 'Approved prior proof for streak coverage.',
           'https://github.com/18Abhinav07/Pods/pull/51', 'reviewer_only',
           '2027-04-05T10:00:00.000Z', '2027-04-05T12:00:00.000Z',
           '2027-04-05T12:00:00.000Z', '2027-04-05T10:00:00.000Z',
           '2027-04-05T12:00:00.000Z'),
          ($2, $4, $5, $7, 'rejected', 'Rejected current proof for streak coverage.',
           'https://github.com/18Abhinav07/Pods/pull/52', 'reviewer_only',
           '2027-04-06T10:00:00.000Z', '2027-04-06T11:00:00.000Z', NULL,
           '2027-04-06T10:00:00.000Z', '2027-04-06T11:00:00.000Z')`,
        [
          ...submissionIds,
          fixture.occurrenceId,
          currentOccurrenceId,
          fixture.membershipId,
          ...commitmentIds
        ]
      );
    } finally {
      await pool.end();
    }

    expect(await repository.getActivityStreak({
      membershipId: fixture.membershipId,
      podId: fixture.podId,
      now: new Date("2027-04-06T12:00:00.000Z")
    })).toBe(0);
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
