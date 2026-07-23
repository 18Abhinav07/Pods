import { randomUUID } from "node:crypto";

import {
  isPublicVisitorContract,
  type PublicModerationAction,
  type PublicReportState,
  type PublicReportTargetKind,
  type ReportReason
} from "@pods/domain";
import { and, desc, eq, isNull, lt, ne, sql } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  conversations,
  messages,
  occurrences,
  pods,
  publicContentReports,
  publicContentSuppressions,
  publicModerationActions,
  publicRateLimitBuckets,
  submissions
} from "./schema";

const publicRoomStates = [
  "locked_scheduled",
  "active",
  "final_review",
  "completed"
] as const;

async function assertReportableTarget(
  database: PodsDatabase,
  input: {
    podId: string;
    targetKind: PublicReportTargetKind;
    targetId: string;
  }
) {
  const [pod] = await database.select().from(pods).where(eq(pods.id, input.podId));
  if (
    !pod?.contractData ||
    !isPublicVisitorContract(pod.contractData) ||
    pod.publicRoomSuspendedAt !== null ||
    !publicRoomStates.includes(pod.state as (typeof publicRoomStates)[number])
  ) {
    throw new Error("Public content not found");
  }
  if (input.targetKind === "message") {
    const [target] = await database
      .select({ id: messages.id, kind: messages.kind })
      .from(messages)
      .innerJoin(
        conversations,
        eq(messages.conversationId, conversations.id)
      )
      .where(
        and(
          eq(messages.id, input.targetId),
          eq(conversations.kind, "pod"),
          eq(conversations.podId, input.podId),
          ne(messages.kind, "system")
        )
      );
    if (!target) throw new Error("Public content not found");
    return;
  }
  const [target] = await database
    .select({ id: submissions.id })
    .from(submissions)
    .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
    .where(
      and(
        eq(submissions.id, input.targetId),
        eq(occurrences.podId, input.podId),
        ne(submissions.state, "draft"),
        eq(submissions.proofShareMode, "public")
      )
    );
  if (!target) throw new Error("Public content not found");
}

