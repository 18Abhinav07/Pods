import {
  isPublicVisitorContract,
  type ReactionCode,
  type SubmissionState
} from "@pods/domain";
import { and, asc, eq, gt, inArray, isNull, max, sql } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import { projectProofForAudience } from "./proof-projection";
import {
  activityMessages,
  conversations,
  memberships,
  messageReactions,
  messages,
  occurrenceCommitments,
  occurrences,
  pods,
  profiles,
  publicContentSuppressions,
  realtimeEvents,
  submissions
} from "./schema";

const visitorRoomPodStates = [
  "locked_scheduled",
  "active",
  "final_review",
  "completed"
] as const;

function publicPodStage(state: string) {
  if (state === "enrollment_open") return "open" as const;
  if (state === "completed") return "recent" as const;
  if (state === "cancelled" || state === "cancelled_refunding") {
    return "cancelled" as const;
  }
  return "live" as const;
}

function publicSubmissionState(state: SubmissionState | null) {
  if (state === "approved") return "approved" as const;
  if (state === "rejected") return "rejected" as const;
  if (state === "timeout_protected") return "timeout_protected" as const;
  if (state === null) return "committed" as const;
  return "under_review" as const;
}

function eligibleVisitorPod(pod: typeof pods.$inferSelect | undefined) {
  return Boolean(
    pod?.contractData &&
    isPublicVisitorContract(pod.contractData) &&
    pod.publicRoomSuspendedAt === null &&
    visitorRoomPodStates.includes(
      pod.state as (typeof visitorRoomPodStates)[number]
    )
  );
}

function publicAuthor(profile: typeof profiles.$inferSelect | null) {
  if (!profile) return null;
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    avatar: profile.avatar,
    profileVisibility: profile.visibility
  };
}

