import { randomUUID } from "node:crypto";

import {
  isPublicVisitorContract,
  legacySubmissionProjection,
  nextSubmissionState,
  occurrenceWindowState,
  reviewDeadline,
  validateCreateGoal,
  validateCreatorReviewDecision,
  validateBuildTask,
  validateTemplateEvidenceDraft,
  validateTemplateEvidenceSubmission,
  type CommitmentDetails,
  type TemplateEvidence
} from "@pods/domain";
import { and, asc, desc, eq, ilike, inArray, lte, max, ne, or, sql } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import { projectProofForAudience } from "./proof-projection";
import {
  activityMessages,
  conversations,
  memberships,
  messages,
  occurrenceCommitments,
  occurrences,
  pods,
  profiles,
  realtimeEvents,
  reviewDecisions,
  submissions
} from "./schema";

type EvidenceObject = {
  objectKey: string;
  contentType: string;
  byteSize: number;
};

function frozenTemplateConfiguration(pod: typeof pods.$inferSelect) {
  if (!pod.contractData || pod.templateId !== pod.contractData.templateId) {
    throw new Error("Frozen Pod template is unavailable");
  }
  return pod.contractData.activity.config;
}

function repeatingCriterion(pod: typeof pods.$inferSelect): string {
  const configuration = frozenTemplateConfiguration(pod);
  if (pod.templateId === "fitness") {
    return `${String(configuration.activityType)}: ${String(configuration.measurableMinimum)}`;
  }
  if (pod.templateId === "reading") {
    return `${String(configuration.targetAmount)} ${String(configuration.targetType)} of ${String(configuration.bookOrTheme)}`;
  }
  if (pod.templateId === "study") {
    if (
      configuration.minimumKind === "minutes" &&
      typeof configuration.minimumMinutes === "number"
    ) {
      return `${String(configuration.subject)}: ${configuration.minimumMinutes} focused minutes`;
    }
    if (
      configuration.minimumKind === "output" &&
      typeof configuration.minimumOutput === "string"
    ) {
      return `${String(configuration.subject)}: ${configuration.minimumOutput}`;
    }
    return `${String(configuration.subject)}: ${String(configuration.minimumExpectation)}`;
  }
  throw new Error("This Pod requires a participant-locked commitment");
}

function requireParticipantWindow(input: {
  pod: typeof pods.$inferSelect | undefined;
  membership: typeof memberships.$inferSelect | undefined;
  occurrence: typeof occurrences.$inferSelect | undefined;
  now: Date;
}) {
  if (!input.pod || !input.membership || !input.occurrence) {
    throw new Error("Active occurrence not found");
  }
  if (input.pod.state !== "active" || input.membership.state !== "active") {
    throw new Error("Pod activity is not active");
  }
  if (input.occurrence.podId !== input.pod.id) {
    throw new Error("Occurrence does not belong to this Pod");
  }
}

