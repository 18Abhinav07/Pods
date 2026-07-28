import { createHash, randomUUID } from "node:crypto";

import {
  nextProofCaseState,
  proofCaseDeadlines,
  validateAppealInput,
  validateClarificationRequest,
  validateClarificationResponse,
  validateProvisionalRejection,
  type ProofCaseActor,
  type ProofCaseEventType,
  type ProofCaseResolution,
  type ProofCaseState
} from "@pods/domain";
import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import { resolveVerifierAuthority } from "./verifier-override-repository";
import {
  activityMessages,
  memberships,
  messages,
  notifications,
  occurrenceCommitments,
  occurrences,
  pods,
  proofCases,
  proofReviewEvents,
  proofSubmissionVersions,
  realtimeEvents,
  reviewDecisions,
  submissions
} from "./schema";

type CreatorProofAction =
  | { type: "approve"; note?: unknown }
  | ({ type: "request_clarification" } & Record<string, unknown>)
  | ({ type: "provisionally_reject" } & Record<string, unknown>)
  | { type: "appeal_approve"; note?: unknown }
  | { type: "appeal_reject"; reason?: unknown }
  | { type: "appeal_grace"; note?: unknown };

type ReviewEvidenceObject = {
  objectKey: string;
  contentType: string;
  byteSize: number;
};

type LockedProofContext = {
  submission: typeof submissions.$inferSelect;
  proofCase: typeof proofCases.$inferSelect;
  participantUserId: string;
  creatorUserId: string;
  pod: typeof pods.$inferSelect;
};

function proofState(proofCase: typeof proofCases.$inferSelect): ProofCaseState {
  return {
    stage: proofCase.stage,
    clarificationUsed: proofCase.clarificationUsed,
    appealUsed: proofCase.appealUsed,
    resolution: proofCase.resolution
  };
}

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function validSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function validateReplacementEvidence(
  evidence: ReviewEvidenceObject | null | undefined,
  mediaSha256: string | null | undefined
) {
  if (evidence && !validSha256(mediaSha256)) {
    throw new Error("Replacement evidence media hash is invalid");
  }
  if (!evidence && mediaSha256) {
    throw new Error("Replacement evidence is missing");
  }
}

function boundedText(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number
) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new Error(`${field} must contain ${minimum} to ${maximum} characters`);
  }
  return normalized;
}

function stageHours(stage: ProofCaseState["stage"]) {
  if (stage === "resolved") return 0;
  if (stage === "initial_review") return 24;
  return 12;
}

function roomEventKind(resolution: ProofCaseResolution) {
  if (resolution === "approved") return "submission.approved";
  if (resolution === "rejected") return "submission.rejected";
  if (resolution === "timeout_protected") return "submission.timeout_protected";
  return "submission.grace";
}

async function lockedContext(
  database: PodsDatabase,
  input: { podId?: string; submissionId: string }
): Promise<LockedProofContext | null> {
  const [context] = await database
    .select({
      submission: submissions,
      proofCase: proofCases,
      participantUserId: memberships.userId,
      creatorUserId: pods.creatorUserId,
      pod: pods
    })
    .from(submissions)
    .innerJoin(proofCases, eq(proofCases.submissionId, submissions.id))
    .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
    .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
    .innerJoin(pods, eq(occurrences.podId, pods.id))
    .where(
      input.podId
        ? and(eq(pods.id, input.podId), eq(submissions.id, input.submissionId))
        : eq(submissions.id, input.submissionId)
    )
    .for("update");
  return context ?? null;
}

async function appendPrivateDelivery(
  database: PodsDatabase,
  context: LockedProofContext,
  input: {
    recipientUserId: string;
    recipientRole: "participant" | "creator";
    type: ProofCaseEventType;
    now: Date;
  }
) {
  const payload = {
    podId: context.pod.id,
    submissionId: context.submission.id,
    proofCaseId: context.proofCase.id,
    type: input.type,
    recipientRole: input.recipientRole
  };
  await database.insert(notifications).values({
    id: randomUUID(),
    userId: input.recipientUserId,
    kind: `proof_review.${input.type}`,
    payload,
    readAt: null,
    createdAt: input.now
  });
  await database.insert(realtimeEvents).values({
    conversationId: null,
    recipientUserId: input.recipientUserId,
    kind: `proof_review.${input.type}`,
    payload,
    createdAt: input.now
  });
}