export function createPublicRoomMethods(database: PodsDatabase) {
  return {
    async getPublicPodSurface(podId: string, now: Date) {
      const [pod] = await database.select().from(pods).where(eq(pods.id, podId));
      if (!pod?.contractData || pod.contractData.community.visibility !== "public") {
        return null;
      }
      const schedule = await database
        .select({ opensAt: occurrences.opensAt, closesAt: occurrences.closesAt })
        .from(occurrences)
        .where(eq(occurrences.podId, podId))
        .orderBy(asc(occurrences.ordinal));
      const first = schedule[0];
      const last = schedule.at(-1);
      if (!first || !last) return null;
      if (pod.state === "enrollment_open") {
        if (first.opensAt.getTime() <= now.getTime()) return null;
      } else if (
        !isPublicVisitorContract(pod.contractData) ||
        pod.publicRoomSuspendedAt !== null
      ) {
        return null;
      }
      if (
        ![
          "enrollment_open",
          ...visitorRoomPodStates,
          "cancelled",
          "cancelled_refunding"
        ].includes(pod.state)
      ) {
        return null;
      }
      return {
        id: pod.id,
        creatorUserId: pod.creatorUserId,
        state: pod.state,
        stage: publicPodStage(pod.state),
        templateId: pod.templateId,
        contractData: pod.contractData,
        contractHash: pod.contractHash,
        publishedAt: pod.publishedAt,
        completedAt: pod.completedAt,
        firstOccurrenceOpensAt: first.opensAt,
        lastOccurrenceClosesAt: last.closesAt,
        visitorRoomAvailable: eligibleVisitorPod(pod)
      };
    },

    async listPublicPodDirectory(input: { now: Date; recentDays?: number }) {
      const candidates = await database
        .select()
        .from(pods)
        .where(
          inArray(pods.state, [
            "enrollment_open",
            ...visitorRoomPodStates,
            "cancelled",
            "cancelled_refunding"
          ])
        );
      const result = [];
      const recentCutoff = new Date(
        input.now.getTime() - Math.max(input.recentDays ?? 30, 1) * 86_400_000
      );
      for (const pod of candidates) {
        const surface = await this.getPublicPodSurface(pod.id, input.now);
        if (!surface) continue;
        if (
          surface.stage === "recent" &&
          (!surface.completedAt || surface.completedAt < recentCutoff)
        ) {
          continue;
        }
        result.push(surface);
      }
      return result.sort((left, right) => {
        const stageOrder = { open: 0, live: 1, recent: 2, cancelled: 3 };
        const stageDifference =
          stageOrder[left.stage] - stageOrder[right.stage];
        if (stageDifference !== 0) return stageDifference;
        return (
          left.firstOccurrenceOpensAt.getTime() -
          right.firstOccurrenceOpensAt.getTime()
        );
      });
    },

    async getPublicVisitorRoom(input: {
      podId: string;
      afterSequence: number;
      changeCursor?: number;
      limit: number;
    }) {
      const [pod] = await database.select().from(pods).where(eq(pods.id, input.podId));
      if (!eligibleVisitorPod(pod) || !pod?.contractData) return null;
      const [conversation] = await database
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.kind, "pod"),
            eq(conversations.podId, input.podId)
          )
        );
      if (!conversation) return null;

      const limit = Math.min(Math.max(Math.floor(input.limit), 1), 100);
      const [cursorRow] = await database
        .select({ cursor: max(realtimeEvents.id) })
        .from(realtimeEvents)
        .where(eq(realtimeEvents.conversationId, conversation.id));
      const changeCursor = cursorRow?.cursor ?? 0;
      const refreshExisting =
        input.changeCursor !== undefined &&
        changeCursor > Math.max(Math.floor(input.changeCursor), 0);
      const afterSequence = refreshExisting
        ? 0
        : Math.max(Math.floor(input.afterSequence), 0);
      const rows = await database
        .select({ message: messages, profile: profiles })
        .from(messages)
        .leftJoin(profiles, eq(profiles.userId, messages.senderUserId))
        .where(
          and(
            eq(messages.conversationId, conversation.id),
            gt(messages.sequence, afterSequence)
          )
        )
        .orderBy(asc(messages.sequence))
        .limit(limit);
      const messageIds = rows.map(({ message }) => message.id);
      const replyIds = [
        ...new Set(
          rows.flatMap(({ message }) =>
            message.replyToMessageId ? [message.replyToMessageId] : []
          )
        )
      ];
      const replyRows =
        replyIds.length > 0
          ? await database
              .select({ message: messages, profile: profiles })
              .from(messages)
              .leftJoin(profiles, eq(profiles.userId, messages.senderUserId))
              .where(
                and(
                  eq(messages.conversationId, conversation.id),
                  inArray(messages.id, replyIds)
                )
              )
          : [];
      const replyById = new Map(
        replyRows.map((row) => [row.message.id, row] as const)
      );
      const reactionRows =
        messageIds.length > 0
          ? await database
              .select({
                messageId: messageReactions.messageId,
                code: messageReactions.code,
                count: sql<number>`count(*)::int`
              })
              .from(messageReactions)
              .where(inArray(messageReactions.messageId, messageIds))
              .groupBy(messageReactions.messageId, messageReactions.code)
          : [];
      const activityRows =
        messageIds.length > 0
          ? await database
              .select({
                messageId: activityMessages.messageId,
                commitment: occurrenceCommitments,
                occurrence: occurrences,
                submission: submissions
              })
              .from(activityMessages)
              .innerJoin(
                occurrenceCommitments,
                eq(activityMessages.commitmentId, occurrenceCommitments.id)
              )
              .innerJoin(
                occurrences,
                eq(occurrenceCommitments.occurrenceId, occurrences.id)
              )
              .leftJoin(
                submissions,
                eq(submissions.commitmentId, occurrenceCommitments.id)
              )
              .where(inArray(activityMessages.messageId, messageIds))
          : [];
      const activityByMessage = new Map(
        activityRows.map((row) => [row.messageId, row] as const)
      );
      const targetIds = [
        ...messageIds,
        ...activityRows.flatMap(({ submission }) =>
          submission ? [submission.id] : []
        )
      ];
      const suppressionRows =
        targetIds.length > 0
          ? await database
              .select({
                targetKind: publicContentSuppressions.targetKind,
                targetId: publicContentSuppressions.targetId
              })
              .from(publicContentSuppressions)
              .where(
                and(
                  eq(publicContentSuppressions.podId, pod.id),
                  isNull(publicContentSuppressions.restoredAt),
                  inArray(publicContentSuppressions.targetId, targetIds)
                )
              )
          : [];
      const suppressedTargets = new Set(
        suppressionRows.map(({ targetKind, targetId }) => `${targetKind}:${targetId}`)
      );
      const [creatorProfile] = await database
        .select()
        .from(profiles)
        .where(eq(profiles.userId, pod.creatorUserId));
      const [participantCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(memberships)
        .where(
          and(
            eq(memberships.podId, pod.id),
            inArray(memberships.state, ["roster_locked", "active"])
          )
        );

      return {
        pod: {
          id: pod.id,
          stage: publicPodStage(pod.state),
          state: pod.state,
          templateId: pod.templateId,
          name: pod.contractData.activity.name,
          purpose: pod.contractData.activity.purpose,
          roomState: conversation.roomState,
          participantCount: (participantCount?.count ?? 0) + 1,
          occurrenceCount: pod.contractData.commitment.occurrenceCount,
          creator: publicAuthor(creatorProfile ?? null)
        },
        changeCursor,
        lastSequence: conversation.lastSequence,
        messages: rows.map(({ message, profile }) => {
          const activity = activityByMessage.get(message.id);
          const contentSuppressed =
            suppressedTargets.has(`message:${message.id}`) ||
            Boolean(
              activity?.submission &&
              suppressedTargets.has(`submission:${activity.submission.id}`)
            );
          if (
            message.hiddenAt !== null ||
            message.deletedAt !== null ||
            contentSuppressed
          ) {
            return {
              id: message.id,
              sequence: message.sequence,
              kind: message.kind,
              body: null,
              reply: null,
              hidden: true,
              pinned: false,
              createdAt: message.createdAt,
              sender: null,
              activity: null,
              reactions: [] as Array<{ code: ReactionCode; count: number }>
            };
          }
          const visibleSubmission =
            activity?.submission && activity.submission.state !== "draft"
              ? activity.submission
              : null;
          const visibleProof = visibleSubmission
            ? projectProofForAudience({
                audience: "visitor",
                shareMode: visibleSubmission.proofShareMode,
                templateEvidence: visibleSubmission.templateEvidence,
                resultSummary: visibleSubmission.resultSummary,
                artifactUrl: visibleSubmission.artifactUrl,
                hasAttachment: Boolean(visibleSubmission.evidenceObjectKey)
              })
            : null;
          const replyTarget = message.replyToMessageId
            ? replyById.get(message.replyToMessageId)
            : null;
          const replyAvailable = Boolean(
            replyTarget &&
            replyTarget.message.hiddenAt === null &&
            replyTarget.message.deletedAt === null
          );
          const reply = message.replyToMessageId
            ? {
                messageId: message.replyToMessageId,
                available: replyAvailable,
                senderDisplayName: replyAvailable
                  ? replyTarget?.profile?.displayName ??
                    (replyTarget?.message.kind === "system" ? "Pods" : null)
                  : null,
                excerpt: replyAvailable
                  ? replyTarget?.message.kind === "activity"
                    ? "Activity update"
                    : replyTarget?.message.kind === "system"
                      ? "Pods system update"
                      : (replyTarget?.message.body ?? "").slice(0, 120)
                  : "Message unavailable"
              }
            : null;
          return {
            id: message.id,
            sequence: message.sequence,
            kind: message.kind,
            body:
              message.kind === "system"
                ? "Pods activity updated."
                : message.body,
            reply,
            hidden: false,
            pinned: message.pinnedAt !== null,
            createdAt: message.createdAt,
            sender: publicAuthor(profile),
            activity: activity
              ? {
                  occurrenceOrdinal: activity.occurrence.ordinal,
                  localDate: activity.occurrence.localDate,
                  task: activity.commitment.task,
                  deliverableType: activity.commitment.deliverableType,
                  templateId: pod.templateId,
                  state: publicSubmissionState(
                    visibleSubmission?.state ?? null
                  ),
                  submissionId: visibleSubmission?.id ?? null,
                  templateEvidence: visibleProof?.templateEvidence ?? null,
                  resultSummary: visibleProof?.resultSummary ?? null,
                  artifactUrl: visibleProof?.artifactUrl ?? null,
                  supportingImageAvailable:
                    visibleProof?.attachmentAvailable ?? false
                }
              : null,
            reactions: reactionRows
              .filter((reaction) => reaction.messageId === message.id)
              .map(({ code, count }) => ({ code, count }))
          };
        })
      };
    },

    async getPublicSubmissionEvidence(input: {
      podId: string;
      submissionId: string;
    }) {
      const [pod] = await database.select().from(pods).where(eq(pods.id, input.podId));
      if (!eligibleVisitorPod(pod)) return null;
      const [result] = await database
        .select({ submission: submissions })
        .from(submissions)
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .where(
          and(
            eq(submissions.id, input.submissionId),
            eq(occurrences.podId, input.podId)
          )
        );
      if (
        !result ||
        result.submission.state === "draft" ||
        result.submission.proofShareMode !== "public" ||
        !result.submission.evidenceObjectKey
      ) {
        return null;
      }
      const [suppression] = await database
        .select({ id: publicContentSuppressions.id })
        .from(publicContentSuppressions)
        .where(
          and(
            eq(publicContentSuppressions.podId, input.podId),
            eq(publicContentSuppressions.targetKind, "submission"),
            eq(publicContentSuppressions.targetId, input.submissionId),
            isNull(publicContentSuppressions.restoredAt)
          )
        );
      if (suppression) return null;
      return {
        objectKey: result.submission.evidenceObjectKey,
        contentType: result.submission.evidenceContentType ?? "image/webp",
        byteSize: result.submission.evidenceByteSize
      };
    },

    async getPublicPodContributor(input: {
      podId: string;
      handle: string;
    }) {
      const [pod] = await database.select().from(pods).where(eq(pods.id, input.podId));
      if (!eligibleVisitorPod(pod)) return null;
      const [profile] = await database
        .select()
        .from(profiles)
        .where(eq(profiles.handle, input.handle.trim().toLowerCase()));
      if (!profile || !pod) return null;
      const isCreator = pod.creatorUserId === profile.userId;
      const [membership] = isCreator
        ? []
        : await database
            .select({ id: memberships.id })
            .from(memberships)
            .where(
              and(
                eq(memberships.podId, pod.id),
                eq(memberships.userId, profile.userId),
                inArray(memberships.state, ["roster_locked", "active"])
              )
            );
      if (!isCreator && !membership) return null;
      const [counts] = membership
        ? await database
            .select({
              commitmentCount: sql<number>`count(distinct ${occurrenceCommitments.id})::int`,
              submittedProofCount: sql<number>`count(distinct case when ${submissions.state} <> 'draft' then ${submissions.id} end)::int`
            })
            .from(occurrenceCommitments)
            .leftJoin(
              submissions,
              eq(submissions.commitmentId, occurrenceCommitments.id)
            )
            .where(eq(occurrenceCommitments.membershipId, membership.id))
        : [{ commitmentCount: 0, submittedProofCount: 0 }];
      return {
        handle: profile.handle,
        displayName: profile.displayName,
        avatar: profile.avatar,
        profileVisibility: profile.visibility,
        role: isCreator ? "creator" as const : "member" as const,
        commitmentCount: counts?.commitmentCount ?? 0,
        submittedProofCount: counts?.submittedProofCount ?? 0,
        fullProfileAvailable: profile.visibility === "public"
      };
    }
  };
}
