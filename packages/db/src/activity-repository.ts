import { randomUUID } from "node:crypto";

import {
  isPublicVisitorContract,
  nextSubmissionState,
  occurrenceWindowState,
  reviewDeadline,
  validateBuildEvidence,
  validateBuildTask
} from "@pods/domain";
import { and, asc, desc, eq, ilike, inArray, lte, max, ne, or, sql } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
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

function frozenBuildConfiguration(pod: typeof pods.$inferSelect) {
  if (pod.templateId !== "build" || pod.contractData?.templateId !== "build") {
    throw new Error("This activity flow supports Build and Ship Pods only");
  }
  return pod.contractData.activity.config;
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
          .select({ id: pods.id })
          .from(pods)
          .where(eq(pods.state, "final_review"))
          .for("update");
        const completedPodIds: string[] = [];
        for (const candidate of finalReviewPods) {
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
                inArray(submissions.state, ["submitted", "reviewing"])
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
      task: unknown;
      deliverableType: unknown;
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
        const configuration = frozenBuildConfiguration(pod!);
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

        const validation = validateBuildTask({
          task: input.task,
          deliverableType: input.deliverableType,
          allowedDeliverables: configuration.allowedDeliverables
        });
        if (!validation.success) throw new Error(validation.errors[0]);
        const [commitment] = await transaction
          .insert(occurrenceCommitments)
          .values({
            id: randomUUID(),
            occurrenceId: occurrence!.id,
            membershipId: membership!.id,
            task: validation.value.task,
            deliverableType: validation.value.deliverableType,
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
            body: validation.value.task,
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
      resultSummary: unknown;
      artifactUrl: unknown;
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
        frozenBuildConfiguration(pod!);
        if (
          input.now.getTime() < occurrence!.opensAt.getTime() ||
          input.now.getTime() >= occurrence!.closesAt.getTime()
        ) {
          throw new Error("The evidence window is closed");
        }
        const [commitment] = await transaction
          .select()
          .from(occurrenceCommitments)
          .where(
            and(
              eq(occurrenceCommitments.occurrenceId, occurrence!.id),
              eq(occurrenceCommitments.membershipId, membership!.id)
            )
          );
        if (!commitment) throw new Error("Lock this occurrence task before adding evidence");
        const validation = validateBuildEvidence({
          deliverableType: commitment.deliverableType,
          resultSummary: input.resultSummary,
          artifactUrl: input.artifactUrl
        });
        if (!validation.success) throw new Error(validation.errors[0]);

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
          resultSummary: validation.value.resultSummary,
          artifactUrl: validation.value.artifactUrl,
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
            commitment: occurrenceCommitments
          })
          .from(submissions)
          .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
          .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
          .innerJoin(
            occurrenceCommitments,
            eq(submissions.commitmentId, occurrenceCommitments.id)
          )
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
        const validation = validateBuildEvidence({
          deliverableType: owned.commitment.deliverableType,
          resultSummary: owned.submission.resultSummary,
          artifactUrl: owned.submission.artifactUrl
        });
        if (!validation.success) throw new Error(validation.errors[0]);
        const submitted = nextSubmissionState("draft", "submit", "participant");
        if (submitted !== "submitted") throw new Error("Evidence cannot be submitted");
        const reviewing = nextSubmissionState(submitted, "start_review", "system");
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

    async listPendingReviews() {
      return database
        .select({
          submission: submissions,
          commitment: occurrenceCommitments,
          occurrence: occurrences,
          pod: pods
        })
        .from(submissions)
        .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(pods, eq(occurrences.podId, pods.id))
        .where(eq(submissions.state, "reviewing"))
        .orderBy(asc(submissions.reviewTargetAt), asc(submissions.id));
    },

    async getReviewSubmission(submissionId: string) {
      const [result] = await database
        .select({
          submission: submissions,
          commitment: occurrenceCommitments,
          occurrence: occurrences,
          pod: pods
        })
        .from(submissions)
        .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(pods, eq(occurrences.podId, pods.id))
        .where(eq(submissions.id, submissionId));
      return result ?? null;
    },

    async approveSubmission(input: {
      submissionId: string;
      reviewerId: string;
      note: string;
      now: Date;
      authority: "participant" | "reviewer";
    }) {
      if (input.authority !== "reviewer") {
        throw new Error("Pods reviewer authority is required");
      }
      const note = input.note.trim();
      if (note.length < 12 || note.length > 1000) {
        throw new Error("Review note must contain 12 to 1000 characters");
      }
      return database.transaction(async (transaction) => {
        const [submission] = await transaction
          .select()
          .from(submissions)
          .where(eq(submissions.id, input.submissionId))
          .for("update");
        if (!submission || submission.state !== "reviewing") {
          throw new Error("Submission is not awaiting review");
        }
        const state = nextSubmissionState("reviewing", "approve", "reviewer");
        if (state !== "approved") throw new Error("Submission cannot be approved");
        await transaction.insert(reviewDecisions).values({
          id: randomUUID(),
          submissionId: submission.id,
          action: "approved",
          reviewerId: input.reviewerId,
          reasonCode: "meets_frozen_commitment",
          note,
          createdAt: input.now
        });
        const [approved] = await transaction
          .update(submissions)
          .set({ state, approvedAt: input.now, updatedAt: input.now })
          .where(
            and(eq(submissions.id, submission.id), eq(submissions.state, "reviewing"))
          )
          .returning();
        if (!approved) throw new Error("Submission could not be approved");
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
            kind: "submission.approved",
            payload: {
              messageId: projection.messageId,
              submissionId: approved.id
            },
            createdAt: input.now
          });
        }
        return approved;
      });
    },

    async getSubmissionForOwner(input: { userId: string; submissionId: string }) {
      const [result] = await database
        .select({
          submission: submissions,
          commitment: occurrenceCommitments,
          occurrence: occurrences,
          pod: pods
        })
        .from(submissions)
        .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
        .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(pods, eq(occurrences.podId, pods.id))
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
          and(eq(occurrences.podId, input.podId), eq(submissions.state, "approved"))
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
            resultSummary: submissions.resultSummary,
            artifactUrl: submissions.artifactUrl,
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
          sharedEvidenceAvailable: sql<boolean>`${submissions.proofShareMode} = 'pod_shared' AND ${submissions.evidenceObjectKey} IS NOT NULL`
        })
        .from(submissions)
        .innerJoin(occurrenceCommitments, eq(submissions.commitmentId, occurrenceCommitments.id))
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
        .innerJoin(profiles, eq(memberships.userId, profiles.userId))
        .where(and(...filters))
        .orderBy(desc(submissions.submittedAt), desc(submissions.id))
        .limit(limit + 1)
        .offset((page - 1) * limit);
      return {
        items: rows.slice(0, limit).map(({ participantUserId, ...row }) => ({
          ...row,
          isViewer: participantUserId === input.userId
        })),
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
          submission?.state === "approved"
      );
      let streak = 0;
      for (let index = decided.length - 1; index >= 0; index -= 1) {
        const row = decided[index]!;
        if (row.submission?.state !== "approved") break;
        streak += 1;
      }
      return streak;
    }
  };
}
