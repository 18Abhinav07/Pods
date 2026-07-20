import { randomUUID } from "node:crypto";

import { compareFinalizedDeposits, type MembershipState } from "@pods/domain";
import { and, asc, eq, inArray, isNull, lte } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  applications,
  depositIntents,
  invitations,
  ledgerEntries,
  memberships,
  occurrences,
  pods,
  transferLegs
} from "./schema";

type Transaction = Parameters<Parameters<PodsDatabase["transaction"]>[0]>[0];
type Deposit = typeof depositIntents.$inferSelect;
type Membership = typeof memberships.$inferSelect;

async function closeEntryArtifacts(transaction: Transaction, podId: string, now: Date) {
  await transaction
    .update(applications)
    .set({ state: "application_expired", updatedAt: now })
    .where(
      and(
        eq(applications.podId, podId),
        inArray(applications.state, ["applied", "accepted_unfunded"])
      )
    );
  await transaction
    .update(invitations)
    .set({ revokedAt: now })
    .where(and(eq(invitations.podId, podId), isNull(invitations.usedAt)));
  await transaction
    .update(memberships)
    .set({ state: "application_expired", updatedAt: now })
    .where(
      and(
        eq(memberships.podId, podId),
        inArray(memberships.state, ["applied", "accepted_unfunded", "funding_failed"])
      )
    );
  await transaction
    .update(memberships)
    .set({ state: "excluded_at_cutoff", updatedAt: now })
    .where(and(eq(memberships.podId, podId), eq(memberships.state, "deposit_pending")));
}