async function appendTerminalRoomProjection(
  database: PodsDatabase,
  context: LockedProofContext,
  resolution: ProofCaseResolution,
  now: Date
) {
  const [projection] = await database
    .select({
      messageId: activityMessages.messageId,
      conversationId: messages.conversationId
    })
    .from(activityMessages)
    .innerJoin(messages, eq(activityMessages.messageId, messages.id))
    .where(eq(activityMessages.commitmentId, context.submission.commitmentId));
  if (!projection) return;
  await database.insert(realtimeEvents).values({
    conversationId: projection.conversationId,
    recipientUserId: null,
    kind: roomEventKind(resolution),
    payload: {
      messageId: projection.messageId,
      submissionId: context.submission.id
    },
    createdAt: now
  });
}

async function applyProofTransition(
  database: PodsDatabase,
  context: LockedProofContext,
  input: {
    eventType: ProofCaseEventType;
    actor: ProofCaseActor;
    actorUserId: string | null;
    idempotencyKey: string;
    payload: Record<string, unknown>;
    now: Date;
  }
) {
  const [existingEvent] = await database
    .select()
    .from(proofReviewEvents)
    .where(eq(proofReviewEvents.idempotencyKey, input.idempotencyKey));
  if (existingEvent) {
    if (existingEvent.caseId !== context.proofCase.id) {
      throw new Error("Idempotency key belongs to another proof review");
    }
    return { kind: "idempotent" as const, event: existingEvent };
  }
  if (
    input.actor !== "system" &&
    (context.proofCase.stageDeadlineAt.getTime() <= input.now.getTime() ||
      context.proofCase.absoluteDeadlineAt.getTime() <= input.now.getTime())
  ) {
    throw new Error("This proof review window has closed. Refresh for the protected outcome.");
  }

  const next = nextProofCaseState(proofState(context.proofCase), {
    type: input.eventType,
    actor: input.actor
  });
  if (!next) throw new Error("Proof review action is not available in this state");

  const nextVersion = context.proofCase.version + 1;
  const absoluteDeadlineAt = context.proofCase.absoluteDeadlineAt;
  const derivedDeadline = proofCaseDeadlines(
    context.proofCase.createdAt,
    input.now,
    stageHours(next.stage)
  ).stageDeadlineAt;
  const stageDeadlineAt = next.stage === "resolved"
    ? input.now
    : new Date(Math.min(derivedDeadline.getTime(), absoluteDeadlineAt.getTime()));

  const [updatedCase] = await database
    .update(proofCases)
    .set({
      stage: next.stage,
      clarificationUsed: next.clarificationUsed,
      appealUsed: next.appealUsed,
      resolution: next.resolution,
      stageEnteredAt: input.now,
      stageDeadlineAt,
      version: nextVersion,
      resolvedAt: next.stage === "resolved" ? input.now : null,
      updatedAt: input.now
    })
    .where(
      and(
        eq(proofCases.id, context.proofCase.id),
        eq(proofCases.version, context.proofCase.version)
      )
    )
    .returning();
  if (!updatedCase) throw new Error("Proof review changed before this action completed");

  const [event] = await database
    .insert(proofReviewEvents)
    .values({
      caseId: context.proofCase.id,
      sequence: nextVersion,
      type: input.eventType,
      actor: input.actor,
      actorUserId: input.actorUserId,
      payload: structuredClone(input.payload),
      idempotencyKey: input.idempotencyKey,
      createdAt: input.now
    })
    .returning();
  if (!event) throw new Error("Proof review event could not be recorded");

  if (next.resolution) {
    const [updatedSubmission] = await database
      .update(submissions)
      .set({
        state: next.resolution,
        reviewedAt: input.now,
        approvedAt: next.resolution === "approved" ? input.now : null,
        updatedAt: input.now
      })
      .where(
        and(
          eq(submissions.id, context.submission.id),
          eq(submissions.state, "reviewing")
        )
      )
      .returning();
    if (!updatedSubmission) {
      throw new Error("Terminal proof outcome could not be projected");
    }

    if (
      input.actor === "creator" ||
      next.resolution === "rejected"
    ) {
      await database
        .insert(reviewDecisions)
        .values({
          id: randomUUID(),
          submissionId: context.submission.id,
          action: next.resolution === "timeout_protected"
            ? "grace"
            : next.resolution,
          reviewerId: context.creatorUserId,
          reasonCode:
            next.resolution === "approved"
              ? "meets_commitment"
              : next.resolution === "grace"
                ? "appeal_grace"
                : "does_not_meet_commitment",
          note: String(
            input.payload.note ??
            input.payload.reason ??
            (next.resolution === "grace" ? "Appeal resolved with grace." : "")
          ),
          createdAt: input.now
        })
        .onConflictDoNothing({ target: reviewDecisions.submissionId });
    }
    await appendTerminalRoomProjection(database, context, next.resolution, input.now);
  }

  const recipients = input.actor === "participant"
    ? [{ userId: context.creatorUserId, role: "creator" as const }]
    : input.actor === "creator"
      ? [{ userId: context.participantUserId, role: "participant" as const }]
      : [
          { userId: context.participantUserId, role: "participant" as const },
          { userId: context.creatorUserId, role: "creator" as const }
        ];
  for (const recipient of recipients) {
    await appendPrivateDelivery(database, context, {
      recipientUserId: recipient.userId,
      recipientRole: recipient.role,
      type: input.eventType,
      now: input.now
    });
  }
  return { kind: "transitioned" as const, event, proofCase: updatedCase };
}