export function createPublicSafetyMethods(database: PodsDatabase) {
  return {
    async reportPublicContent(input: {
      reporterUserId: string;
      podId: string;
      targetKind: PublicReportTargetKind;
      targetId: string;
      reason: ReportReason;
      details: string;
      now: Date;
    }) {
      await assertReportableTarget(database, input);
      const [report] = await database
        .insert(publicContentReports)
        .values({
          id: randomUUID(),
          reporterUserId: input.reporterUserId,
          podId: input.podId,
          targetKind: input.targetKind,
          targetId: input.targetId,
          reason: input.reason,
          details: input.details,
          state: "pending",
          resolvedAt: null,
          createdAt: input.now,
          updatedAt: input.now
        })
        .returning();
      if (!report) throw new Error("Report could not be saved");
      return report;
    },

    async listPublicSafetyReports(input: { state?: PublicReportState } = {}) {
      return database
        .select()
        .from(publicContentReports)
        .where(
          input.state
            ? eq(publicContentReports.state, input.state)
            : undefined
        )
        .orderBy(desc(publicContentReports.createdAt));
    },

    async moderatePublicReport(input: {
      reportId: string;
      action: PublicModerationAction;
      actor: string;
      reason: string;
      now: Date;
    }) {
      if (input.reason.trim().length < 5 || input.reason.trim().length > 1000) {
        throw new Error("Moderation reason must contain 5 to 1000 characters");
      }
      return database.transaction(async (transaction) => {
        const [report] = await transaction
          .select()
          .from(publicContentReports)
          .where(eq(publicContentReports.id, input.reportId))
          .for("update");
        if (!report) throw new Error("Public report not found");

        if (input.action === "suppress_content") {
          await transaction
            .insert(publicContentSuppressions)
            .values({
              id: randomUUID(),
              podId: report.podId,
              targetKind: report.targetKind,
              targetId: report.targetId,
              reason: input.reason.trim(),
              actionedBy: input.actor,
              restoredAt: null,
              createdAt: input.now
            })
            .onConflictDoUpdate({
              target: [
                publicContentSuppressions.podId,
                publicContentSuppressions.targetKind,
                publicContentSuppressions.targetId
              ],
              set: {
                reason: input.reason.trim(),
                actionedBy: input.actor,
                restoredAt: null,
                createdAt: input.now
              }
            });
        } else if (input.action === "restore_content") {
          const restored = await transaction
            .update(publicContentSuppressions)
            .set({ restoredAt: input.now })
            .where(
              and(
                eq(publicContentSuppressions.podId, report.podId),
                eq(publicContentSuppressions.targetKind, report.targetKind),
                eq(publicContentSuppressions.targetId, report.targetId),
                isNull(publicContentSuppressions.restoredAt)
              )
            )
            .returning({ id: publicContentSuppressions.id });
          if (restored.length === 0) throw new Error("Public content is not suppressed");
        } else if (input.action === "suspend_room") {
          await transaction
            .update(pods)
            .set({ publicRoomSuspendedAt: input.now, updatedAt: input.now })
            .where(eq(pods.id, report.podId));
        } else if (input.action === "restore_room") {
          await transaction
            .update(pods)
            .set({ publicRoomSuspendedAt: null, updatedAt: input.now })
            .where(eq(pods.id, report.podId));
        }

        const nextState: PublicReportState =
          input.action === "dismiss_report" ? "dismissed" : "resolved";
        await transaction
          .update(publicContentReports)
          .set({
            state: nextState,
            resolvedAt: input.now,
            updatedAt: input.now
          })
          .where(eq(publicContentReports.id, report.id));
        const [action] = await transaction
          .insert(publicModerationActions)
          .values({
            id: randomUUID(),
            reportId: report.id,
            podId: report.podId,
            targetKind: report.targetKind,
            targetId: report.targetId,
            action: input.action,
            actor: input.actor,
            reason: input.reason.trim(),
            createdAt: input.now
          })
          .returning();
        if (!action) throw new Error("Moderation action could not be recorded");
        return action;
      });
    },

    async listPublicModerationActions(
      input: { podId?: string; limit?: number } = {}
    ) {
      return database
        .select()
        .from(publicModerationActions)
        .where(
          input.podId
            ? eq(publicModerationActions.podId, input.podId)
            : undefined
        )
        .orderBy(desc(publicModerationActions.createdAt))
        .limit(Math.min(Math.max(input.limit ?? 100, 1), 200));
    },

    async consumePublicRateLimit(input: {
      bucketKey: string;
      action: string;
      now: Date;
      windowMs: number;
      limit: number;
    }) {
      const windowMs = Math.max(Math.floor(input.windowMs), 1_000);
      const limit = Math.max(Math.floor(input.limit), 1);
      const windowStart = new Date(
        Math.floor(input.now.getTime() / windowMs) * windowMs
      );
      const resetAt = new Date(windowStart.getTime() + windowMs);
      const id = `${input.action}:${input.bucketKey}:${windowStart.getTime()}`;
      await database
        .delete(publicRateLimitBuckets)
        .where(
          and(
            eq(publicRateLimitBuckets.bucketKey, input.bucketKey),
            eq(publicRateLimitBuckets.action, input.action),
            lt(publicRateLimitBuckets.expiresAt, input.now)
          )
        );
      const [bucket] = await database
        .insert(publicRateLimitBuckets)
        .values({
          id,
          bucketKey: input.bucketKey,
          action: input.action,
          windowStart,
          count: 1,
          expiresAt: resetAt,
          updatedAt: input.now
        })
        .onConflictDoUpdate({
          target: publicRateLimitBuckets.id,
          set: {
            count: sql`${publicRateLimitBuckets.count} + 1`,
            updatedAt: input.now
          }
        })
        .returning({ count: publicRateLimitBuckets.count });
      const count = bucket?.count ?? limit + 1;
      return {
        allowed: count <= limit,
        remaining: Math.max(limit - count, 0),
        resetAt
      };
    }
  };
}
