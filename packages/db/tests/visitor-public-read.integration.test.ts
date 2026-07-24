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

async function createUser(label: string, visibility: "public" | "private" = "public") {
  const session = await repository.createSession({
    walletAddress: `NQTEST${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date("2028-01-01T00:00:00.000Z")
  });
  testUserIds.add(session.userId);
  const handleLabel = label.toLowerCase().replaceAll(" ", "_");
  await repository.saveProfile(session.userId, {
    handle: `${handleLabel}_${session.userId.slice(0, 7)}`,
    displayName: label,
    bio: `${label} builds in public with Pods.`,
    avatar: { kind: "preset", preset: label === "Creator" ? "moss" : "coral" },
    visibility,
    dmPolicy: "requests",
    activityStatusVisible: true
  });
  return session;
}

async function publishVisitorPod(creatorUserId: string) {
  const draft = await repository.createDraft(creatorUserId, "build");
  const input = {
    templateId: "build" as const,
    activity: {
      name: `Visitor build ${randomUUID()}`,
      purpose: "A public build room with a locked roster and a safe visitor proof layer.",
      startDate: "2027-04-05",
      endDate: "2027-04-05",
      timeZone: "UTC",
      weekdays: [1],
      config: {
        projectTheme: "Pods",
        allowedDeliverables: ["pull_request"],
        commitmentCutoff: "09:00"
      }
    },
    community: {
      visibility: "public" as const,
      minParticipants: 2,
      maxParticipants: 5,
      applicationQuestions: ["What will you ship?"],
      roomAudience: "public_read_only" as const
    },
    commitment: { nimPerOccurrence: "0.1" }
  };
  await repository.saveActivityStep(creatorUserId, draft.id, input.activity);
  await repository.saveCommunityStep(creatorUserId, draft.id, input.community);
  await repository.saveCommitmentStep(creatorUserId, draft.id, input.commitment);
  const frozen = buildPublishedContract(input);
  if (!frozen.success) throw new Error(frozen.errors.join(", "));
  const pod = await repository.publishDraft({
    creatorUserId,
    podId: draft.id,
    contract: frozen.contract,
    occurrences: frozen.occurrences,
    creatorConsentAccepted: true
  });
  return { pod, occurrence: frozen.occurrences[0]! };
}

async function activateVisitorPod(
  proofShareMode: "reviewer_only" | "pod_shared" | "public" = "public"
) {
  const creator = await createUser("Creator");
  const member = await createUser("Private builder", "private");
  const { pod } = await publishVisitorPod(creator.userId);
  const now = new Date("2026-08-01T00:00:00.000Z");
  const application = await repository.applyToPublicPod({
    podId: pod.id,
    applicantUserId: member.userId,
    answers: [{ question: "What will you ship?", answer: "A visitor-safe room" }],
    acceptedContractHash: pod.contractHash!,
    visitorDisclosureAccepted: true,
    now
  });
  await repository.decideApplication({
    creatorUserId: creator.userId,
    podId: pod.id,
    applicationId: application.id,
    decision: "accept",
    now
  });
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(
      "UPDATE pods SET state = 'active', updated_at = $2 WHERE id = $1",
      [pod.id, new Date("2027-04-05T08:00:00.000Z")]
    );
    await pool.query(
      "UPDATE memberships SET state = 'active', updated_at = $2 WHERE pod_id = $1",
      [pod.id, new Date("2027-04-05T08:00:00.000Z")]
    );
  } finally {
    await pool.end();
  }
  const schedule = await repository.listActivityScheduleForMember({
    userId: member.userId,
    podId: pod.id
  });
  const occurrenceId = schedule?.[0]?.occurrence.id;
  if (!occurrenceId) throw new Error("Fixture occurrence missing");
  const commitment = await repository.lockOccurrenceCommitment({
    userId: member.userId,
    podId: pod.id,
    occurrenceId,
    task: "Ship the public visitor DTO with strict field allowlisting.",
    deliverableType: "pull_request",
    now: new Date("2027-04-05T08:05:00.000Z")
  });
  const conversation = await repository.ensurePodConversation({
    podId: pod.id,
    userId: member.userId
  });
  await repository.postConversationMessage({
    conversationId: conversation.id,
    userId: member.userId,
    clientMessageId: randomUUID(),
    body: "The safe visitor projection is ready for review.",
    replyToMessageId: null,
    kind: "member_message",
    now: new Date("2027-04-05T08:10:00.000Z")
  });
  const draft = await repository.saveSubmissionDraft({
    userId: member.userId,
    podId: pod.id,
    occurrenceId,
    resultSummary: "Implemented a separate public read model with explicit privacy boundaries.",
    artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
    evidence: {
      objectKey: `private/${pod.id}/${randomUUID()}.webp`,
      contentType: "image/webp",
      byteSize: 2048
    },
    proofShareMode,
    now: new Date("2027-04-05T10:00:00.000Z")
  });
  await repository.submitOccurrenceEvidence({
    userId: member.userId,
    submissionId: draft.id,
    now: new Date("2027-04-05T10:05:00.000Z")
  });
  return { creator, member, pod, commitment, submissionId: draft.id, conversation };
}

describe("public visitor read model", () => {
  it.each(["reviewer_only", "pod_shared"] as const)(
    "suppresses every evidence-derived field when proof sharing is %s",
    async (proofShareMode) => {
      const fixture = await activateVisitorPod(proofShareMode);
      const result = await repository.getPublicVisitorRoom({
        podId: fixture.pod.id,
        afterSequence: 0,
        limit: 20
      });
      const activity = result?.messages.find(
        (message) => message.kind === "activity"
      )?.activity;

      expect(activity).toMatchObject({
        submissionId: fixture.submissionId,
        templateId: "build",
        templateEvidence: null,
        resultSummary: null,
        artifactUrl: null,
        supportingImageAvailable: false
      });
      expect(await repository.getPublicSubmissionEvidence({
        podId: fixture.pod.id,
        submissionId: fixture.submissionId
      })).toBeNull();
      expect(JSON.stringify(result)).not.toContain(
        "Implemented a separate public read model"
      );
      expect(JSON.stringify(result)).not.toContain(
        "https://github.com/18Abhinav07/Pods/pull/42"
      );
    }
  );

  it("opens only an eligible post-lock version two Pod and returns a strict DTO", async () => {
    const fixture = await activateVisitorPod();
    const result = await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: 0,
      limit: 20
    });

    expect(result).toMatchObject({
      pod: {
        id: fixture.pod.id,
        stage: "live",
        roomState: "open"
      },
      messages: expect.arrayContaining([
        expect.objectContaining({
          kind: "member_message",
          body: "The safe visitor projection is ready for review."
        }),
        expect.objectContaining({
          kind: "activity",
          activity: expect.objectContaining({
            state: "under_review",
            supportingImageAvailable: true
          })
        })
      ])
    });
    expect(JSON.stringify(result)).not.toContain(fixture.member.walletAddress);
    expect(JSON.stringify(result)).not.toContain(fixture.member.userId);
    expect(JSON.stringify(result)).not.toContain(fixture.conversation.id);
    expect(JSON.stringify(result)).not.toContain("private/");
    expect(result?.messages.find((message) => message.kind === "activity")?.sender)
      .toMatchObject({ profileVisibility: "private" });
  });

  it("authorizes only public supporting evidence without exposing its object key", async () => {
    const fixture = await activateVisitorPod();
    const evidence = await repository.getPublicSubmissionEvidence({
      podId: fixture.pod.id,
      submissionId: fixture.submissionId
    });

    expect(evidence).toMatchObject({
      contentType: "image/webp",
      byteSize: 2048
    });
    expect(evidence?.objectKey).toContain(`private/${fixture.pod.id}/`);
  });

  it("projects a private profile only as scoped public-Pod identity", async () => {
    const fixture = await activateVisitorPod();
    const profile = await repository.getPublicPodContributor({
      podId: fixture.pod.id,
      handle: `private_builder_${fixture.member.userId.slice(0, 7)}`
    });

    expect(profile).toMatchObject({
      handle: `private_builder_${fixture.member.userId.slice(0, 7)}`,
      displayName: "Private builder",
      profileVisibility: "private",
      role: "member",
      commitmentCount: 1,
      submittedProofCount: 1
    });
    expect(profile).not.toHaveProperty("bio");
    expect(JSON.stringify(profile)).not.toContain(fixture.member.userId);
    expect(JSON.stringify(profile)).not.toContain(fixture.member.walletAddress);
  });

  it("keeps enrollment open Pods on preview and excludes their room", async () => {
    const creator = await createUser("Waiting creator");
    const { pod } = await publishVisitorPod(creator.userId);

    expect(await repository.getPublicVisitorRoom({
      podId: pod.id,
      afterSequence: 0,
      limit: 20
    })).toBeNull();
    expect(await repository.getPublicPodSurface(pod.id, new Date("2026-08-01T00:00:00.000Z")))
      .toMatchObject({ stage: "open" });
  });

  it("moves the public room through final review into a permanent archive", async () => {
    const fixture = await activateVisitorPod();

    await repository.runOccurrenceTransitions(
      new Date("2027-04-06T00:01:00.000Z")
    );
    expect(await repository.getPodForOwner(fixture.creator.userId, fixture.pod.id))
      .toMatchObject({ state: "final_review" });
    expect(await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: 0,
      limit: 20
    })).toMatchObject({ pod: { stage: "live", roomState: "archived" } });
    const beforeDecision = await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: 0,
      limit: 20
    });
    if (!beforeDecision) throw new Error("Public room missing");

    await repository.decideSubmissionAsCreator({
      creatorUserId: fixture.creator.userId,
      podId: fixture.pod.id,
      submissionId: fixture.submissionId,
      decision: {
        decision: "approve",
        note: "The public artifact satisfies the frozen build commitment."
      },
      now: new Date("2027-04-06T00:05:00.000Z")
    });
    const afterDecision = await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: beforeDecision.lastSequence,
      changeCursor: beforeDecision.changeCursor,
      limit: 20
    });
    expect(afterDecision?.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "activity",
        activity: expect.objectContaining({ state: "approved" })
      })
    ]));
    await repository.runOccurrenceTransitions(
      new Date("2027-04-06T00:06:00.000Z")
    );

    expect(await repository.getPodForOwner(fixture.creator.userId, fixture.pod.id))
      .toMatchObject({ state: "completed", completedAt: expect.any(Date) });
    expect(await repository.listConversationsForUser(fixture.creator.userId))
      .toMatchObject({
        rooms: expect.arrayContaining([
          expect.objectContaining({ podId: fixture.pod.id })
        ])
      });
    expect(await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: 0,
      limit: 20
    })).toMatchObject({ pod: { stage: "recent", roomState: "archived" } });
    await expect(repository.setPodRoomState({
      conversationId: fixture.conversation.id,
      creatorUserId: fixture.creator.userId,
      roomState: "open",
      now: new Date("2027-04-06T00:07:00.000Z")
    })).rejects.toThrow("Completed Pod rooms are permanent archives");

    const memberRoom = await repository.listConversationMessages({
      conversationId: fixture.conversation.id,
      userId: fixture.member.userId,
      afterSequence: 0,
      limit: 20
    });
    const message = memberRoom.messages.find((item) => item.kind === "member_message");
    if (!message) throw new Error("Fixture message missing");
    await expect(repository.setMessageReaction({
      messageId: message.id,
      userId: fixture.member.userId,
      reaction: "support",
      now: new Date("2027-04-06T00:08:00.000Z")
    })).rejects.toThrow("This room is archived and read only");
  });

  it("maps rejection and timeout protection distinctly without exposing private review data", async () => {
    const rejectedFixture = await activateVisitorPod();
    const privateReason =
      "The public artifact does not satisfy the participant's locked commitment.";
    await repository.decideSubmissionAsCreator({
      creatorUserId: rejectedFixture.creator.userId,
      podId: rejectedFixture.pod.id,
      submissionId: rejectedFixture.submissionId,
      decision: { decision: "reject", reason: privateReason },
      now: new Date("2027-04-05T11:00:00.000Z")
    });
    const rejectedRoom = await repository.getPublicVisitorRoom({
      podId: rejectedFixture.pod.id,
      afterSequence: 0,
      limit: 20
    });
    expect(rejectedRoom?.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "activity",
        activity: expect.objectContaining({ state: "rejected" })
      })
    ]));
    const rejectedJson = JSON.stringify(rejectedRoom);
    expect(rejectedJson).not.toContain(privateReason);
    expect(rejectedJson).not.toContain(rejectedFixture.creator.userId);
    expect(rejectedJson).not.toContain("private/");

    const protectedFixture = await activateVisitorPod();
    await repository.protectTimedOutReviews(
      new Date("2027-04-06T10:05:00.000Z")
    );
    const protectedRoom = await repository.getPublicVisitorRoom({
      podId: protectedFixture.pod.id,
      afterSequence: 0,
      limit: 20
    });
    expect(protectedRoom?.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "activity",
        activity: expect.objectContaining({ state: "timeout_protected" })
      })
    ]));
    const protectedJson = JSON.stringify(protectedRoom);
    expect(protectedJson).not.toContain(protectedFixture.creator.userId);
    expect(protectedJson).not.toContain("private/");
  });

  it("keeps public moderation separate from authoritative room and proof records", async () => {
    const fixture = await activateVisitorPod();
    const publicRoom = await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: 0,
      limit: 20
    });
    const publicMessage = publicRoom?.messages.find((message) => message.kind === "member_message");
    if (!publicMessage) throw new Error("Fixture public message missing");

    const report = await repository.reportPublicContent({
      reporterUserId: fixture.creator.userId,
      podId: fixture.pod.id,
      targetKind: "message",
      targetId: publicMessage.id,
      reason: "unsafe_content",
      details: "This message needs a public safety review.",
      now: new Date("2027-04-05T11:00:00.000Z")
    });
    expect(report).toMatchObject({ state: "pending", targetKind: "message" });
    expect(await repository.listPublicSafetyReports({ state: "pending" }))
      .toEqual(expect.arrayContaining([expect.objectContaining({ id: report.id })]));

    await repository.moderatePublicReport({
      reportId: report.id,
      action: "suppress_content",
      actor: "pods-team-reviewer",
      reason: "Temporarily hidden while the report is assessed.",
      now: new Date("2027-04-05T11:05:00.000Z")
    });
    const suppressed = await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: 0,
      limit: 20
    });
    expect(suppressed?.messages.find((message) => message.id === publicMessage.id))
      .toMatchObject({ hidden: true, body: null });

    const memberRoom = await repository.listConversationMessages({
      conversationId: fixture.conversation.id,
      userId: fixture.member.userId,
      afterSequence: 0,
      limit: 20
    });
    expect(memberRoom.messages.find((message) => message.id === publicMessage.id)?.body)
      .toBe("The safe visitor projection is ready for review.");

    await repository.moderatePublicReport({
      reportId: report.id,
      action: "restore_content",
      actor: "pods-team-reviewer",
      reason: "The content is safe for the public room.",
      now: new Date("2027-04-05T11:10:00.000Z")
    });
    expect((await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: 0,
      limit: 20
    }))?.messages.find((message) => message.id === publicMessage.id)?.hidden).toBe(false);

    await repository.moderatePublicReport({
      reportId: report.id,
      action: "suspend_room",
      actor: "pods-team-reviewer",
      reason: "The public room requires a wider safety review.",
      now: new Date("2027-04-05T11:15:00.000Z")
    });
    expect(await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: 0,
      limit: 20
    })).toBeNull();
    expect(await repository.getPodForOwner(fixture.creator.userId, fixture.pod.id))
      .toMatchObject({ state: "active", publicRoomSuspendedAt: expect.any(Date) });

    await repository.moderatePublicReport({
      reportId: report.id,
      action: "restore_room",
      actor: "pods-team-reviewer",
      reason: "The public room safety review is complete.",
      now: new Date("2027-04-05T11:20:00.000Z")
    });
    expect(await repository.getPublicVisitorRoom({
      podId: fixture.pod.id,
      afterSequence: 0,
      limit: 20
    })).not.toBeNull();
    expect(await repository.listPublicModerationActions({ podId: fixture.pod.id }))
      .toHaveLength(4);
  });

  it("uses atomic durable buckets for public request limits", async () => {
    const input = {
      bucketKey: `opaque-hmac-key-${randomUUID()}`,
      action: "public_room_poll",
      now: new Date("2027-04-05T12:00:00.000Z"),
      windowMs: 60_000,
      limit: 2
    };
    expect(await repository.consumePublicRateLimit(input)).toMatchObject({
      allowed: true,
      remaining: 1
    });
    expect(await repository.consumePublicRateLimit(input)).toMatchObject({
      allowed: true,
      remaining: 0
    });
    expect(await repository.consumePublicRateLimit(input)).toMatchObject({
      allowed: false,
      remaining: 0
    });
    expect(await repository.consumePublicRateLimit({
      ...input,
      now: new Date("2027-04-05T12:01:00.000Z")
    })).toMatchObject({ allowed: true, remaining: 1 });
  });
});
