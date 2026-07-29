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
  version: 3,
  templateId: "build",
  evidenceMode: "per_occurrence_commitment",
  settlementMode: "proportional",
  activity: {
    name: "Proof Reconciliation Sprint",
    purpose: "Validate a bounded proof clarification and appeal lifecycle for builders.",
    startDate: "2027-04-05",
    endDate: "2027-04-05",
    timeZone: "UTC",
    weekdays: [1],
    config: {
      projectTheme: "Pods proof review",
      allowedDeliverables: ["pull_request"],
      commitmentCutoff: "09:00"
    }
  },
  community: {
    visibility: "public",
    minParticipants: 1,
    maxParticipants: 5,
    applicationQuestions: [],
    roomAudience: "public_read_only"
  },
  commitment: {
    lunaPerOccurrence: 10_000,
    occurrenceCount: 1,
    totalLuna: 10_000
  },
  verification: {
    verifier: "creator",
    targetReviewHours: 12,
    timeoutProtectionHours: 24,
    protocol: "proof_reconciliation_v1",
    clarificationResponseHours: 12,
    postClarificationReviewHours: 12,
    appealWindowHours: 12,
    appealReviewHours: 12,
    absoluteCaseHours: 72,
    evidenceReservationGraceMinutes: 10
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
    await pool.query(
      `DELETE FROM pods
        WHERE creator_user_id = ANY($1::uuid[])
           OR id IN (
             SELECT pod_id FROM memberships WHERE user_id = ANY($1::uuid[])
           )`,
      [[...testUserIds]]
    );
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
      [...testUserIds]
    ]);
  } finally {
    await pool.end();
  }
});

