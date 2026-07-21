import { randomUUID } from "node:crypto";

import {
  nextSubmissionState,
  occurrenceWindowState,
  reviewDeadline,
  validateBuildEvidence,
  validateBuildTask
} from "@pods/domain";
import { and, asc, eq, inArray, lte } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  memberships,
  occurrenceCommitments,
  occurrences,
  pods,
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

        return {
          activatedPods: duePodIds.length,
          activatedMemberships,
          advancedOccurrences
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