async function loadProofReview(
  database: PodsDatabase,
  input: { podId: string; submissionId: string }
) {
  const [base] = await database
    .select({
      submission: submissions,
      proofCase: proofCases,
      participantUserId: memberships.userId,
      creatorUserId: pods.creatorUserId,
      pod: pods,
      commitment: occurrenceCommitments,
      occurrence: occurrences
    })
    .from(submissions)
    .innerJoin(proofCases, eq(proofCases.submissionId, submissions.id))
    .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
    .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
    .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
    .innerJoin(pods, eq(occurrences.podId, pods.id))
    .where(
      and(
        eq(pods.id, input.podId),
        eq(submissions.id, input.submissionId)
      )
    );
  if (!base) return null;
  const events = await database
    .select()
    .from(proofReviewEvents)
    .where(eq(proofReviewEvents.caseId, base.proofCase.id))
    .orderBy(asc(proofReviewEvents.sequence));
  const versions = await database
    .select()
    .from(proofSubmissionVersions)
    .where(eq(proofSubmissionVersions.caseId, base.proofCase.id))
    .orderBy(asc(proofSubmissionVersions.ordinal));
  return { ...base, events, versions };
}

function normalizeCreatorAction(action: CreatorProofAction) {
  if (action.type === "request_clarification") {
    const validation = validateClarificationRequest(action);
    if (!validation.success) throw new Error(validation.errors[0]);
    return { eventType: action.type, payload: validation.value } as const;
  }
  if (action.type === "provisionally_reject") {
    const validation = validateProvisionalRejection(action);
    if (!validation.success) throw new Error(validation.errors[0]);
    return { eventType: action.type, payload: validation.value } as const;
  }
  if (action.type === "approve" || action.type === "appeal_approve") {
    const note = typeof action.note === "string" ? action.note.trim() : "";
    if (note.length > 500) throw new Error("Keep the approval note within 500 characters");
    return { eventType: action.type, payload: { note } } as const;
  }
  if (action.type === "appeal_reject") {
    return {
      eventType: action.type,
      payload: {
        reason: boundedText(action.reason, "Appeal rejection reason", 20, 1_200)
      }
    } as const;
  }
  const note = boundedText(action.note, "Grace explanation", 20, 1_200);
  return { eventType: action.type, payload: { note } } as const;
}