export function createActivityMethods(database: PodsDatabase) {
  return {
    async runOccurrenceTransitions(now: Date) {
      return database.transaction(async (transaction) => {
        const duePods = await transaction
          .select({ id: pods.id })
          .from(pods)
          .innerJoin(
            occurrences,
            and(eq(occurrences.podId, pods.id), eq(occurrences.ordinal, 1))
          )
          .where(and(eq(pods.state, "locked_scheduled"), lte(occurrences.opensAt, now)))
          .orderBy(asc(occurrences.opensAt), asc(pods.id))
          .for("update", { of: pods });

        const duePodIds = duePods.map(({ id }) => id);
        let activatedMemberships = 0;
        if (duePodIds.length > 0) {
          const activated = await transaction
            .update(memberships)
            .set({ state: "active", updatedAt: now })
            .where(
              and(
                inArray(memberships.podId, duePodIds),
                eq(memberships.state, "roster_locked")
              )
            )
            .returning({ id: memberships.id });
          activatedMemberships = activated.length;
          await transaction
            .update(pods)
            .set({ state: "active", updatedAt: now })
            .where(
              and(inArray(pods.id, duePodIds), eq(pods.state, "locked_scheduled"))
            );
        }

        const activeOccurrences = await transaction
          .select({ occurrence: occurrences })
          .from(occurrences)
          .innerJoin(pods, eq(occurrences.podId, pods.id))
          .where(eq(pods.state, "active"));
        let advancedOccurrences = 0;
        for (const { occurrence } of activeOccurrences) {
          const state = occurrenceWindowState(occurrence, now);
          if (state === occurrence.state) continue;
          await transaction
            .update(occurrences)
            .set({ state })
            .where(eq(occurrences.id, occurrence.id));
          advancedOccurrences += 1;
        }

        const endingPods = await transaction
          .select({
            id: pods.id,
            lastClosesAt: max(occurrences.closesAt)
          })
          .from(pods)
          .innerJoin(occurrences, eq(occurrences.podId, pods.id))
          .where(eq(pods.state, "active"))
          .groupBy(pods.id)
          .having(lte(max(occurrences.closesAt), now));
        const endingPodIds = endingPods.map(({ id }) => id);
        if (endingPodIds.length > 0) {
          await transaction
            .update(pods)
            .set({ state: "final_review", updatedAt: now })
            .where(
              and(
                inArray(pods.id, endingPodIds),
                eq(pods.state, "active")
              )
            );
          const archived = await transaction
            .update(conversations)
            .set({ roomState: "archived", archivedAt: now, updatedAt: now })
            .where(
              and(
                inArray(conversations.podId, endingPodIds),
                eq(conversations.kind, "pod")
              )
            )
            .returning({ id: conversations.id, podId: conversations.podId });
          if (archived.length > 0) {
            await transaction.insert(realtimeEvents).values(
              archived.map((conversation) => ({
                conversationId: conversation.id,
                recipientUserId: null,
                kind: "pod.final_review",
                payload: { podId: conversation.podId },
                createdAt: now
              }))
            );
          }
        }

        const finalReviewPods = await transaction
          .select({ id: pods.id, contractData: pods.contractData })
          .from(pods)
          .where(eq(pods.state, "final_review"))
          .for("update");
        const completedPodIds: string[] = [];
        for (const candidate of finalReviewPods) {
          if (candidate.contractData?.settlementMode !== "full_refund_alpha") {
            continue;
          }
          const [pending] = await transaction
            .select({ id: submissions.id })
            .from(submissions)
            .innerJoin(
              occurrences,
              eq(submissions.occurrenceId, occurrences.id)
            )
            .where(
              and(
                eq(occurrences.podId, candidate.id),
                eq(submissions.state, "reviewing")
              )
            )
            .limit(1);
          if (!pending) completedPodIds.push(candidate.id);
        }
        if (completedPodIds.length > 0) {
          await transaction
            .update(pods)
            .set({ state: "completed", completedAt: now, updatedAt: now })
            .where(
              and(
                inArray(pods.id, completedPodIds),
                eq(pods.state, "final_review")
              )
            );
          const completedConversations = await transaction
            .select({ id: conversations.id, podId: conversations.podId })
            .from(conversations)
            .where(
              and(
                inArray(conversations.podId, completedPodIds),
                eq(conversations.kind, "pod")
              )
            );
          if (completedConversations.length > 0) {
            await transaction.insert(realtimeEvents).values(
              completedConversations.map((conversation) => ({
                conversationId: conversation.id,
                recipientUserId: null,
                kind: "pod.completed",
                payload: { podId: conversation.podId },
                createdAt: now
              }))
            );
          }
        }

        return {
          activatedPods: duePodIds.length,
          activatedMemberships,
          advancedOccurrences,
          finalReviewPods: endingPodIds.length,
          completedPods: completedPodIds.length
        };
      });
    },

    async lockOccurrenceCommitment(input: {
      userId: string;
      podId: string;
      occurrenceId: string;
      task?: unknown;
      deliverableType?: unknown;
      goal?: unknown;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [pod] = await transaction.select().from(pods).where(eq(pods.id, input.podId));
        const [membership] = await transaction
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.podId, input.podId),
              eq(memberships.userId, input.userId)
            )
          );
        const [occurrence] = await transaction
          .select()
          .from(occurrences)
          .where(eq(occurrences.id, input.occurrenceId));
        requireParticipantWindow({ pod, membership, occurrence, now: input.now });
        const configuration = frozenTemplateConfiguration(pod!);
        if (pod!.templateId !== "build" && pod!.templateId !== "create") {
          throw new Error("Repeating activities do not use a commitment lock");
        }
        if (
          input.now.getTime() < occurrence!.opensAt.getTime() ||
          !occurrence!.commitmentDeadlineAt ||
          input.now.getTime() >= occurrence!.commitmentDeadlineAt.getTime()
        ) {
          throw new Error("The task lock window is closed");
        }
        const [existing] = await transaction
          .select()
          .from(occurrenceCommitments)
          .where(
            and(
              eq(occurrenceCommitments.occurrenceId, occurrence!.id),
              eq(occurrenceCommitments.membershipId, membership!.id)
            )
          )
          .for("update");
        if (existing) throw new Error("This occurrence commitment is already locked");

        const buildValidation = pod!.templateId === "build"
          ? validateBuildTask({
              task: input.task,
              deliverableType: input.deliverableType,
              allowedDeliverables: configuration.allowedDeliverables
            })
          : null;
        const createValidation = pod!.templateId === "create"
          ? validateCreateGoal(input.goal)
          : null;
        if (buildValidation && !buildValidation.success) {
          throw new Error(buildValidation.errors[0]);
        }
        if (createValidation && !createValidation.success) {
          throw new Error(createValidation.errors[0]);
        }
        const details: CommitmentDetails = buildValidation?.success
          ? {
              kind: "build",
              task: buildValidation.value.task,
              deliverableType: buildValidation.value.deliverableType
            }
          : {
              kind: "create",
              goal: createValidation!.success ? createValidation!.value.goal : ""
            };
        const task = details.kind === "build" ? details.task : details.goal;
        const [commitment] = await transaction
          .insert(occurrenceCommitments)
          .values({
            id: randomUUID(),
            occurrenceId: occurrence!.id,
            membershipId: membership!.id,
            kind: details.kind,
            task,
            deliverableType:
              details.kind === "build" ? details.deliverableType : null,
            details,
            lockedAt: input.now
          })
          .returning();
        if (!commitment) throw new Error("Occurrence commitment could not be locked");

        const [createdConversation] = await transaction
          .insert(conversations)
          .values({
            id: randomUUID(),
            kind: "pod",
            podId: input.podId,
            directPairKey: null,
            firstUserId: null,
            secondUserId: null,
            requestSenderUserId: null,
            directState: null,
            roomState: "open",
            lastSequence: 0,
            archivedAt: null,
            createdAt: input.now,
            updatedAt: input.now
          })
          .onConflictDoNothing({ target: conversations.podId })
          .returning();
        const conversation = createdConversation ?? (await transaction
          .select()
          .from(conversations)
          .where(eq(conversations.podId, input.podId)))[0];
        if (!conversation) throw new Error("Pod room could not be projected");
        const [advanced] = await transaction
          .update(conversations)
          .set({
            lastSequence: sql`${conversations.lastSequence} + 1`,
            updatedAt: input.now
          })
          .where(eq(conversations.id, conversation.id))
          .returning({ sequence: conversations.lastSequence });
        if (!advanced) throw new Error("Pod room could not be advanced");
        const [message] = await transaction
          .insert(messages)
          .values({
            id: randomUUID(),
            conversationId: conversation.id,
            sequence: advanced.sequence,
            senderUserId: input.userId,
            kind: "activity",
            body: task,
            clientMessageId: null,
            replyToMessageId: null,
            hiddenAt: null,
            hiddenByUserId: null,
            editedAt: null,
            deletedAt: null,
            pinnedAt: null,
            createdAt: input.now,
            updatedAt: input.now
          })
          .returning();
        if (!message) throw new Error("Activity card could not be projected");
        await transaction.insert(activityMessages).values({
          commitmentId: commitment.id,
          messageId: message.id,
          createdAt: input.now
        });
        await transaction.insert(realtimeEvents).values({
          conversationId: conversation.id,
          recipientUserId: null,
          kind: "activity.committed",
          payload: { messageId: message.id, commitmentId: commitment.id },
          createdAt: input.now
        });
        return commitment;
      });
    },

    async saveSubmissionDraft(input: {
      userId: string;
      podId: string;
      occurrenceId: string;
      resultSummary?: unknown;
      artifactUrl?: unknown;
      templateEvidence?: unknown;
      evidence?: EvidenceObject | null;
      proofShareMode?: unknown;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [pod] = await transaction.select().from(pods).where(eq(pods.id, input.podId));
        const [membership] = await transaction
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.podId, input.podId),
              eq(memberships.userId, input.userId)
            )
          );
        const [occurrence] = await transaction
          .select()
          .from(occurrences)
          .where(eq(occurrences.id, input.occurrenceId));
        requireParticipantWindow({ pod, membership, occurrence, now: input.now });
        frozenTemplateConfiguration(pod!);
        if (
          input.now.getTime() < occurrence!.opensAt.getTime() ||
          input.now.getTime() >= occurrence!.closesAt.getTime()
        ) {
          throw new Error("The evidence window is closed");
        }

        let [commitment] = await transaction
          .select()
          .from(occurrenceCommitments)
          .where(
            and(
              eq(occurrenceCommitments.occurrenceId, occurrence!.id),
              eq(occurrenceCommitments.membershipId, membership!.id)
            )
          );

        if (
          !commitment &&
          pod!.contractData!.evidenceMode === "repeating_criterion"
        ) {
          const criterion = repeatingCriterion(pod!);
          const [createdCommitment] = await transaction
            .insert(occurrenceCommitments)
            .values({
              id: randomUUID(),
              occurrenceId: occurrence!.id,
              membershipId: membership!.id,
              kind: "repeating_criterion",
              task: criterion,
              deliverableType: null,
              details: {
                kind: "repeating_criterion",
                criterion
              },
              lockedAt: input.now
            })
            .onConflictDoNothing({
              target: [
                occurrenceCommitments.occurrenceId,
                occurrenceCommitments.membershipId
              ]
            })
            .returning();

          commitment = createdCommitment;
          if (!commitment) {
            [commitment] = await transaction
              .select()
              .from(occurrenceCommitments)
              .where(
                and(
                  eq(occurrenceCommitments.occurrenceId, occurrence!.id),
                  eq(occurrenceCommitments.membershipId, membership!.id)
                )
              );
          } else {
            const [createdConversation] = await transaction
              .insert(conversations)
              .values({
                id: randomUUID(),
                kind: "pod",
                podId: input.podId,
                directPairKey: null,
                firstUserId: null,
                secondUserId: null,
                requestSenderUserId: null,
                directState: null,
                roomState: "open",
                lastSequence: 0,
                archivedAt: null,
                createdAt: input.now,
                updatedAt: input.now
              })
              .onConflictDoNothing({ target: conversations.podId })
              .returning();
            const conversation = createdConversation ?? (await transaction
              .select()
              .from(conversations)
              .where(eq(conversations.podId, input.podId)))[0];
            if (!conversation) throw new Error("Pod room could not be projected");
            const [advanced] = await transaction
              .update(conversations)
              .set({
                lastSequence: sql`${conversations.lastSequence} + 1`,
                updatedAt: input.now
              })
              .where(eq(conversations.id, conversation.id))
              .returning({ sequence: conversations.lastSequence });
            if (!advanced) throw new Error("Pod room could not be advanced");
            const [message] = await transaction
              .insert(messages)
              .values({
                id: randomUUID(),
                conversationId: conversation.id,
                sequence: advanced.sequence,
                senderUserId: input.userId,
                kind: "activity",
                body: criterion,
                clientMessageId: null,
                replyToMessageId: null,
                hiddenAt: null,
                hiddenByUserId: null,
                editedAt: null,
                deletedAt: null,
                pinnedAt: null,
                createdAt: input.now,
                updatedAt: input.now
              })
              .returning();
            if (!message) throw new Error("Activity card could not be projected");
            await transaction.insert(activityMessages).values({
              commitmentId: commitment.id,
              messageId: message.id,
              createdAt: input.now
            });
            await transaction.insert(realtimeEvents).values({
              conversationId: conversation.id,
              recipientUserId: null,
              kind: "activity.committed",
              payload: {
                messageId: message.id,
                commitmentId: commitment.id
              },
              createdAt: input.now
            });
          }
        }
        if (!commitment) {
          throw new Error("Lock this occurrence commitment before adding evidence");
        }

        const [existing] = await transaction
          .select()
          .from(submissions)
          .where(
            and(
              eq(submissions.occurrenceId, occurrence!.id),
              eq(submissions.membershipId, membership!.id)
            )
          )
          .for("update");
        if (existing && existing.state !== "draft") {
          throw new Error("Submitted evidence is immutable");
        }
        const rawTemplateEvidence =
          input.templateEvidence ??
          existing?.templateEvidence ??
          (pod!.templateId === "build"
            ? {
                kind: "build",
                resultSummary: input.resultSummary,
                artifactUrl: input.artifactUrl
              }
            : null);
        const validation = validateTemplateEvidenceDraft({
          templateId: pod!.templateId,
          evidence: rawTemplateEvidence
        });
        if (!validation.success) throw new Error(validation.errors[0]);
        const projection = legacySubmissionProjection(validation.value);
        const evidence = input.evidence === undefined
          ? existing
            ? {
                objectKey: existing.evidenceObjectKey,
                contentType: existing.evidenceContentType,
                byteSize: existing.evidenceByteSize
              }
            : null
          : input.evidence;
        const values = {
          resultSummary: projection.resultSummary,
          artifactUrl: projection.artifactUrl,
          templateEvidence: validation.value,
          evidenceObjectKey: evidence?.objectKey ?? null,
          evidenceContentType: evidence?.contentType ?? null,
          evidenceByteSize: evidence?.byteSize ?? null,
          proofShareMode:
            input.proofShareMode === "public" && isPublicVisitorContract(pod!.contractData!)
              ? "public"
              : input.proofShareMode === "pod_shared" || input.proofShareMode === "reviewer_only"
              ? input.proofShareMode
              : existing?.proofShareMode ?? "reviewer_only",
          updatedAt: input.now
        };
        if (existing) {
          const [updated] = await transaction
            .update(submissions)
            .set(values)
            .where(and(eq(submissions.id, existing.id), eq(submissions.state, "draft")))
            .returning();
          if (!updated) throw new Error("Evidence draft could not be saved");
          return updated;
        }
        const [created] = await transaction
          .insert(submissions)
          .values({
            id: randomUUID(),
            occurrenceId: occurrence!.id,
            membershipId: membership!.id,
            commitmentId: commitment.id,
            state: "draft",
            ...values,
            submittedAt: null,
            reviewTargetAt: null,
            reviewHardDeadlineAt: null,
            reviewedAt: null,
            approvedAt: null,
            createdAt: input.now
          })
          .returning();
        if (!created) throw new Error("Evidence draft could not be saved");
        return created;
      });
    },

    async attachSubmissionEvidence(input: {
      userId: string;
      submissionId: string;
      evidence: EvidenceObject;
      now: Date;
    }) {
      const [owned] = await database
        .select({ submission: submissions, occurrence: occurrences })
        .from(submissions)
        .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .where(
          and(
            eq(submissions.id, input.submissionId),
            eq(memberships.userId, input.userId),
            eq(submissions.state, "draft")
          )
        );
      if (!owned) throw new Error("Editable evidence draft not found");
      if (input.now.getTime() >= owned.occurrence.closesAt.getTime()) {
        throw new Error("The evidence deadline has passed");
      }
      const [updated] = await database
        .update(submissions)
        .set({
          evidenceObjectKey: input.evidence.objectKey,
          evidenceContentType: input.evidence.contentType,
          evidenceByteSize: input.evidence.byteSize,
          updatedAt: input.now
        })
        .where(and(eq(submissions.id, input.submissionId), eq(submissions.state, "draft")))
        .returning();
      if (!updated) throw new Error("Evidence image could not be attached");
      return updated;
    },

    async submitOccurrenceEvidence(input: {
      userId: string;
      submissionId: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [owned] = await transaction
          .select({
            submission: submissions,
            occurrence: occurrences,
            commitment: occurrenceCommitments,
            pod: pods
          })
          .from(submissions)
          .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
          .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
          .innerJoin(
            occurrenceCommitments,
            eq(submissions.commitmentId, occurrenceCommitments.id)
          )
          .innerJoin(pods, eq(occurrences.podId, pods.id))
          .where(
            and(
              eq(submissions.id, input.submissionId),
              eq(memberships.userId, input.userId)
            )
          )
          .for("update", { of: submissions });
        if (!owned || owned.submission.state !== "draft") {
          throw new Error("Editable evidence draft not found");
        }
        if (input.now.getTime() >= owned.occurrence.closesAt.getTime()) {
          throw new Error("The evidence deadline has passed");
        }
        const templateEvidence: TemplateEvidence =
          owned.submission.templateEvidence ??
          {
            kind: "build",
            resultSummary: owned.submission.resultSummary,
            artifactUrl: owned.submission.artifactUrl
          };
        const validation = validateTemplateEvidenceSubmission({
          templateId: owned.pod.templateId,
          evidence: templateEvidence,
          frozenConfig: frozenTemplateConfiguration(owned.pod),
          hasEvidenceImage: owned.submission.evidenceObjectKey !== null,
          ...(owned.commitment.deliverableType
            ? { deliverableType: owned.commitment.deliverableType }
            : {})
        });
        if (!validation.success) throw new Error(validation.errors[0]);
        const reviewing = nextSubmissionState("draft", "submit", "participant");
        if (reviewing !== "reviewing") throw new Error("Review could not start");
        const deadlines = reviewDeadline(input.now);
        const [updated] = await transaction
          .update(submissions)
          .set({
            state: reviewing,
            submittedAt: input.now,
            reviewTargetAt: deadlines.targetAt,
            reviewHardDeadlineAt: deadlines.hardDeadlineAt,
            updatedAt: input.now
          })
          .where(and(eq(submissions.id, input.submissionId), eq(submissions.state, "draft")))
          .returning();
        if (!updated) throw new Error("Evidence could not be submitted");
        const [projection] = await transaction
          .select({
            messageId: activityMessages.messageId,
            conversationId: messages.conversationId
          })
          .from(activityMessages)
          .innerJoin(messages, eq(activityMessages.messageId, messages.id))
          .where(eq(activityMessages.commitmentId, owned.commitment.id));
        if (projection) {
          await transaction.insert(realtimeEvents).values({
            conversationId: projection.conversationId,
            recipientUserId: null,
            kind: "submission.submitted",
            payload: {
              messageId: projection.messageId,
              submissionId: updated.id
            },
            createdAt: input.now
          });
        }
        return updated;
      });
    },

    async listPendingReviewsForCreator(input: {
      creatorUserId: string;
      podId: string;
    }) {
      const [owned] = await database
        .select({ pod: pods })
        .from(pods)
        .where(
          and(
            eq(pods.id, input.podId),
            eq(pods.creatorUserId, input.creatorUserId)
          )
        );
      const contract = owned?.pod.contractData;
      if (!owned || contract?.verification.verifier !== "creator") {
        return null;
      }
      const queue = await database
        .select({
          submission: submissions,
          commitment: occurrenceCommitments,
          occurrence: occurrences,
          participant: {
            handle: profiles.handle,
            displayName: profiles.displayName,
            avatar: profiles.avatar
          }
        })
        .from(submissions)
        .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
        .innerJoin(profiles, eq(memberships.userId, profiles.userId))
        .where(
          and(
            eq(occurrences.podId, input.podId),
            eq(submissions.state, "reviewing")
          )
        )
        .orderBy(asc(submissions.reviewTargetAt), asc(submissions.id));
      return queue.map((record) => ({
        ...record,
        timeZone: contract.activity.timeZone
      }));
    },

    async findFirstPendingReviewForCreator(input: {
      creatorUserId: string;
    }) {
      const [result] = await database
        .select({ pod: pods })
        .from(submissions)
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(pods, eq(occurrences.podId, pods.id))
        .where(
          and(
            eq(pods.creatorUserId, input.creatorUserId),
            inArray(pods.state, ["active", "final_review"]),
            eq(submissions.state, "reviewing"),
            sql`${pods.contractData} -> 'verification' ->> 'verifier' = 'creator'`
          )
        )
        .orderBy(asc(submissions.reviewTargetAt), asc(submissions.id))
        .limit(1);
      if (result?.pod.contractData?.verification.verifier !== "creator") {
        return null;
      }
      return result.pod;
    },

    async getReviewSubmissionForCreator(input: {
      creatorUserId: string;
      podId: string;
      submissionId: string;
    }) {
      const [result] = await database
        .select({
          submission: submissions,
          commitment: occurrenceCommitments,
          occurrence: occurrences,
          pod: pods,
          participant: {
            handle: profiles.handle,
            displayName: profiles.displayName,
            avatar: profiles.avatar
          },
          reviewDecision: reviewDecisions
        })
        .from(submissions)
        .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(pods, eq(occurrences.podId, pods.id))
        .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
        .innerJoin(profiles, eq(memberships.userId, profiles.userId))
        .leftJoin(reviewDecisions, eq(reviewDecisions.submissionId, submissions.id))
        .where(
          and(
            eq(pods.id, input.podId),
            eq(pods.creatorUserId, input.creatorUserId),
            eq(submissions.id, input.submissionId),
            ne(submissions.state, "draft")
          )
        );
      if (result?.pod.contractData?.verification.verifier !== "creator") {
        return null;
      }
      return result;
    },

    async getCreatorSubmissionEvidence(input: {
      creatorUserId: string;
      podId: string;
      submissionId: string;
    }) {
      const [owned] = await database
        .select({ contractData: pods.contractData })
        .from(pods)
        .where(
          and(
            eq(pods.id, input.podId),
            eq(pods.creatorUserId, input.creatorUserId)
          )
        );
      if (owned?.contractData?.verification.verifier !== "creator") {
        return null;
      }
      const [result] = await database
        .select({
          objectKey: submissions.evidenceObjectKey,
          contentType: submissions.evidenceContentType,
          byteSize: submissions.evidenceByteSize
        })
        .from(submissions)
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(pods, eq(occurrences.podId, pods.id))
        .where(
          and(
            eq(pods.id, input.podId),
            eq(pods.creatorUserId, input.creatorUserId),
            eq(submissions.id, input.submissionId),
            ne(submissions.state, "draft")
          )
        );
      if (!result?.objectKey) return null;
      return {
        objectKey: result.objectKey,
        contentType: result.contentType ?? "image/webp",
        byteSize: result.byteSize
      };
    },

    async decideSubmissionAsCreator(input: {
      creatorUserId: string;
      podId: string;
      submissionId: string;
      decision: unknown;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [owned] = await transaction
          .select({
            submission: submissions,
            contractData: pods.contractData
          })
          .from(submissions)
          .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
          .innerJoin(pods, eq(occurrences.podId, pods.id))
          .where(
            and(
              eq(pods.id, input.podId),
              eq(pods.creatorUserId, input.creatorUserId),
              eq(submissions.id, input.submissionId)
            )
          )
          .for("update", { of: submissions });
        if (
          !owned ||
          owned.contractData?.verification.verifier !== "creator"
        ) {
          return null;
        }
        if (
          owned.submission.state === "approved" ||
          owned.submission.state === "rejected" ||
          owned.submission.state === "timeout_protected"
        ) {
          return { kind: "already_decided" as const, submission: owned.submission };
        }
        if (owned.submission.state !== "reviewing") return null;
        if (
          !owned.submission.reviewHardDeadlineAt ||
          owned.submission.reviewHardDeadlineAt.getTime() <= input.now.getTime()
        ) {
          const state = nextSubmissionState(
            "reviewing",
            "protect_timeout",
            "system"
          );
          if (state !== "timeout_protected") {
            throw new Error("Timed out review cannot be protected");
          }
          const [submission] = await transaction
            .update(submissions)
            .set({
              state,
              reviewedAt: input.now,
              approvedAt: null,
              updatedAt: input.now
            })
            .where(
              and(
                eq(submissions.id, owned.submission.id),
                eq(submissions.state, "reviewing")
              )
            )
            .returning();
          if (!submission) throw new Error("Timed out review could not be protected");

          const [projection] = await transaction
            .select({
              messageId: activityMessages.messageId,
              conversationId: messages.conversationId
            })
            .from(activityMessages)
            .innerJoin(messages, eq(activityMessages.messageId, messages.id))
            .where(eq(activityMessages.commitmentId, submission.commitmentId));
          if (projection) {
            await transaction.insert(realtimeEvents).values({
              conversationId: projection.conversationId,
              recipientUserId: null,
              kind: "submission.timeout_protected",
              payload: {
                messageId: projection.messageId,
                submissionId: submission.id
              },
              createdAt: input.now
            });
          }
          return { kind: "already_decided" as const, submission };
        }

        const validation = validateCreatorReviewDecision(input.decision);
        if (!validation.success) throw new Error(validation.errors[0]);
        const action = validation.value.decision === "approve" ? "approved" : "rejected";
        const state = nextSubmissionState(
          "reviewing",
          validation.value.decision,
          "creator"
        );
        if (state !== action) throw new Error("Submission cannot be decided");

        await transaction.insert(reviewDecisions).values({
          id: randomUUID(),
          submissionId: owned.submission.id,
          action,
          reviewerId: input.creatorUserId,
          reasonCode:
            action === "approved"
              ? "meets_commitment"
              : "does_not_meet_commitment",
          note:
            validation.value.decision === "approve"
              ? validation.value.note
              : validation.value.reason,
          createdAt: input.now
        });
        const [submission] = await transaction
          .update(submissions)
          .set({
            state,
            reviewedAt: input.now,
            approvedAt: action === "approved" ? input.now : null,
            updatedAt: input.now
          })
          .where(
            and(
              eq(submissions.id, owned.submission.id),
              eq(submissions.state, "reviewing")
            )
          )
          .returning();
        if (!submission) throw new Error("Submission could not be decided");

        const [projection] = await transaction
          .select({
            messageId: activityMessages.messageId,
            conversationId: messages.conversationId
          })
          .from(activityMessages)
          .innerJoin(messages, eq(activityMessages.messageId, messages.id))
          .where(eq(activityMessages.commitmentId, submission.commitmentId));
        if (projection) {
          await transaction.insert(realtimeEvents).values({
            conversationId: projection.conversationId,
            recipientUserId: null,
            kind:
              action === "approved"
                ? "submission.approved"
                : "submission.rejected",
            payload: {
              messageId: projection.messageId,
              submissionId: submission.id
            },
            createdAt: input.now
          });
        }
        return { kind: "decided" as const, submission };
      });
    },

    async protectTimedOutReviews(now: Date) {
      return database.transaction(async (transaction) => {
        const due = await transaction
          .select({ submission: submissions })
          .from(submissions)
          .where(
            and(
              eq(submissions.state, "reviewing"),
              lte(submissions.reviewHardDeadlineAt, now)
            )
          )
          .orderBy(asc(submissions.reviewHardDeadlineAt), asc(submissions.id))
          .limit(100)
          .for("update", { of: submissions, skipLocked: true });
        const state = nextSubmissionState(
          "reviewing",
          "protect_timeout",
          "system"
        );
        if (state !== "timeout_protected") {
          throw new Error("Timed out review cannot be protected");
        }

        let protectedSubmissions = 0;
        for (const candidate of due) {
          const [submission] = await transaction
            .update(submissions)
            .set({
              state,
              reviewedAt: now,
              approvedAt: null,
              updatedAt: now
            })
            .where(
              and(
                eq(submissions.id, candidate.submission.id),
                eq(submissions.state, "reviewing")
              )
            )
            .returning();
          if (!submission) continue;
          protectedSubmissions += 1;

          const [projection] = await transaction
            .select({
              messageId: activityMessages.messageId,
              conversationId: messages.conversationId
            })
            .from(activityMessages)
            .innerJoin(messages, eq(activityMessages.messageId, messages.id))
            .where(eq(activityMessages.commitmentId, submission.commitmentId));
          if (projection) {
            await transaction.insert(realtimeEvents).values({
              conversationId: projection.conversationId,
              recipientUserId: null,
              kind: "submission.timeout_protected",
              payload: {
                messageId: projection.messageId,
                submissionId: submission.id
              },
              createdAt: now
            });
          }
        }
        return { protectedSubmissions };
      });
    },

    async getSubmissionForOwner(input: { userId: string; submissionId: string }) {
      const [result] = await database
        .select({
          submission: submissions,
          commitment: occurrenceCommitments,
          occurrence: occurrences,
          pod: pods,
          reviewDecision: reviewDecisions
        })
        .from(submissions)
        .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
        .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(pods, eq(occurrences.podId, pods.id))
        .leftJoin(reviewDecisions, eq(reviewDecisions.submissionId, submissions.id))
        .where(
          and(eq(submissions.id, input.submissionId), eq(memberships.userId, input.userId))
        );
      return result ?? null;
    },

    async getActivityOccurrenceForMember(input: {
      userId: string;
      podId: string;
      occurrenceId: string;
    }) {
      const [base] = await database
        .select({ occurrence: occurrences, membership: memberships, pod: pods })
        .from(memberships)
        .innerJoin(pods, eq(memberships.podId, pods.id))
        .innerJoin(occurrences, eq(occurrences.podId, pods.id))
        .where(
          and(
            eq(memberships.userId, input.userId),
            eq(memberships.podId, input.podId),
            eq(occurrences.id, input.occurrenceId),
            eq(memberships.state, "active"),
            eq(pods.state, "active")
          )
        );
      if (!base) return null;
      const [commitment] = await database
        .select()
        .from(occurrenceCommitments)
        .where(
          and(
            eq(occurrenceCommitments.occurrenceId, base.occurrence.id),
            eq(occurrenceCommitments.membershipId, base.membership.id)
          )
        );
      const [submission] = await database
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.occurrenceId, base.occurrence.id),
            eq(submissions.membershipId, base.membership.id)
          )
        );
      return { ...base, commitment: commitment ?? null, submission: submission ?? null };
    },

    async listCurrentActivitiesForUser(input: { userId: string; now: Date }) {
      const rows = await database
        .select({ occurrence: occurrences, membership: memberships, pod: pods })
        .from(memberships)
        .innerJoin(pods, eq(memberships.podId, pods.id))
        .innerJoin(occurrences, eq(occurrences.podId, pods.id))
        .where(
          and(
            eq(memberships.userId, input.userId),
            eq(memberships.state, "active"),
            eq(pods.state, "active")
          )
        )
        .orderBy(asc(occurrences.opensAt), asc(occurrences.ordinal));
      const byPod = new Map<string, (typeof rows)[number]>();
      for (const row of rows) {
        const current = byPod.get(row.pod.id);
        const isOpen =
          row.occurrence.opensAt.getTime() <= input.now.getTime() &&
          row.occurrence.closesAt.getTime() > input.now.getTime();
        const isFuture = row.occurrence.opensAt.getTime() > input.now.getTime();
        if (!current && (isOpen || isFuture)) byPod.set(row.pod.id, row);
        if (
          current &&
          current.occurrence.opensAt.getTime() > input.now.getTime() &&
          isOpen
        ) {
          byPod.set(row.pod.id, row);
        }
      }
      const result = [];
      for (const row of byPod.values()) {
        const detail = await this.getActivityOccurrenceForMember({
          userId: input.userId,
          podId: row.pod.id,
          occurrenceId: row.occurrence.id
        });
        if (detail) result.push(detail);
      }
      return result;
    },

    async listActivityScheduleForMember(input: { userId: string; podId: string }) {
      const [base] = await database
        .select({ membership: memberships })
        .from(memberships)
        .innerJoin(pods, eq(memberships.podId, pods.id))
        .where(
          and(
            eq(memberships.userId, input.userId),
            eq(memberships.podId, input.podId),
            eq(memberships.state, "active"),
            eq(pods.state, "active")
          )
        );
      if (!base) return null;
      return database
        .select({
          occurrence: occurrences,
          commitment: occurrenceCommitments,
          submission: submissions
        })
        .from(occurrences)
        .leftJoin(
          occurrenceCommitments,
          and(
            eq(occurrenceCommitments.occurrenceId, occurrences.id),
            eq(occurrenceCommitments.membershipId, base.membership.id)
          )
        )
        .leftJoin(
          submissions,
          and(
            eq(submissions.occurrenceId, occurrences.id),
            eq(submissions.membershipId, base.membership.id)
          )
        )
        .where(eq(occurrences.podId, input.podId))
        .orderBy(asc(occurrences.ordinal));
    },

    async listApprovedFeedForPod(input: { userId: string; podId: string }) {
      const [membership] = await database
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, input.userId),
            eq(memberships.podId, input.podId),
            inArray(memberships.state, ["roster_locked", "active"])
          )
        );
      const [owned] = await database
        .select({ id: pods.id })
        .from(pods)
        .where(and(eq(pods.id, input.podId), eq(pods.creatorUserId, input.userId)));
      if (!membership && !owned) return null;
      return database
        .select({
          submission: submissions,
          commitment: occurrenceCommitments,
          occurrence: occurrences
        })
        .from(submissions)
        .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .where(
          and(
            eq(occurrences.podId, input.podId),
            inArray(submissions.state, ["approved", "timeout_protected"])
          )
        )
        .orderBy(asc(occurrences.ordinal), asc(submissions.approvedAt));
    },

    async listPodVisibleSubmissions(input: {
      userId: string;
      podId: string;
      memberQuery?: string;
      viewerOnly?: boolean;
      page?: number;
      limit?: number;
    }) {
      const [membership] = await database
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, input.userId),
            eq(memberships.podId, input.podId),
            inArray(memberships.state, ["roster_locked", "active"])
          )
        );
      const [owned] = await database
        .select({ id: pods.id })
        .from(pods)
        .where(and(eq(pods.id, input.podId), eq(pods.creatorUserId, input.userId)));
      if (!membership && !owned) return null;

      const page = Math.max(Math.floor(input.page ?? 1), 1);
      const limit = Math.min(Math.max(Math.floor(input.limit ?? 20), 1), 40);
      const query = input.memberQuery?.trim() ?? "";
      const filters = [
        eq(occurrences.podId, input.podId),
        ne(submissions.state, "draft")
      ];
      if (input.viewerOnly) filters.push(eq(memberships.userId, input.userId));
      if (query.length >= 2) {
        const memberFilter = or(
          ilike(profiles.handle, `%${query}%`),
          ilike(profiles.displayName, `%${query}%`)
        );
        if (memberFilter) filters.push(memberFilter);
      }

      const rows = await database
        .select({
          submission: {
            id: submissions.id,
            state: submissions.state,
            templateEvidence: submissions.templateEvidence,
            resultSummary: submissions.resultSummary,
            artifactUrl: submissions.artifactUrl,
            proofShareMode: submissions.proofShareMode,
            evidenceObjectKey: submissions.evidenceObjectKey,
            submittedAt: submissions.submittedAt
          },
          commitment: {
            task: occurrenceCommitments.task,
            deliverableType: occurrenceCommitments.deliverableType
          },
          occurrence: {
            ordinal: occurrences.ordinal,
            localDate: occurrences.localDate
          },
          participant: {
            handle: profiles.handle,
            displayName: profiles.displayName,
            avatar: profiles.avatar
          },
          participantUserId: memberships.userId,
          templateId: pods.templateId
        })
        .from(submissions)
        .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(pods, eq(occurrences.podId, pods.id))
        .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
        .innerJoin(profiles, eq(memberships.userId, profiles.userId))
        .where(and(...filters))
        .orderBy(desc(submissions.submittedAt), desc(submissions.id))
        .limit(limit + 1)
        .offset((page - 1) * limit);
      return {
        items: rows.slice(0, limit).map((row) => {
          const isViewer = row.participantUserId === input.userId;
          const proof = projectProofForAudience({
            audience: owned ? "creator" : isViewer ? "owner" : "member",
            shareMode: row.submission.proofShareMode,
            templateEvidence: row.submission.templateEvidence,
            resultSummary: row.submission.resultSummary,
            artifactUrl: row.submission.artifactUrl,
            hasAttachment: Boolean(row.submission.evidenceObjectKey)
          });
          const { evidenceObjectKey: _objectKey, proofShareMode: _shareMode, ...submission } =
            row.submission;
          return {
            submission: {
              ...submission,
              templateEvidence: proof.templateEvidence,
              resultSummary: proof.resultSummary,
              artifactUrl: proof.artifactUrl
            },
            commitment: row.commitment,
            occurrence: row.occurrence,
            participant: row.participant,
            templateId: row.templateId,
            isViewer,
            sharedEvidenceAvailable: proof.attachmentAvailable
          };
        }),
        page,
        hasNext: rows.length > limit
      };
    },

    async getActivityStreak(input: {
      membershipId: string;
      podId: string;
      now: Date;
    }) {
      const rows = await database
        .select({ occurrence: occurrences, submission: submissions })
        .from(occurrences)
        .leftJoin(
          submissions,
          and(
            eq(submissions.occurrenceId, occurrences.id),
            eq(submissions.membershipId, input.membershipId)
          )
        )
        .where(eq(occurrences.podId, input.podId))
        .orderBy(asc(occurrences.ordinal));
      const decided = rows.filter(
        ({ occurrence, submission }) =>
          occurrence.closesAt.getTime() <= input.now.getTime() ||
          submission?.state === "approved" ||
          submission?.state === "timeout_protected" ||
          submission?.state === "rejected"
      );
      let streak = 0;
      for (let index = decided.length - 1; index >= 0; index -= 1) {
        const row = decided[index]!;
        if (
          row.submission?.state !== "approved" &&
          row.submission?.state !== "timeout_protected"
        ) {
          break;
        }
        streak += 1;
      }
      return streak;
    }
  };
}