async function createUser(name: string) {
  const session = await repository.createSession({
    walletAddress: `NQTEST${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date("2028-01-01T00:00:00.000Z")
  });
  testUserIds.add(session.userId);
  await repository.saveProfile(session.userId, {
    handle: `${name}_${session.userId.slice(0, 8)}`,
    displayName: name,
    bio: "Testing a complete and auditable proof review lifecycle.",
    avatar: { kind: "preset", preset: "indigo" },
    visibility: "public",
    dmPolicy: "requests",
    activityStatusVisible: true
  });
  return session;
}

async function createReviewingFixture() {
  const creator = await createUser("reviewer");
  const participant = await createUser("participant");
  const podId = randomUUID();
  const membershipId = randomUUID();
  const occurrenceId = randomUUID();
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(
      `INSERT INTO pods (id, creator_user_id, state, template_id, draft_data, contract_data, contract_hash, published_at, created_at, updated_at)
       VALUES ($1, $2, 'locked_scheduled', 'build', '{}', $3::jsonb, 'proof-v3-contract', $4, $4, $4)`,
      [podId, creator.userId, JSON.stringify(contract), new Date("2027-04-01T00:00:00.000Z")]
    );
    await pool.query(
      `INSERT INTO memberships (id, pod_id, user_id, admission_source, state, accepted_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'public_application', 'roster_locked', $4, $4, $4)`,
      [membershipId, podId, participant.userId, new Date("2027-04-01T00:00:00.000Z")]
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

  await repository.runOccurrenceTransitions(new Date("2027-04-05T08:00:00.000Z"));
  await repository.lockOccurrenceCommitment({
    userId: participant.userId,
    podId,
    occurrenceId,
    task: "Ship the transactional proof clarification and appeal lifecycle.",
    deliverableType: "pull_request",
    now: new Date("2027-04-05T08:05:00.000Z")
  });
  const draft = await repository.saveSubmissionDraft({
    userId: participant.userId,
    podId,
    occurrenceId,
    resultSummary: "Implemented the transactional proof clarification and appeal lifecycle.",
    artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
    proofShareMode: "pod_shared",
    now: new Date("2027-04-05T10:00:00.000Z")
  });
  const submission = await repository.submitOccurrenceEvidence({
    userId: participant.userId,
    submissionId: draft.id,
    now: new Date("2027-04-05T11:00:00.000Z")
  });
  return { creator, participant, podId, membershipId, occurrenceId, submission };
}

describe("proof reconciliation persistence", () => {
  it("runs clarification, provisional rejection, appeal, and approval without settling early", async () => {
    const fixture = await createReviewingFixture();
    const initial = await repository.getProofReviewForParticipant({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    });
    expect(initial?.proofCase).toMatchObject({
      stage: "initial_review",
      resolution: null,
      version: 0
    });
    expect(initial?.versions).toHaveLength(1);

    await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      action: {
        type: "request_clarification",
        reason: "The artifact needs a clearer link to the locked commitment.",
        requestedChange: "Explain where the transaction guard and appeal transition are implemented.",
        reference: "Locked task: ship the proof lifecycle"
      },
      now: new Date("2027-04-05T12:00:00.000Z")
    });
    await repository.respondToProofClarification({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      response: {
        note: "The linked pull request now points to the transaction guard and appeal transition tests.",
        artifactUrl: "https://github.com/18Abhinav07/Pods/pull/43"
      },
      evidence: {
        objectKey: "pods/private/clarification.webp",
        contentType: "image/webp",
        byteSize: 1200
      },
      mediaSha256: "a".repeat(64),
      now: new Date("2027-04-05T13:00:00.000Z")
    });
    await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      action: {
        type: "provisionally_reject",
        category: "commitment_mismatch",
        reason: "The artifact still does not demonstrate the frozen acceptance criterion.",
        unmetCriteria: ["The diff must include the frozen settlement blocker"],
        suggestedCorrection: "Point to the exact test or use a recovery commitment."
      },
      now: new Date("2027-04-05T14:00:00.000Z")
    });

    const provisional = await repository.getProofReviewForParticipant({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    });
    expect(provisional?.submission.state).toBe("reviewing");
    expect(provisional?.proofCase.stage).toBe("appeal_open");

    await repository.appealProofRejection({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      appeal: {
        reason: "The frozen settlement blocker is covered by the linked integration test at the end of the diff.",
        artifactUrl: "https://github.com/18Abhinav07/Pods/pull/44"
      },
      evidence: {
        objectKey: "pods/private/appeal.webp",
        contentType: "image/webp",
        byteSize: 1400
      },
      mediaSha256: "b".repeat(64),
      now: new Date("2027-04-05T15:00:00.000Z")
    });
    await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      action: { type: "appeal_approve", note: "The appeal points to sufficient proof." },
      now: new Date("2027-04-05T16:00:00.000Z")
    });

    const resolved = await repository.getProofReviewForParticipant({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    });
    expect(resolved?.submission.state).toBe("approved");
    expect(resolved?.proofCase).toMatchObject({ stage: "resolved", resolution: "approved" });
    expect(resolved?.events.map((event) => event.type)).toEqual([
      "request_clarification",
      "respond_clarification",
      "provisionally_reject",
      "open_appeal",
      "appeal_approve"
    ]);
    expect(resolved?.versions.map((version) => ({
      kind: version.kind,
      artifactUrl: version.artifactUrl,
      evidenceObjectKey: version.evidenceObjectKey,
      mediaSha256: version.mediaSha256
    }))).toEqual([
      expect.objectContaining({ kind: "initial" }),
      {
        kind: "clarification",
        artifactUrl: "https://github.com/18Abhinav07/Pods/pull/43",
        evidenceObjectKey: "pods/private/clarification.webp",
        mediaSha256: "a".repeat(64)
      },
      {
        kind: "appeal",
        artifactUrl: "https://github.com/18Abhinav07/Pods/pull/44",
        evidenceObjectKey: "pods/private/appeal.webp",
        mediaSha256: "b".repeat(64)
      }
    ]);
  });

  it("makes creator commands idempotent", async () => {
    const fixture = await createReviewingFixture();
    const idempotencyKey = randomUUID();
    const action = {
      type: "request_clarification" as const,
      reason: "The artifact needs a clearer link to the locked commitment.",
      requestedChange: "Explain where the transaction guard and appeal transition are implemented.",
      reference: "Locked task: ship the proof lifecycle"
    };
    const first = await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey,
      action,
      now: new Date("2027-04-05T12:00:00.000Z")
    });
    const replay = await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey,
      action,
      now: new Date("2027-04-05T12:00:01.000Z")
    });
    expect(first?.kind).toBe("transitioned");
    expect(replay?.kind).toBe("idempotent");
    expect((await repository.getProofReviewForParticipant({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    }))?.events).toHaveLength(1);
  });

  it("replays a terminal creator command after the case closes", async () => {
    const fixture = await createReviewingFixture();
    const idempotencyKey = randomUUID();
    const action = {
      type: "approve" as const,
      note: "The proof matches the frozen commitment."
    };
    const first = await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey,
      action,
      now: new Date("2027-04-05T12:00:00.000Z")
    });
    const replay = await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey,
      action,
      now: new Date("2027-04-05T12:00:01.000Z")
    });

    expect(first?.kind).toBe("transitioned");
    expect(replay?.kind).toBe("idempotent");
  });

  it("protects an unanswered initial review", async () => {
    const fixture = await createReviewingFixture();
    await repository.runProofReviewDeadlines(new Date("2027-04-06T11:00:01.000Z"));
    const review = await repository.getProofReviewForParticipant({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    });
    expect(review?.submission.state).toBe("timeout_protected");
    expect(review?.proofCase.resolution).toBe("timeout_protected");
    expect((await repository.listProofReviewNotificationsForUser(
      fixture.participant.userId
    )).some(({ type }) => type === "review_timeout")).toBe(true);
    expect((await repository.listProofReviewNotificationsForUser(
      fixture.creator.userId
    )).some(({ type }) => type === "review_timeout")).toBe(true);
  });

  it("only queues proof stages where the creator can act", async () => {
    const fixture = await createReviewingFixture();
    const room = await repository.ensurePodConversation({
      podId: fixture.podId,
      userId: fixture.creator.userId
    });
    expect((await repository.listPendingReviewsForCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId
    }))?.map(({ submission }) => submission.id)).toContain(fixture.submission.id);

    await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      action: {
        type: "request_clarification",
        reason: "The artifact needs a clearer link to the locked commitment.",
        requestedChange: "Explain where the transaction guard and appeal transition are implemented.",
        reference: "Locked task: ship the proof lifecycle"
      },
      now: new Date("2027-04-05T12:00:00.000Z")
    });
    expect((await repository.listPendingReviewsForCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId
    }))?.map(({ submission }) => submission.id)).not.toContain(fixture.submission.id);
    expect(await repository.findFirstPendingReviewForCreator({
      creatorUserId: fixture.creator.userId
    })).toBeNull();
    expect((await repository.listConversationMessages({
      conversationId: room.id,
      userId: fixture.creator.userId,
      afterSequence: 0,
      limit: 20
    })).messages[0]?.activity?.creatorReviewAvailable).toBe(false);

    await repository.respondToProofClarification({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      response: {
        note: "The linked pull request now identifies the transaction guard and its integration test.",
        artifactUrl: "https://github.com/18Abhinav07/Pods/pull/43"
      },
      now: new Date("2027-04-05T13:00:00.000Z")
    });
    expect((await repository.listPendingReviewsForCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId
    }))?.map(({ submission }) => submission.id)).toContain(fixture.submission.id);
    expect((await repository.findFirstPendingReviewForCreator({
      creatorUserId: fixture.creator.userId
    }))?.id).toBe(fixture.podId);
    expect((await repository.listConversationMessages({
      conversationId: room.id,
      userId: fixture.creator.userId,
      afterSequence: 0,
      limit: 20
    })).messages[0]?.activity?.creatorReviewAvailable).toBe(true);
  });

  it("opens appeal after clarification inactivity and finalizes an unclaimed rejection", async () => {
    const fixture = await createReviewingFixture();
    await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      action: {
        type: "request_clarification",
        reason: "The artifact needs a clearer link to the locked commitment.",
        requestedChange: "Explain where the transaction guard and appeal transition are implemented.",
        reference: "Locked task: ship the proof lifecycle"
      },
      now: new Date("2027-04-05T12:00:00.000Z")
    });
    await repository.runProofReviewDeadlines(new Date("2027-04-06T00:00:01.000Z"));
    let review = await repository.getProofReviewForParticipant({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    });
    expect(review?.submission.state).toBe("reviewing");
    expect(review?.proofCase.stage).toBe("appeal_open");

    await repository.runProofReviewDeadlines(new Date("2027-04-06T12:00:02.000Z"));
    review = await repository.getProofReviewForParticipant({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    });
    expect(review?.submission.state).toBe("rejected");
    expect(review?.proofCase.resolution).toBe("rejected");
  });

  it("grants grace when the creator does not decide an appeal", async () => {
    const fixture = await createReviewingFixture();
    await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      action: {
        type: "provisionally_reject",
        category: "artifact_unverifiable",
        reason: "The artifact cannot be verified against the frozen commitment.",
        unmetCriteria: ["The linked artifact must remain accessible"],
        suggestedCorrection: "Appeal with a stable artifact reference."
      },
      now: new Date("2027-04-05T12:00:00.000Z")
    });
    await repository.appealProofRejection({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      appeal: {
        reason: "The artifact is available at the frozen URL and the relevant files are visible in the diff."
      },
      now: new Date("2027-04-05T13:00:00.000Z")
    });
    await repository.runProofReviewDeadlines(new Date("2027-04-06T01:00:01.000Z"));
    const review = await repository.getProofReviewForParticipant({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    });
    expect(review?.submission.state).toBe("grace");
    expect(review?.proofCase.resolution).toBe("grace");
  });

  it("shares advisory context, accepts rejection, and links a later recovery commitment", async () => {
    const fixture = await createReviewingFixture();
    await repository.reviewProofAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      action: {
        type: "provisionally_reject",
        category: "commitment_mismatch",
        reason: "The artifact does not demonstrate the exact frozen task outcome.",
        unmetCriteria: ["The frozen transaction guard is not shown"],
        suggestedCorrection: "Create a later recovery commitment for the missing guard."
      },
      now: new Date("2027-04-05T12:00:00.000Z")
    });
    await repository.shareProofReviewWithPod({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      now: new Date("2027-04-05T12:05:00.000Z")
    });
    await repository.acceptProofRejection({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      idempotencyKey: randomUUID(),
      now: new Date("2027-04-05T12:10:00.000Z")
    });
    const rejected = await repository.getProofReviewForParticipant({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id
    });
    expect(rejected?.submission.state).toBe("rejected");
    expect(rejected?.proofCase.sharedWithPodAt).toEqual(
      new Date("2027-04-05T12:05:00.000Z")
    );

    const recoveryOccurrenceId = randomUUID();
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query(
        `INSERT INTO occurrences (id, pod_id, ordinal, local_date, opens_at, closes_at, commitment_deadline_at, state)
         VALUES ($1, $2, 2, '2027-04-06', $3, $4, $5, 'commitment_open')`,
        [
          recoveryOccurrenceId,
          fixture.podId,
          new Date("2027-04-06T00:00:00.000Z"),
          new Date("2027-04-06T23:59:59.999Z"),
          new Date("2027-04-06T09:00:00.000Z")
        ]
      );
      await pool.query("UPDATE pods SET state = 'active' WHERE id = $1", [fixture.podId]);
      await pool.query("UPDATE memberships SET state = 'active' WHERE id = $1", [fixture.membershipId]);
    } finally {
      await pool.end();
    }
    const recoveryOccurrence = await repository.findRecoveryOccurrence({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      submissionId: fixture.submission.id,
      now: new Date("2027-04-05T16:00:00.000Z")
    });
    expect(recoveryOccurrence?.id).toBe(recoveryOccurrenceId);
    const commitment = await repository.lockOccurrenceCommitment({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      occurrenceId: recoveryOccurrenceId,
      recoveryOfSubmissionId: fixture.submission.id,
      task: "Ship the missing frozen transaction guard with complete integration proof.",
      deliverableType: "pull_request",
      now: new Date("2027-04-06T08:00:00.000Z")
    });
    expect(commitment.recoveryOfSubmissionId).toBe(fixture.submission.id);
  });

  it("honors a frozen upload reservation for ten minutes after evidence cutoff", async () => {
    const fixture = await createReviewingFixture();
    const occurrenceId = randomUUID();
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query(
        `INSERT INTO occurrences (id, pod_id, ordinal, local_date, opens_at, closes_at, commitment_deadline_at, state)
         VALUES ($1, $2, 2, '2027-04-06', $3, $4, $5, 'commitment_open')`,
        [
          occurrenceId,
          fixture.podId,
          new Date("2027-04-06T00:00:00.000Z"),
          new Date("2027-04-06T21:00:00.000Z"),
          new Date("2027-04-06T09:00:00.000Z")
        ]
      );
      await pool.query("UPDATE pods SET state = 'active' WHERE id = $1", [fixture.podId]);
      await pool.query("UPDATE memberships SET state = 'active' WHERE id = $1", [fixture.membershipId]);
    } finally {
      await pool.end();
    }
    await repository.lockOccurrenceCommitment({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      occurrenceId,
      task: "Ship a frozen late upload reservation with immutable evidence fields.",
      deliverableType: "pull_request",
      now: new Date("2027-04-06T08:00:00.000Z")
    });
    const draft = await repository.saveSubmissionDraft({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      occurrenceId,
      resultSummary: "Implemented and documented the frozen late upload reservation lifecycle.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/84",
      proofShareMode: "reviewer_only",
      now: new Date("2027-04-06T20:50:00.000Z")
    });
    const mediaSha256 = "a".repeat(64);
    const reservation = await repository.reserveEvidenceUpload({
      userId: fixture.participant.userId,
      podId: fixture.podId,
      occurrenceId,
      submissionId: draft.id,
      expectedMediaSha256: mediaSha256,
      now: new Date("2027-04-06T20:59:00.000Z")
    });
    await repository.attachReservedSubmissionEvidence({
      userId: fixture.participant.userId,
      submissionId: draft.id,
      reservationId: reservation.id,
      mediaSha256,
      evidence: {
        objectKey: "private/reserved-proof.webp",
        contentType: "image/webp",
        byteSize: 1_024
      },
      now: new Date("2027-04-06T21:05:00.000Z")
    });
    const submitted = await repository.submitOccurrenceEvidence({
      userId: fixture.participant.userId,
      submissionId: draft.id,
      now: new Date("2027-04-06T21:06:00.000Z")
    });
    expect(submitted.state).toBe("reviewing");
    const verificationPool = new Pool({ connectionString: databaseUrl });
    try {
      const result = await verificationPool.query<{ state: string }>(
        "SELECT state FROM evidence_upload_reservations WHERE id = $1",
        [reservation.id]
      );
      expect(result.rows[0]?.state).toBe("consumed");
      const versions = await verificationPool.query<{ media_sha256: string | null }>(
        "SELECT media_sha256 FROM proof_submission_versions WHERE submission_id = $1",
        [draft.id]
      );
      expect(versions.rows[0]?.media_sha256).toBe(mediaSha256);
    } finally {
      await verificationPool.end();
    }
  });
});