export function createProofReviewMethods(database: PodsDatabase) {
  return {
    async getProofReviewForParticipant(input: {
      userId: string;
      podId: string;
      submissionId: string;
    }) {
      const review = await loadProofReview(database, input);
      return review?.participantUserId === input.userId ? review : null;
    },

    async getProofReviewForCreator(input: {
      creatorUserId: string;
      podId: string;
      submissionId: string;
    }) {
      const review = await loadProofReview(database, input);
      return review?.creatorUserId === input.creatorUserId ? review : null;
    },

    async reviewProofAsCreator(input: {
      creatorUserId: string;
      podId: string;
      submissionId: string;
      idempotencyKey: string;
      action: CreatorProofAction;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const authority = await resolveVerifierAuthority(
          transaction as unknown as PodsDatabase,
          input.podId
        );
        if (
          authority?.creatorUserId !== input.creatorUserId ||
          authority.effectiveVerifier !== "creator"
        ) {
          return null;
        }
        const context = await lockedContext(
          transaction as unknown as PodsDatabase,
          input
        );
        if (
          !context ||
          context.creatorUserId !== input.creatorUserId ||
          context.pod.contractData?.version !== 3
        ) {
          return null;
        }
        const normalized = normalizeCreatorAction(input.action);
        return applyProofTransition(
          transaction as unknown as PodsDatabase,
          context,
          {
            eventType: normalized.eventType,
            actor: "creator",
            actorUserId: input.creatorUserId,
            idempotencyKey: input.idempotencyKey,
            payload: { ...normalized.payload },
            now: input.now
          }
        );
      });
    },

    async respondToProofClarification(input: {
      userId: string;
      podId: string;
      submissionId: string;
      idempotencyKey: string;
      response: unknown;
      evidence?: ReviewEvidenceObject | null;
      mediaSha256?: string | null;
      now: Date;
    }) {
      const validation = validateClarificationResponse(input.response);
      if (!validation.success) throw new Error(validation.errors[0]);
      validateReplacementEvidence(input.evidence, input.mediaSha256);
      return database.transaction(async (transaction) => {
        const context = await lockedContext(
          transaction as unknown as PodsDatabase,
          input
        );
        if (!context || context.participantUserId !== input.userId) return null;
        const [existingEvent] = await transaction
          .select()
          .from(proofReviewEvents)
          .where(eq(proofReviewEvents.idempotencyKey, input.idempotencyKey));
        if (existingEvent) {
          if (existingEvent.caseId !== context.proofCase.id) {
            throw new Error("Idempotency key belongs to another proof review");
          }
          return { kind: "idempotent" as const, event: existingEvent };
        }
        const [lastVersion] = await transaction
          .select()
          .from(proofSubmissionVersions)
          .where(eq(proofSubmissionVersions.caseId, context.proofCase.id))
          .orderBy(desc(proofSubmissionVersions.ordinal))
          .limit(1);
        const ordinal = (lastVersion?.ordinal ?? 0) + 1;
        const artifactUrl = validation.value.artifactUrl ?? context.submission.artifactUrl;
        const replacementEvidence = input.evidence ?? null;
        await transaction.insert(proofSubmissionVersions).values({
          id: randomUUID(),
          caseId: context.proofCase.id,
          submissionId: context.submission.id,
          ordinal,
          kind: "clarification",
          resultSummary: context.submission.resultSummary,
          artifactUrl,
          templateEvidence: context.submission.templateEvidence,
          evidenceObjectKey:
            replacementEvidence?.objectKey ?? context.submission.evidenceObjectKey,
          evidenceContentType:
            replacementEvidence?.contentType ?? context.submission.evidenceContentType,
          evidenceByteSize:
            replacementEvidence?.byteSize ?? context.submission.evidenceByteSize,
          proofShareMode: context.submission.proofShareMode,
          evidenceDigest: digest({
            prior: lastVersion?.evidenceDigest ?? null,
            note: validation.value.note,
            artifactUrl,
            replacementMediaSha256: input.mediaSha256 ?? null
          }),
          mediaSha256: input.mediaSha256 ?? lastVersion?.mediaSha256 ?? null,
          createdByUserId: input.userId,
          createdAt: input.now
        });
        return applyProofTransition(
          transaction as unknown as PodsDatabase,
          context,
          {
            eventType: "respond_clarification",
            actor: "participant",
            actorUserId: input.userId,
            idempotencyKey: input.idempotencyKey,
            payload: { ...validation.value },
            now: input.now
          }
        );
      });
    },

    async appealProofRejection(input: {
      userId: string;
      podId: string;
      submissionId: string;
      idempotencyKey: string;
      appeal: unknown;
      evidence?: ReviewEvidenceObject | null;
      mediaSha256?: string | null;
      now: Date;
    }) {
      const validation = validateAppealInput(input.appeal);
      if (!validation.success) throw new Error(validation.errors[0]);
      validateReplacementEvidence(input.evidence, input.mediaSha256);
      return database.transaction(async (transaction) => {
        const context = await lockedContext(
          transaction as unknown as PodsDatabase,
          input
        );
        if (!context || context.participantUserId !== input.userId) return null;
        const [existingEvent] = await transaction
          .select()
          .from(proofReviewEvents)
          .where(eq(proofReviewEvents.idempotencyKey, input.idempotencyKey));
        if (existingEvent) {
          if (existingEvent.caseId !== context.proofCase.id) {
            throw new Error("Idempotency key belongs to another proof review");
          }
          return { kind: "idempotent" as const, event: existingEvent };
        }
        const [lastVersion] = await transaction
          .select()
          .from(proofSubmissionVersions)
          .where(eq(proofSubmissionVersions.caseId, context.proofCase.id))
          .orderBy(desc(proofSubmissionVersions.ordinal))
          .limit(1);
        const replacementEvidence = input.evidence ?? null;
        const artifactUrl =
          validation.value.artifactUrl ??
          lastVersion?.artifactUrl ??
          context.submission.artifactUrl;
        await transaction.insert(proofSubmissionVersions).values({
          id: randomUUID(),
          caseId: context.proofCase.id,
          submissionId: context.submission.id,
          ordinal: (lastVersion?.ordinal ?? 0) + 1,
          kind: "appeal",
          resultSummary:
            lastVersion?.resultSummary ?? context.submission.resultSummary,
          artifactUrl,
          templateEvidence:
            lastVersion?.templateEvidence ?? context.submission.templateEvidence,
          evidenceObjectKey:
            replacementEvidence?.objectKey ??
            lastVersion?.evidenceObjectKey ??
            context.submission.evidenceObjectKey,
          evidenceContentType:
            replacementEvidence?.contentType ??
            lastVersion?.evidenceContentType ??
            context.submission.evidenceContentType,
          evidenceByteSize:
            replacementEvidence?.byteSize ??
            lastVersion?.evidenceByteSize ??
            context.submission.evidenceByteSize,
          proofShareMode:
            lastVersion?.proofShareMode ?? context.submission.proofShareMode,
          evidenceDigest: digest({
            prior: lastVersion?.evidenceDigest ?? null,
            reason: validation.value.reason,
            artifactUrl,
            replacementMediaSha256: input.mediaSha256 ?? null
          }),
          mediaSha256: input.mediaSha256 ?? lastVersion?.mediaSha256 ?? null,
          createdByUserId: input.userId,
          createdAt: input.now
        });
        return applyProofTransition(
          transaction as unknown as PodsDatabase,
          context,
          {
            eventType: "open_appeal",
            actor: "participant",
            actorUserId: input.userId,
            idempotencyKey: input.idempotencyKey,
            payload: { ...validation.value },
            now: input.now
          }
        );
      });
    },

    async acceptProofRejection(input: {
      userId: string;
      podId: string;
      submissionId: string;
      idempotencyKey: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const context = await lockedContext(
          transaction as unknown as PodsDatabase,
          input
        );
        if (!context || context.participantUserId !== input.userId) return null;
        return applyProofTransition(
          transaction as unknown as PodsDatabase,
          context,
          {
            eventType: "accept_rejection",
            actor: "participant",
            actorUserId: input.userId,
            idempotencyKey: input.idempotencyKey,
            payload: {},
            now: input.now
          }
        );
      });
    },

    async shareProofReviewWithPod(input: {
      userId: string;
      podId: string;
      submissionId: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const context = await lockedContext(
          transaction as unknown as PodsDatabase,
          input
        );
        if (!context || context.participantUserId !== input.userId) return null;
        const [rejection] = await transaction
          .select({ id: proofReviewEvents.id })
          .from(proofReviewEvents)
          .where(
            and(
              eq(proofReviewEvents.caseId, context.proofCase.id),
              eq(proofReviewEvents.type, "provisionally_reject")
            )
          )
          .limit(1);
        if (!rejection) {
          throw new Error("Review context can be shared after a provisional rejection");
        }
        if (!context.proofCase.sharedWithPodAt) {
          await transaction
            .update(proofCases)
            .set({ sharedWithPodAt: input.now, updatedAt: input.now })
            .where(eq(proofCases.id, context.proofCase.id));
          const [projection] = await transaction
            .select({
              messageId: activityMessages.messageId,
              conversationId: messages.conversationId
            })
            .from(activityMessages)
            .innerJoin(messages, eq(activityMessages.messageId, messages.id))
            .where(eq(activityMessages.commitmentId, context.submission.commitmentId));
          if (projection) {
            await transaction.insert(realtimeEvents).values({
              conversationId: projection.conversationId,
              recipientUserId: null,
              kind: "proof_review.shared",
              payload: {
                messageId: projection.messageId,
                submissionId: context.submission.id
              },
              createdAt: input.now
            });
          }
        }
        return { sharedWithPodAt: context.proofCase.sharedWithPodAt ?? input.now };
      });
    },

    async runProofReviewDeadlines(now: Date) {
      const due = await database
        .select({ id: proofCases.id })
        .from(proofCases)
        .where(
          and(
            inArray(proofCases.stage, [
              "initial_review",
              "awaiting_clarification",
              "post_clarification_review",
              "appeal_open",
              "appeal_review"
            ]),
            lte(proofCases.stageDeadlineAt, now)
          )
        )
        .orderBy(asc(proofCases.stageDeadlineAt), asc(proofCases.id))
        .limit(100);
      let resolved = 0;
      let advanced = 0;
      for (const candidate of due) {
        const result = await database.transaction(async (transaction) => {
          const [candidateCase] = await transaction
            .select({ submissionId: proofCases.submissionId })
            .from(proofCases)
            .where(eq(proofCases.id, candidate.id));
          if (!candidateCase) return null;
          const context = await lockedContext(
            transaction as unknown as PodsDatabase,
            { submissionId: candidateCase.submissionId }
          );
          if (
            !context ||
            context.proofCase.stage === "resolved" ||
            context.proofCase.stageDeadlineAt.getTime() > now.getTime()
          ) {
            return null;
          }
          const absolute = context.proofCase.absoluteDeadlineAt.getTime() <= now.getTime();
          const eventType: ProofCaseEventType = absolute
            ? "absolute_timeout"
            : context.proofCase.stage === "awaiting_clarification"
              ? "clarification_timeout"
              : context.proofCase.stage === "appeal_open"
                ? "appeal_window_timeout"
                : context.proofCase.stage === "appeal_review"
                  ? "appeal_review_timeout"
                  : "review_timeout";
          return applyProofTransition(
            transaction as unknown as PodsDatabase,
            context,
            {
              eventType,
              actor: "system",
              actorUserId: null,
              idempotencyKey: `proof-deadline:${candidate.id}:${context.proofCase.version}:${eventType}`,
              payload: {},
              now
            }
          );
        });
        if (result?.kind === "transitioned") {
          if (result.proofCase.stage === "resolved") resolved += 1;
          else advanced += 1;
        }
      }
      return { processed: due.length, advanced, resolved };
    }
  };
}
