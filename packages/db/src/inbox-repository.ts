import { and, desc, eq, inArray, like } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  applications,
  depositIntents,
  memberships,
  notifications,
  pods,
  submissions,
  transferLegs
} from "./schema";

export function createInboxMethods(database: PodsDatabase) {
  return {
    async listProofReviewNotificationsForUser(userId: string) {
      const rows = await database
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          like(notifications.kind, "proof_review.%")
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(100);
      const podIds = [...new Set(rows.map((row) => row.payload.podId).filter((value): value is string => typeof value === "string"))];
      const podRows = podIds.length > 0
        ? await database.select().from(pods).where(inArray(pods.id, podIds))
        : [];
      const podById = new Map(podRows.map((pod) => [pod.id, pod] as const));
      return rows.flatMap((notification) => {
        const podId = notification.payload.podId;
        const submissionId = notification.payload.submissionId;
        const type = notification.payload.type;
        const recipientRole = notification.payload.recipientRole;
        if (
          typeof podId !== "string" ||
          typeof submissionId !== "string" ||
          typeof type !== "string" ||
          (recipientRole !== "participant" && recipientRole !== "creator")
        ) return [];
        const pod = podById.get(podId);
        if (!pod) return [];
        return [{ notification, pod, submissionId, type, recipientRole }];
      });
    },

    async listInboxTimelineForUser(userId: string) {
      const rows = await database
        .select({
          membership: memberships,
          pod: pods,
          application: applications,
          deposit: depositIntents,
          submission: submissions,
          transferId: transferLegs.id,
          transferType: transferLegs.type,
          transferState: transferLegs.state,
          transferCreatedAt: transferLegs.createdAt,
          transferUpdatedAt: transferLegs.updatedAt,
          transferBroadcastAt: transferLegs.broadcastAt,
          transferConfirmedAt: transferLegs.confirmedAt
        })
        .from(memberships)
        .innerJoin(pods, eq(memberships.podId, pods.id))
        .leftJoin(applications, eq(memberships.applicationId, applications.id))
        .leftJoin(depositIntents, eq(memberships.depositIntentId, depositIntents.id))
        .leftJoin(submissions, eq(submissions.membershipId, memberships.id))
        .leftJoin(transferLegs, eq(transferLegs.membershipId, memberships.id))
        .where(eq(memberships.userId, userId))
        .orderBy(desc(memberships.updatedAt), desc(transferLegs.updatedAt));
      return rows.map((row) => ({
        membership: row.membership,
        pod: row.pod,
        application: row.application,
        deposit: row.deposit,
        submission: row.submission,
        transfer:
          row.transferId &&
          row.transferType &&
          row.transferState &&
          row.transferCreatedAt &&
          row.transferUpdatedAt
            ? {
                id: row.transferId,
                type: row.transferType,
                state: row.transferState,
                createdAt: row.transferCreatedAt,
                updatedAt: row.transferUpdatedAt,
                broadcastAt: row.transferBroadcastAt,
                confirmedAt: row.transferConfirmedAt
              }
            : null
      }));
    }
  };
}
