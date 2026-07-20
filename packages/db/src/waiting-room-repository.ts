import { and, asc, eq, inArray } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  depositIntents,
  memberships,
  occurrences,
  pods,
  transferLegs
} from "./schema";

const waitingRoomStates = [
  "funded_provisional",
  "roster_locked",
  "excluded_at_cutoff",
  "refund_pending",
  "refunded"
] as const;

const confirmedRosterStates = ["funded_provisional", "roster_locked"] as const;

export function createWaitingRoomMethods(database: PodsDatabase) {
  return {
    async getWaitingRoomForUser(input: { userId: string; podId: string }) {
      const [pod] = await database.select().from(pods).where(eq(pods.id, input.podId));
      if (!pod?.contractData || !pod.contractHash || pod.state === "draft") return null;

      const owned = pod.creatorUserId === input.userId;
      const [membership] = await database
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.podId, pod.id), eq(memberships.userId, input.userId))
        );
      if (
        !owned &&
        (!membership || !waitingRoomStates.includes(
          membership.state as (typeof waitingRoomStates)[number]
        ))
      ) {
        return null;
      }

      const [firstOccurrence] = await database
        .select()
        .from(occurrences)
        .where(and(eq(occurrences.podId, pod.id), eq(occurrences.ordinal, 1)));
      if (!firstOccurrence) return null;

      const roster = await database
        .select({ state: memberships.state })
        .from(memberships)
        .where(
          and(
            eq(memberships.podId, pod.id),
            inArray(memberships.state, [...confirmedRosterStates])
          )
        );
      const [deposit] = membership?.depositIntentId
        ? await database
            .select()
            .from(depositIntents)
            .where(eq(depositIntents.id, membership.depositIntentId))
        : [];
      const [refund] = deposit
        ? await database
            .select({
              state: transferLegs.state,
              amountLuna: transferLegs.amountLuna,
              transactionHash: transferLegs.transactionHash,
              confirmedAt: transferLegs.confirmedAt
            })
            .from(transferLegs)
            .where(
              and(
                eq(transferLegs.depositIntentId, deposit.id),
                eq(transferLegs.type, "refund")
              )
            )
            .orderBy(asc(transferLegs.createdAt))
            .limit(1)
        : [];

      return {
        pod,
        viewerRole: owned ? ("creator" as const) : ("participant" as const),
        membership: membership ?? null,
        deposit: deposit ?? null,
        refund: refund ?? null,
        firstOccurrence,
        confirmedParticipants: roster.length
      };
    },

    async getFundingOverviewForCreator(input: {
      creatorUserId: string;
      podId: string;
    }) {
      const [pod] = await database
        .select()
        .from(pods)
        .where(
          and(eq(pods.id, input.podId), eq(pods.creatorUserId, input.creatorUserId))
        );
      if (!pod?.contractData || !pod.contractHash || pod.state === "draft") return null;
      const [firstOccurrence] = await database
        .select()
        .from(occurrences)
        .where(and(eq(occurrences.podId, pod.id), eq(occurrences.ordinal, 1)));
      if (!firstOccurrence) return null;

      const participantRows = await database
        .select({
          id: memberships.id,
          admissionSource: memberships.admissionSource,
          state: memberships.state,
          createdAt: memberships.createdAt
        })
        .from(memberships)
        .where(eq(memberships.podId, pod.id))
        .orderBy(asc(memberships.createdAt), asc(memberships.id));
      const confirmedParticipants = participantRows.filter((row) =>
        confirmedRosterStates.includes(
          row.state as (typeof confirmedRosterStates)[number]
        )
      ).length;

      return {
        pod,
        firstOccurrence,
        confirmedParticipants,
        participants: participantRows.map((row, index) => ({
          id: row.id,
          label: `Participant ${String(index + 1).padStart(2, "0")}`,
          admissionSource: row.admissionSource,
          state: row.state
        }))
      };
    }
  };
}
