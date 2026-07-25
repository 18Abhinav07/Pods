import { desc, eq } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  applications,
  depositIntents,
  memberships,
  pods,
  submissions,
  transferLegs
} from "./schema";

export function createInboxMethods(database: PodsDatabase) {
  return {
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
