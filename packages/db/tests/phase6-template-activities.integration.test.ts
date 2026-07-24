import { randomUUID } from "node:crypto";

import type {
  PublishedPodContract,
  TemplateEvidence,
  TemplateId
} from "@pods/domain";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/index";
import { runPodsMigrations } from "../src/migration-runner";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const repository = createPodsRepository(databaseUrl);
const testUserIds = new Set<string>();

const opensAt = new Date("2027-05-03T00:00:00.000Z");
const closesAt = new Date("2027-05-03T23:59:59.999Z");
const commitmentDeadlineAt = new Date("2027-05-03T09:00:00.000Z");
const draftNow = new Date("2027-05-03T10:00:00.000Z");

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

async function createUser(label: string) {
  const session = await repository.createSession({
    walletAddress: `NQPHASE6${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date("2028-01-01T00:00:00.000Z")
  });
  testUserIds.add(session.userId);
  await repository.saveProfile(session.userId, {
    handle: `${label}_${session.userId.slice(0, 8)}`,
    displayName: label,
    bio: "Testing one truthful Pods activity template.",
    avatar: { kind: "preset", preset: "indigo" },
    visibility: "public",
    dmPolicy: "requests",
    activityStatusVisible: true
  });
  return session;
}

function contractFor(templateId: TemplateId): PublishedPodContract {
  const repeating = ["fitness", "reading", "study"].includes(templateId);
  const configByTemplate: Record<TemplateId, Record<string, unknown>> = {
    fitness: {
      activityType: "Strength training",
      measurableMinimum: "Complete a 45 minute session"
    },
    reading: {
      bookOrTheme: "Designing Data-Intensive Applications",
      targetAmount: 20,
      targetType: "pages"
    },
    study: {
      subject: "Distributed systems",
      minimumKind: "minutes",
      minimumMinutes: 60
    },
    build: {
      projectTheme: "Pods",
      allowedDeliverables: ["pull_request"],
      commitmentCutoff: "09:00"
    },
    create: {
      discipline: "Illustration",
      minimumExpectation: "Complete one finished character study",
      commitmentCutoff: "09:00"
    }
  };

  return {
    version: 1,
    templateId,
    evidenceMode: repeating
      ? "repeating_criterion"
      : "per_occurrence_commitment",
    settlementMode: "proportional",
    activity: {
      name: `${templateId} activity`,
      purpose: "Exercise the complete typed template evidence persistence path.",
      startDate: "2027-05-03",
      endDate: "2027-05-03",
      timeZone: "UTC",
      weekdays: [1],
      config: configByTemplate[templateId]
    },
    community: {
      visibility: "public",
      minParticipants: 2,
      maxParticipants: 5,
      applicationQuestions: []
    },
    commitment: {
      lunaPerOccurrence: 10_000,
      occurrenceCount: 1,
      totalLuna: 10_000
    },
    verification: {
      verifier: "creator",
      targetReviewHours: 12,
      timeoutProtectionHours: 24
    }
  };
}

async function createActiveFixture(templateId: TemplateId) {
  const owner = await createUser(`${templateId}_owner`);
  const member = await createUser(`${templateId}_member`);
  const podId = randomUUID();
  const membershipId = randomUUID();
  const occurrenceId = randomUUID();
  const contract = contractFor(templateId);
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(
      `INSERT INTO pods
         (id, creator_user_id, state, template_id, draft_data, contract_data,
          contract_hash, published_at, created_at, updated_at)
       VALUES ($1, $2, 'active', $3, '{}', $4::jsonb, $5, $6, $6, $6)`,
      [
        podId,
        owner.userId,
        templateId,
        JSON.stringify(contract),
        `phase6-${templateId}`,
        new Date("2027-05-01T00:00:00.000Z")
      ]
    );
    await pool.query(
      `INSERT INTO memberships
         (id, pod_id, user_id, admission_source, state, accepted_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'public_application', 'active', $4, $4, $4)`,
      [
        membershipId,
        podId,
        member.userId,
        new Date("2027-05-01T00:00:00.000Z")
      ]
    );
    await pool.query(
      `INSERT INTO occurrences
         (id, pod_id, ordinal, local_date, opens_at, closes_at,
          commitment_deadline_at, state)
       VALUES ($1, $2, 1, '2027-05-03', $3, $4, $5, 'evidence_open')`,
      [
        occurrenceId,
        podId,
        opensAt,
        closesAt,
        templateId === "build" || templateId === "create"
          ? commitmentDeadlineAt
          : null
      ]
    );
  } finally {
    await pool.end();
  }
  return { owner, member, podId, membershipId, occurrenceId, contract };
}

const evidenceByTemplate: Record<TemplateId, TemplateEvidence> = {
  fitness: {
    kind: "fitness",
    activityType: "Strength training",
    completionNote: "Completed all five working sets."
  },
  reading: {
    kind: "reading",
    title: "Designing Data-Intensive Applications",
    amountCompleted: 12,
    unit: "pages",
    note: "Reported honest progress for creator review."
  },
  study: {
    kind: "study",
    topic: "Consensus protocols",
    durationMinutes: 35,
    takeaway: "Mapped the quorum intersection requirement."
  },
  build: {
    kind: "build",
    resultSummary: "Implemented typed evidence for every Pods template.",
    artifactUrl: "https://github.com/nimiq/pods/pull/42"
  },
  create: {
    kind: "create",
    reflection: "Refined the silhouette and final color study.",
    artifactUrl: "https://example.com/art/character-study"
  }
};

describe("Phase 6 template activity persistence", () => {
  it("persists every canonical payload and materializes only repeating criteria", async () => {
    const results = new Map<
      TemplateId,
      {
        commitment: NonNullable<
          Awaited<ReturnType<typeof repository.getActivityOccurrenceForMember>>
        >["commitment"];
        submission: NonNullable<
          Awaited<ReturnType<typeof repository.getActivityOccurrenceForMember>>
        >["submission"];
      }
    >();

    for (const templateId of [
      "fitness",
      "reading",
      "study",
      "build",
      "create"
    ] as const) {
      const fixture = await createActiveFixture(templateId);
      if (templateId === "build") {
        await repository.lockOccurrenceCommitment({
          userId: fixture.member.userId,
          podId: fixture.podId,
          occurrenceId: fixture.occurrenceId,
          task: "Ship the typed template evidence persistence boundary.",
          deliverableType: "pull_request",
          now: new Date("2027-05-03T08:00:00.000Z")
        });
      }
      if (templateId === "create") {
        await repository.lockOccurrenceCommitment({
          userId: fixture.member.userId,
          podId: fixture.podId,
          occurrenceId: fixture.occurrenceId,
          goal: "Complete one finished character color study.",
          now: new Date("2027-05-03T08:00:00.000Z")
        });
      }

      const draft = await repository.saveSubmissionDraft({
        userId: fixture.member.userId,
        podId: fixture.podId,
        occurrenceId: fixture.occurrenceId,
        templateEvidence: evidenceByTemplate[templateId],
        evidence: {
          objectKey: `private/${fixture.podId}/${randomUUID()}.webp`,
          contentType: "image/webp",
          byteSize: 2048
        },
        proofShareMode: "reviewer_only",
        now: draftNow
      });
      await repository.submitOccurrenceEvidence({
        userId: fixture.member.userId,
        submissionId: draft.id,
        now: new Date("2027-05-03T11:00:00.000Z")
      });
      const detail = await repository.getActivityOccurrenceForMember({
        userId: fixture.member.userId,
        podId: fixture.podId,
        occurrenceId: fixture.occurrenceId
      });
      if (!detail) throw new Error("Template activity detail was not persisted");
      results.set(templateId, {
        commitment: detail.commitment,
        submission: detail.submission
      });
    }

    expect(results.get("fitness")?.commitment?.kind).toBe("repeating_criterion");
    expect(results.get("reading")?.submission?.templateEvidence).toMatchObject({
      kind: "reading",
      amountCompleted: 12
    });
    expect(results.get("study")?.submission?.templateEvidence).toMatchObject({
      kind: "study",
      durationMinutes: 35
    });
    expect(results.get("build")?.submission?.templateEvidence).toMatchObject({
      kind: "build"
    });
    expect(results.get("create")?.commitment).toMatchObject({
      kind: "create",
      deliverableType: null
    });
  });

  it("keeps legacy Build rows valid without synthesizing canonical JSON", async () => {
    const fixture = await createActiveFixture("build");
    const commitmentId = randomUUID();
    const submissionId = randomUUID();
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query(
        `INSERT INTO occurrence_commitments
           (id, occurrence_id, membership_id, kind, task, deliverable_type, details, locked_at)
         VALUES ($1, $2, $3, 'build', $4, 'pull_request', NULL, $5)`,
        [
          commitmentId,
          fixture.occurrenceId,
          fixture.membershipId,
          "Ship a legacy-compatible Build submission.",
          new Date("2027-05-03T08:00:00.000Z")
        ]
      );
      await pool.query(
        `INSERT INTO submissions
           (id, occurrence_id, membership_id, commitment_id, state,
            result_summary, artifact_url, template_evidence, proof_share_mode,
            submitted_at, review_target_at, review_hard_deadline_at,
            created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'reviewing', $5, $6, NULL, 'reviewer_only',
                 $7, $8, $9, $7, $7)`,
        [
          submissionId,
          fixture.occurrenceId,
          fixture.membershipId,
          commitmentId,
          "Legacy Build result remains readable without a payload rewrite.",
          "https://github.com/nimiq/pods/pull/7",
          new Date("2027-05-03T11:00:00.000Z"),
          new Date("2027-05-03T23:00:00.000Z"),
          new Date("2027-05-04T11:00:00.000Z")
        ]
      );
    } finally {
      await pool.end();
    }

    const owner = await repository.getSubmissionForOwner({
      userId: fixture.member.userId,
      submissionId
    });
    expect(owner?.submission).toMatchObject({
      templateEvidence: null,
      resultSummary:
        "Legacy Build result remains readable without a payload rewrite.",
      artifactUrl: "https://github.com/nimiq/pods/pull/7"
    });
  });
});