async function queueDepositRefund(
  transaction: Transaction,
  deposit: Deposit,
  membership: Membership,
  membershipState: Extract<MembershipState, "refund_pending" | "excluded_at_cutoff">,
  now: Date
) {
  const idempotencyKey = `refund:${deposit.id}`;
  const [inserted] = await transaction
    .insert(transferLegs)
    .values({
      id: randomUUID(),
      idempotencyKey,
      podId: deposit.podId,
      membershipId: membership.id,
      depositIntentId: deposit.id,
      type: "refund",
      recipientWallet: deposit.walletAddress,
      amountLuna: deposit.amountLuna,
      network: deposit.network,
      state: "queued",
      rawTransactionHex: null,
      transactionHash: null,
      validityStartHeight: null,
      preparedAt: null,
      broadcastAt: null,
      confirmedAt: null,
      lastAttemptAt: null,
      errorCode: null,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoNothing({ target: transferLegs.idempotencyKey })
    .returning();
  const leg = inserted ?? (await transaction
    .select()
    .from(transferLegs)
    .where(eq(transferLegs.idempotencyKey, idempotencyKey)))[0];
  if (!leg) throw new Error("Refund leg could not be created");

  await transaction
    .insert(ledgerEntries)
    .values({
      id: randomUUID(),
      idempotencyKey: `refund-entitlement:${deposit.id}`,
      podId: deposit.podId,
      membershipId: membership.id,
      depositIntentId: deposit.id,
      movementType: "refund_entitlement",
      debitAccount: `participant_liability:${membership.id}`,
      creditAccount: `refund_liability:${leg.id}`,
      amountLuna: deposit.amountLuna,
      createdAt: now
    })
    .onConflictDoNothing({ target: ledgerEntries.idempotencyKey });
  await transaction
    .update(depositIntents)
    .set({ state: "refund_pending", updatedAt: now })
    .where(eq(depositIntents.id, deposit.id));
  await transaction
    .update(memberships)
    .set({ state: membershipState, updatedAt: now })
    .where(eq(memberships.id, membership.id));
  return leg;
}

async function currentResult(transaction: Transaction, podId: string, podState: string) {
  const included = await transaction
    .select({
      membershipId: memberships.id,
      blockNumber: depositIntents.blockNumber,
      transactionIndex: depositIntents.transactionIndex,
      transactionHash: depositIntents.transactionHash
    })
    .from(memberships)
    .innerJoin(depositIntents, eq(depositIntents.id, memberships.depositIntentId))
    .where(and(eq(memberships.podId, podId), eq(memberships.state, "roster_locked")));
  const refunds = await transaction
    .select({ id: transferLegs.id })
    .from(transferLegs)
    .where(eq(transferLegs.podId, podId))
    .orderBy(asc(transferLegs.createdAt));
  return {
    podId,
    podState,
    includedMembershipIds: included
      .filter(
        (item): item is typeof item & {
          blockNumber: number;
          transactionIndex: number;
          transactionHash: string;
        } =>
          item.blockNumber !== null &&
          item.transactionIndex !== null &&
          item.transactionHash !== null
      )
      .sort(compareFinalizedDeposits)
      .map((item) => item.membershipId),
    refundLegIds: refunds.map((item) => item.id)
  };
}

export function createCutoffMethods(database: PodsDatabase) {
  return {
    async listPodsDueForCutoff(now: Date) {
      return database
        .select({ id: pods.id })
        .from(pods)
        .innerJoin(
          occurrences,
          and(eq(occurrences.podId, pods.id), eq(occurrences.ordinal, 1))
        )
        .where(and(eq(pods.state, "enrollment_open"), lte(occurrences.opensAt, now)))
        .orderBy(asc(occurrences.opensAt), asc(pods.id));
    },

    async applyPodCutoff(input: { podId: string; now: Date }) {
      return database.transaction(async (transaction) => {
        const [pod] = await transaction
          .select()
          .from(pods)
          .where(eq(pods.id, input.podId))
          .for("update");
        if (!pod?.contractData) throw new Error("Published Pod not found");
        if (["locked_scheduled", "cancelled_refunding", "cancelled"].includes(pod.state)) {
          return currentResult(transaction, pod.id, pod.state);
        }
        if (pod.state !== "enrollment_open") {
          throw new Error("Pod is not eligible for cutoff");
        }
        const [firstOccurrence] = await transaction
          .select({ opensAt: occurrences.opensAt })
          .from(occurrences)
          .where(and(eq(occurrences.podId, pod.id), eq(occurrences.ordinal, 1)));
        if (!firstOccurrence || input.now.getTime() < firstOccurrence.opensAt.getTime()) {
          throw new Error("Pod cutoff has not been reached");
        }

        await transaction
          .update(pods)
          .set({ state: "cutoff_evaluating", updatedAt: input.now })
          .where(and(eq(pods.id, pod.id), eq(pods.state, "enrollment_open")));
        await closeEntryArtifacts(transaction, pod.id, input.now);

        const funded = await transaction
          .select({ deposit: depositIntents, membership: memberships })
          .from(depositIntents)
          .innerJoin(memberships, eq(memberships.id, depositIntents.membershipId))
          .where(
            and(
              eq(depositIntents.podId, pod.id),
              eq(depositIntents.state, "credited_provisional")
            )
          )
          .for("update");

        const valid = [] as Array<{ deposit: Deposit; membership: Membership }>;
        for (const candidate of funded) {
          if (
            !candidate.deposit.finalizedAt ||
            candidate.deposit.finalizedAt.getTime() > firstOccurrence.opensAt.getTime()
          ) {
            await transaction
              .update(depositIntents)
              .set({
                state: "exception_review",
                exceptionCode: "finalized_after_cutoff",
                updatedAt: input.now
              })
              .where(eq(depositIntents.id, candidate.deposit.id));
            continue;
          }
          if (
            candidate.deposit.blockNumber === null ||
            candidate.deposit.transactionIndex === null ||
            candidate.deposit.transactionHash === null
          ) {
            throw new Error("Credited deposit is missing finalized chain ordering data");
          }
          valid.push(candidate);
        }
        valid.sort((left, right) =>
          compareFinalizedDeposits(
            {
              blockNumber: left.deposit.blockNumber!,
              transactionIndex: left.deposit.transactionIndex!,
              transactionHash: left.deposit.transactionHash!
            },
            {
              blockNumber: right.deposit.blockNumber!,
              transactionIndex: right.deposit.transactionIndex!,
              transactionHash: right.deposit.transactionHash!
            }
          )
        );

        const minimum = pod.contractData.community.minParticipants;
        const maximum = pod.contractData.community.maxParticipants;
        const included = valid.length >= minimum ? valid.slice(0, maximum) : [];
        const excluded = valid.filter((candidate) => !included.includes(candidate));
        const refundLegIds: string[] = [];

        for (const candidate of included) {
          await transaction
            .update(depositIntents)
            .set({ state: "applied_to_roster", updatedAt: input.now })
            .where(eq(depositIntents.id, candidate.deposit.id));
          await transaction
            .update(memberships)
            .set({ state: "roster_locked", updatedAt: input.now })
            .where(eq(memberships.id, candidate.membership.id));
        }
        for (const candidate of excluded) {
          const leg = await queueDepositRefund(
            transaction,
            candidate.deposit,
            candidate.membership,
            included.length > 0 ? "excluded_at_cutoff" : "refund_pending",
            input.now
          );
          refundLegIds.push(leg.id);
        }

        const podState = included.length > 0 ? "locked_scheduled" : "cancelled_refunding";
        await transaction
          .update(pods)
          .set({ state: podState, updatedAt: input.now })
          .where(eq(pods.id, pod.id));
        return {
          podId: pod.id,
          podState,
          includedMembershipIds: included.map((candidate) => candidate.membership.id),
          refundLegIds
        };
      });
    },

    async cancelEnrollmentPod(input: {
      creatorUserId: string;
      podId: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [pod] = await transaction
          .select()
          .from(pods)
          .where(
            and(eq(pods.id, input.podId), eq(pods.creatorUserId, input.creatorUserId))
          )
          .for("update");
        if (!pod || pod.state !== "enrollment_open") return null;
        await closeEntryArtifacts(transaction, pod.id, input.now);
        const funded = await transaction
          .select({ deposit: depositIntents, membership: memberships })
          .from(depositIntents)
          .innerJoin(memberships, eq(memberships.id, depositIntents.membershipId))
          .where(
            and(
              eq(depositIntents.podId, pod.id),
              eq(depositIntents.state, "credited_provisional")
            )
          )
          .for("update");
        for (const candidate of funded) {
          await queueDepositRefund(
            transaction,
            candidate.deposit,
            candidate.membership,
            "refund_pending",
            input.now
          );
        }
        const state = funded.length > 0 ? "cancelled_refunding" : "cancelled";
        const [cancelled] = await transaction
          .update(pods)
          .set({ state, updatedAt: input.now })
          .where(eq(pods.id, pod.id))
          .returning();
        return cancelled ?? null;
      });
    },

    listTransferLegsForPod(podId: string) {
      return database
        .select()
        .from(transferLegs)
        .where(eq(transferLegs.podId, podId))
        .orderBy(asc(transferLegs.createdAt));
    }
  };
}
