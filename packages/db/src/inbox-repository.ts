import { and, desc, eq } from "drizzle-orm";

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
      return database
        .select({
          membership: memberships,
          pod: pods,
          application: applications,
          deposit: depositIntents,
          transfer: transferLegs,
          submission: submissions
        })
        .from(memberships)
        .innerJoin(pods, eq(memberships.podId, pods.id))
        .leftJoin(applications, eq(memberships.applicationId, applications.id))
        .leftJoin(depositIntents, eq(memberships.depositIntentId, depositIntents.id))
        .leftJoin(submissions, eq(submissions.membershipId, memberships.id))
        .leftJoin(
          transferLegs,
          and(
            eq(transferLegs.membershipId, memberships.id),
            eq(transferLegs.type, "refund")
          )
        )
        .where(eq(memberships.userId, userId))
        .orderBy(desc(memberships.updatedAt), desc(transferLegs.updatedAt));
    }
  };
}
