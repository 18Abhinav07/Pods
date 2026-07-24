import { randomUUID } from "node:crypto";

import type {
  TransferAttemptState,
  TransferLegState
} from "@pods/domain";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  ne,
  notInArray
} from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  conversations,
  depositIntents,
  ledgerEntries,
  memberships,
  pods,
  realtimeEvents,
  settlementEntitlements,
  settlementRuns,
  transferAttempts,
  transferEvents,
  transferLegs
} from "./schema";

const openRefundStates = ["queued", "prepared", "broadcast", "unknown"] as const;
const openPayoutStates = ["queued", "prepared", "broadcast", "unknown"] as const;
const openPayoutAttemptStates = ["prepared", "broadcast", "unknown"] as const;
type PayoutOperationsState =
  | "unknown"
  | "retryable_failed"
  | "mismatched"
  | "late"
  | "manual_review";

function payoutDataReference(legId: string, sequence: number) {
  return `pods:payout:${legId}:${sequence}`;
}

export function createTransferMethods(database: PodsDatabase) {
  async function transitionPayoutAttempt(input: {
    legId: string;
    attemptId: string;
    state: Exclude<TransferAttemptState, "prepared" | "confirmed">;
    reason: string;
    errorCode?: string | null;
    now: Date;
  }) {
    return database.transaction(async (transaction) => {
      const [leg] = await transaction
        .select()
        .from(transferLegs)
        .where(
          and(
            eq(transferLegs.id, input.legId),
            eq(transferLegs.type, "payout")
          )
        )
        .for("update");
      if (!leg || !openPayoutStates.includes(leg.state as typeof openPayoutStates[number])) {
        return null;
      }
      const [attempt] = await transaction
        .select()
        .from(transferAttempts)
        .where(
          and(
            eq(transferAttempts.id, input.attemptId),
            eq(transferAttempts.transferLegId, leg.id)
          )
        )
        .for("update");
      if (
        !attempt ||
        !openPayoutAttemptStates.includes(
          attempt.state as typeof openPayoutAttemptStates[number]
        )
      ) {
        return null;
      }

      const [updatedAttempt] = await transaction
        .update(transferAttempts)
        .set({
          state: input.state,
          lastCheckedAt: input.now,
          errorCode: input.errorCode ?? null,
          updatedAt: input.now
        })
        .where(eq(transferAttempts.id, attempt.id))
        .returning();
      if (!updatedAttempt) return null;
      const [updatedLeg] = await transaction
        .update(transferLegs)
        .set({
          state: input.state as TransferLegState,
          lastAttemptAt: input.now,
          errorCode: input.errorCode ?? null,
          updatedAt: input.now
        })
        .where(eq(transferLegs.id, leg.id))
        .returning();
      if (!updatedLeg) throw new Error("Payout attempt lost its transfer leg");
      await transaction.insert(transferEvents).values({
        id: randomUUID(),
        transferLegId: leg.id,
        transferAttemptId: attempt.id,
        actor: "worker",
        fromState: leg.state,
        toState: input.state,
        reason: input.reason,
        createdAt: input.now
      });
      return updatedLeg;
    });
  }

  return {
    listOpenRefundTransferLegs() {
      return database
        .select()
        .from(transferLegs)
        .where(
          and(
            eq(transferLegs.type, "refund"),
            inArray(transferLegs.state, [...openRefundStates])
          )
        )
        .orderBy(asc(transferLegs.createdAt), asc(transferLegs.id));
    },

    async listOpenPayoutTransferLegs() {
      const legs = await database
        .select()
        .from(transferLegs)
        .where(
          and(
            eq(transferLegs.type, "payout"),
            inArray(transferLegs.state, [...openPayoutStates])
          )
        )
        .orderBy(asc(transferLegs.createdAt), asc(transferLegs.id));

      return Promise.all(
        legs.map(async (leg) => {
          const [attempt] = await database
            .select()
            .from(transferAttempts)
            .where(eq(transferAttempts.transferLegId, leg.id))
            .orderBy(desc(transferAttempts.sequence))
            .limit(1);
          return { ...leg, attempt: attempt ?? null };
        })
      );
    },

    async listPayoutTransferOperations(input: {
      states: readonly PayoutOperationsState[];
      limit: number;
    }) {
      if (input.states.length === 0) return [];
      const safeLimit = Math.max(1, Math.min(100, Math.trunc(input.limit)));
      const legs = await database
        .select({
          id: transferLegs.id,
          podId: transferLegs.podId,
          contractData: pods.contractData,
          amountLuna: transferLegs.amountLuna,
          network: transferLegs.network,
          state: transferLegs.state,
          errorCode: transferLegs.errorCode,
          updatedAt: transferLegs.updatedAt
        })
        .from(transferLegs)
        .innerJoin(pods, eq(pods.id, transferLegs.podId))
        .where(
          and(
            eq(transferLegs.type, "payout"),
            inArray(transferLegs.state, [...input.states])
          )
        )
        .orderBy(desc(transferLegs.updatedAt), asc(transferLegs.id))
        .limit(safeLimit);

      return Promise.all(
        legs.map(async ({ contractData, ...leg }) => {
          const [attempt] = await database
            .select({
              id: transferAttempts.id,
              sequence: transferAttempts.sequence,
              state: transferAttempts.state,
              transactionHash: transferAttempts.transactionHash,
              validityStartHeight: transferAttempts.validityStartHeight,
              lastCheckedAt: transferAttempts.lastCheckedAt
            })
            .from(transferAttempts)
            .where(eq(transferAttempts.transferLegId, leg.id))
            .orderBy(desc(transferAttempts.sequence))
            .limit(1);
          return {
            ...leg,
            podName: contractData?.activity.name ?? "Untitled Pod",
            attempt: attempt ?? null
          };
        })
      );
    },

    async getPayoutRetryCandidate(legId: string) {
      const [leg] = await database
        .select({
          id: transferLegs.id,
          state: transferLegs.state
        })
        .from(transferLegs)
        .where(
          and(
            eq(transferLegs.id, legId),
            eq(transferLegs.type, "payout"),
            inArray(transferLegs.state, ["retryable_failed", "late"])
          )
        );
      if (!leg) return null;
      const [attempt] = await database
        .select({
          id: transferAttempts.id,
          state: transferAttempts.state,
          transactionHash: transferAttempts.transactionHash,
          validityStartHeight: transferAttempts.validityStartHeight
        })
        .from(transferAttempts)
        .where(eq(transferAttempts.transferLegId, leg.id))
        .orderBy(desc(transferAttempts.sequence))
        .limit(1);
      if (
        !attempt ||
        attempt.state !== leg.state ||
        !["retryable_failed", "late"].includes(attempt.state)
      ) {
        return null;
      }
      return { ...leg, attempt };
    },

    async persistPayoutTransferAttempt(input: {
      legId: string;
      dataReference: string;
      rawTransactionHex: string;
      transactionHash: string;
      validityStartHeight: number;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [leg] = await transaction
          .select()
          .from(transferLegs)
          .where(
            and(
              eq(transferLegs.id, input.legId),
              eq(transferLegs.type, "payout")
            )
          )
          .for("update");
        if (!leg) return null;

        const [existing] = await transaction
          .select()
          .from(transferAttempts)
          .where(eq(transferAttempts.transferLegId, leg.id))
          .orderBy(desc(transferAttempts.sequence))
          .limit(1);
        if (existing && leg.state !== "queued") {
          return { ...leg, attempt: existing };
        }
        if (leg.state !== "queued") {
          throw new Error("Only a queued payout can create its first attempt");
        }

        if (
          existing &&
          !["retryable_failed", "late"].includes(existing.state)
        ) {
          throw new Error("The prior payout attempt is not safe to replace");
        }
        const sequence = (existing?.sequence ?? 0) + 1;
        if (input.dataReference !== payoutDataReference(leg.id, sequence)) {
          throw new Error("Payout attempt reference does not match its transfer leg");
        }
        const attemptId = randomUUID();
        const [attempt] = await transaction
          .insert(transferAttempts)
          .values({
            id: attemptId,
            transferLegId: leg.id,
            sequence,
            state: "prepared",
            dataReference: input.dataReference,
            rawTransactionHex: input.rawTransactionHex,
            transactionHash: input.transactionHash,
            validityStartHeight: input.validityStartHeight,
            preparedAt: input.now,
            broadcastAt: null,
            confirmedAt: null,
            lastCheckedAt: null,
            errorCode: null,
            createdAt: input.now,
            updatedAt: input.now
          })
          .returning();
        if (!attempt) throw new Error("Payout attempt could not be persisted");

        const [prepared] = await transaction
          .update(transferLegs)
          .set({
            state: "prepared",
            rawTransactionHex: input.rawTransactionHex,
            transactionHash: input.transactionHash,
            validityStartHeight: input.validityStartHeight,
            preparedAt: input.now,
            lastAttemptAt: input.now,
            errorCode: null,
            updatedAt: input.now
          })
          .where(
            and(
              eq(transferLegs.id, leg.id),
              eq(transferLegs.state, "queued")
            )
          )
          .returning();
        if (!prepared) throw new Error("Payout transfer state changed");

        await transaction.insert(transferEvents).values({
          id: randomUUID(),
          transferLegId: leg.id,
          transferAttemptId: attempt.id,
          actor: "worker",
          fromState: "queued",
          toState: "prepared",
          reason: "attempt_prepared",
          createdAt: input.now
        });
        return { ...prepared, attempt };
      });
    },

    async requestPayoutRetry(input: {
      legId: string;
      attemptId: string;
      actor: string;
      reason: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [leg] = await transaction
          .select()
          .from(transferLegs)
          .where(
            and(
              eq(transferLegs.id, input.legId),
              eq(transferLegs.type, "payout")
            )
          )
          .for("update");
        if (
          !leg ||
          !["retryable_failed", "late"].includes(leg.state)
        ) {
          throw new Error("Payout is not eligible for a replacement attempt");
        }
        const [attempt] = await transaction
          .select()
          .from(transferAttempts)
          .where(
            and(
              eq(transferAttempts.id, input.attemptId),
              eq(transferAttempts.transferLegId, leg.id)
            )
          )
          .for("update");
        if (
          !attempt ||
          attempt.state !== leg.state ||
          !["retryable_failed", "late"].includes(attempt.state)
        ) {
          throw new Error("Payout retry does not match the terminal attempt");
        }
        const [latest] = await transaction
          .select({ id: transferAttempts.id })
          .from(transferAttempts)
          .where(eq(transferAttempts.transferLegId, leg.id))
          .orderBy(desc(transferAttempts.sequence))
          .limit(1);
        if (latest?.id !== attempt.id) {
          throw new Error("Only the latest payout attempt can be replaced");
        }
        const [queued] = await transaction
          .update(transferLegs)
          .set({
            state: "queued",
            rawTransactionHex: null,
            transactionHash: null,
            validityStartHeight: null,
            preparedAt: null,
            broadcastAt: null,
            confirmedAt: null,
            lastAttemptAt: input.now,
            errorCode: null,
            updatedAt: input.now
          })
          .where(
            and(
              eq(transferLegs.id, leg.id),
              eq(transferLegs.state, leg.state)
            )
          )
          .returning();
        if (!queued) throw new Error("Payout retry state changed");
        await transaction.insert(transferEvents).values({
          id: randomUUID(),
          transferLegId: leg.id,
          transferAttemptId: attempt.id,
          actor: "operations",
          fromState: leg.state,
          toState: "queued",
          reason: `${input.actor}: ${input.reason}`,
          createdAt: input.now
        });
        return queued;
      });
    },

    async claimPayoutBroadcast(input: {
      legId: string;
      attemptId: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [leg] = await transaction
          .select()
          .from(transferLegs)
          .where(
            and(
              eq(transferLegs.id, input.legId),
              eq(transferLegs.type, "payout")
            )
          )
          .for("update");
        if (!leg || leg.state !== "prepared") return false;

        const [attempt] = await transaction
          .select()
          .from(transferAttempts)
          .where(
            and(
              eq(transferAttempts.id, input.attemptId),
              eq(transferAttempts.transferLegId, leg.id)
            )
          )
          .for("update");
        if (!attempt || attempt.state !== "prepared") return false;

        const [claimedAttempt] = await transaction
          .update(transferAttempts)
          .set({
            state: "unknown",
            lastCheckedAt: input.now,
            errorCode: "broadcast_in_progress",
            updatedAt: input.now
          })
          .where(
            and(
              eq(transferAttempts.id, attempt.id),
              eq(transferAttempts.state, "prepared")
            )
          )
          .returning();
        if (!claimedAttempt) return false;

        const [claimedLeg] = await transaction
          .update(transferLegs)
          .set({
            state: "unknown",
            lastAttemptAt: input.now,
            errorCode: "broadcast_in_progress",
            updatedAt: input.now
          })
          .where(
            and(
              eq(transferLegs.id, leg.id),
              eq(transferLegs.state, "prepared")
            )
          )
          .returning();
        if (!claimedLeg) throw new Error("Payout broadcast claim lost its leg");

        await transaction.insert(transferEvents).values({
          id: randomUUID(),
          transferLegId: leg.id,
          transferAttemptId: attempt.id,
          actor: "worker",
          fromState: "prepared",
          toState: "unknown",
          reason: "broadcast_claimed",
          createdAt: input.now
        });
        return true;
      });
    },

    async markPayoutTransferBroadcast(input: {
      legId: string;
      attemptId: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [attempt] = await transaction
          .update(transferAttempts)
          .set({
            state: "broadcast",
            broadcastAt: input.now,
            lastCheckedAt: input.now,
            errorCode: null,
            updatedAt: input.now
          })
          .where(
            and(
              eq(transferAttempts.id, input.attemptId),
              eq(transferAttempts.transferLegId, input.legId),
              eq(transferAttempts.state, "unknown")
            )
          )
          .returning();
        if (!attempt) return null;
        const [leg] = await transaction
          .update(transferLegs)
          .set({
            state: "broadcast",
            broadcastAt: input.now,
            lastAttemptAt: input.now,
            errorCode: null,
            updatedAt: input.now
          })
          .where(
            and(
              eq(transferLegs.id, input.legId),
              eq(transferLegs.type, "payout"),
              eq(transferLegs.state, "unknown")
            )
          )
          .returning();
        if (!leg) throw new Error("Payout broadcast lost its transfer leg");
        await transaction.insert(transferEvents).values({
          id: randomUUID(),
          transferLegId: leg.id,
          transferAttemptId: attempt.id,
          actor: "worker",
          fromState: "unknown",
          toState: "broadcast",
          reason: "broadcast_submitted",
          createdAt: input.now
        });
        return leg;
      });
    },

    markPayoutTransferUnknown(input: {
      legId: string;
      attemptId: string;
      errorCode: string;
      now: Date;
    }) {
      return transitionPayoutAttempt({
        ...input,
        state: "unknown",
        reason: input.errorCode
      });
    },

    markPayoutTransferRetryableFailed(input: {
      legId: string;
      attemptId: string;
      errorCode: string;
      now: Date;
    }) {
      return transitionPayoutAttempt({
        ...input,
        state: "retryable_failed",
        reason: input.errorCode
      });
    },

    markPayoutTransferMismatched(input: {
      legId: string;
      attemptId: string;
      errorCode: string;
      now: Date;
    }) {
      return transitionPayoutAttempt({
        ...input,
        state: "mismatched",
        reason: input.errorCode
      });
    },

    markPayoutTransferLate(input: {
      legId: string;
      attemptId: string;
      now: Date;
    }) {
      return transitionPayoutAttempt({
        ...input,
        state: "late",
        reason: "validity_window_expired",
        errorCode: "validity_window_expired"
      });
    },

    async markPayoutTransferChecked(input: {
      legId: string;
      attemptId: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [attempt] = await transaction
          .update(transferAttempts)
          .set({ lastCheckedAt: input.now, updatedAt: input.now })
          .where(
            and(
              eq(transferAttempts.id, input.attemptId),
              eq(transferAttempts.transferLegId, input.legId),
              inArray(transferAttempts.state, [...openPayoutAttemptStates])
            )
          )
          .returning();
        if (!attempt) return null;
        const [leg] = await transaction
          .update(transferLegs)
          .set({ lastAttemptAt: input.now, updatedAt: input.now })
          .where(
            and(
              eq(transferLegs.id, input.legId),
              eq(transferLegs.type, "payout"),
              inArray(transferLegs.state, [...openPayoutStates])
            )
          )
          .returning();
        return leg ?? null;
      });
    },

    async confirmPayoutTransfer(input: {
      legId: string;
      attemptId: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [leg] = await transaction
          .select()
          .from(transferLegs)
          .where(
            and(
              eq(transferLegs.id, input.legId),
              eq(transferLegs.type, "payout")
            )
          )
          .for("update");
        if (!leg || !leg.settlementEntitlementId) return null;
        if (leg.state === "confirmed") return leg;
        if (
          !openPayoutStates.includes(
            leg.state as typeof openPayoutStates[number]
          )
        ) {
          throw new Error("Payout transfer is not eligible for confirmation");
        }
        const [attempt] = await transaction
          .select()
          .from(transferAttempts)
          .where(
            and(
              eq(transferAttempts.id, input.attemptId),
              eq(transferAttempts.transferLegId, leg.id)
            )
          )
          .for("update");
        if (
          !attempt ||
          !openPayoutAttemptStates.includes(
            attempt.state as typeof openPayoutAttemptStates[number]
          )
        ) {
          throw new Error("Payout attempt is not eligible for confirmation");
        }
        const [entitlement] = await transaction
          .select()
          .from(settlementEntitlements)
          .where(eq(settlementEntitlements.id, leg.settlementEntitlementId))
          .for("update");
        if (!entitlement || entitlement.payoutLuna !== leg.amountLuna) {
          throw new Error("Payout entitlement does not match its transfer leg");
        }

        await transaction
          .insert(ledgerEntries)
          .values({
            id: randomUUID(),
            idempotencyKey: `payout-confirmed:${leg.id}`,
            podId: leg.podId,
            membershipId: leg.membershipId,
            depositIntentId: leg.depositIntentId,
            movementType: "payout_confirmed",
            debitAccount:
              `payout_liability:${entitlement.settlementRunId}:${leg.membershipId}`,
            creditAccount: `treasury_asset:${leg.network}`,
            amountLuna: leg.amountLuna,
            createdAt: input.now
          })
          .onConflictDoNothing({ target: ledgerEntries.idempotencyKey });
        await transaction
          .update(transferAttempts)
          .set({
            state: "confirmed",
            confirmedAt: input.now,
            lastCheckedAt: input.now,
            errorCode: null,
            updatedAt: input.now
          })
          .where(eq(transferAttempts.id, attempt.id));
        await transaction
          .update(settlementEntitlements)
          .set({ state: "transfer_confirmed", updatedAt: input.now })
          .where(eq(settlementEntitlements.id, entitlement.id));
        const [confirmed] = await transaction
          .update(transferLegs)
          .set({
            state: "confirmed",
            confirmedAt: input.now,
            lastAttemptAt: input.now,
            errorCode: null,
            updatedAt: input.now
          })
          .where(eq(transferLegs.id, leg.id))
          .returning();
        if (!confirmed) throw new Error("Payout transfer state changed");
        await transaction.insert(transferEvents).values({
          id: randomUUID(),
          transferLegId: leg.id,
          transferAttemptId: attempt.id,
          actor: "worker",
          fromState: leg.state,
          toState: "confirmed",
          reason: "chain_finalized",
          createdAt: input.now
        });

        const [unresolved] = await transaction
          .select({ id: settlementEntitlements.id })
          .from(settlementEntitlements)
          .where(
            and(
              eq(
                settlementEntitlements.settlementRunId,
                entitlement.settlementRunId
              ),
              notInArray(settlementEntitlements.state, [
                "transfer_confirmed",
                "no_transfer_required"
              ])
            )
          )
          .limit(1);
        if (!unresolved) {
          const [settled] = await transaction
            .update(settlementRuns)
            .set({
              state: "settled",
              settledAt: input.now,
              updatedAt: input.now
            })
            .where(
              and(
                eq(settlementRuns.id, entitlement.settlementRunId),
                eq(settlementRuns.state, "executing")
              )
            )
            .returning();
          if (settled) {
            await transaction
              .update(pods)
              .set({
                state: "completed",
                completedAt: input.now,
                updatedAt: input.now
              })
              .where(
                and(
                  eq(pods.id, settled.podId),
                  eq(pods.state, "final_review")
                )
              );
            const [conversation] = await transaction
              .select({ id: conversations.id })
              .from(conversations)
              .where(
                and(
                  eq(conversations.podId, settled.podId),
                  eq(conversations.kind, "pod")
                )
              );
            if (conversation) {
              await transaction.insert(realtimeEvents).values({
                conversationId: conversation.id,
                recipientUserId: null,
                kind: "pod.completed",
                payload: { podId: settled.podId },
                createdAt: input.now
              });
            }
          }
        }
        return confirmed;
      });
    },

    async markRefundTransferPrepared(input: {
      legId: string;
      rawTransactionHex: string;
      transactionHash: string;
      validityStartHeight: number;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [leg] = await transaction
          .select()
          .from(transferLegs)
          .where(and(eq(transferLegs.id, input.legId), eq(transferLegs.type, "refund")))
          .for("update");
        if (!leg) return null;
        if (leg.state === "prepared") {
          if (
            leg.rawTransactionHex !== input.rawTransactionHex ||
            leg.transactionHash !== input.transactionHash ||
            leg.validityStartHeight !== input.validityStartHeight
          ) {
            throw new Error("Prepared refund bytes are immutable");
          }
          return leg;
        }
        if (leg.state !== "queued") {
          throw new Error("Only a queued refund can be prepared");
        }
        const [prepared] = await transaction
          .update(transferLegs)
          .set({
            state: "prepared",
            rawTransactionHex: input.rawTransactionHex,
            transactionHash: input.transactionHash,
            validityStartHeight: input.validityStartHeight,
            preparedAt: input.now,
            lastAttemptAt: input.now,
            errorCode: null,
            updatedAt: input.now
          })
          .where(and(eq(transferLegs.id, leg.id), eq(transferLegs.state, "queued")))
          .returning();
        if (!prepared) throw new Error("Refund transfer state changed");
        return prepared;
      });
    },

    async markRefundTransferBroadcast(input: { legId: string; now: Date }) {
      return database.transaction(async (transaction) => {
        const [leg] = await transaction
          .select()
          .from(transferLegs)
          .where(and(eq(transferLegs.id, input.legId), eq(transferLegs.type, "refund")))
          .for("update");
        if (!leg) return null;
        if (leg.state === "broadcast") return leg;
        if (leg.state !== "prepared") {
          throw new Error("Only a prepared refund can be marked broadcast");
        }
        const [updated] = await transaction
          .update(transferLegs)
          .set({
            state: "broadcast",
            broadcastAt: input.now,
            lastAttemptAt: input.now,
            errorCode: null,
            updatedAt: input.now
          })
          .where(and(eq(transferLegs.id, leg.id), eq(transferLegs.state, "prepared")))
          .returning();
        if (!updated) throw new Error("Refund transfer state changed");
        return updated;
      });
    },

    async markRefundTransferUnknown(input: {
      legId: string;
      errorCode: string;
      now: Date;
    }) {
      const [updated] = await database
        .update(transferLegs)
        .set({
          state: "unknown",
          lastAttemptAt: input.now,
          errorCode: input.errorCode,
          updatedAt: input.now
        })
        .where(
          and(
            eq(transferLegs.id, input.legId),
            eq(transferLegs.type, "refund"),
            inArray(transferLegs.state, ["prepared", "broadcast", "unknown"])
          )
        )
        .returning();
      return updated ?? null;
    },

    async markRefundTransferRetryableFailed(input: {
      legId: string;
      errorCode: string;
      now: Date;
    }) {
      const [updated] = await database
        .update(transferLegs)
        .set({
          state: "retryable_failed",
          lastAttemptAt: input.now,
          errorCode: input.errorCode,
          updatedAt: input.now
        })
        .where(
          and(
            eq(transferLegs.id, input.legId),
            eq(transferLegs.type, "refund"),
            inArray(transferLegs.state, ["prepared", "broadcast", "unknown"])
          )
        )
        .returning();
      return updated ?? null;
    },

    async markRefundTransferMismatched(input: {
      legId: string;
      errorCode: string;
      now: Date;
    }) {
      const [updated] = await database
        .update(transferLegs)
        .set({
          state: "mismatched",
          lastAttemptAt: input.now,
          errorCode: input.errorCode,
          updatedAt: input.now
        })
        .where(
          and(
            eq(transferLegs.id, input.legId),
            eq(transferLegs.type, "refund"),
            inArray(transferLegs.state, ["prepared", "broadcast", "unknown"])
          )
        )
        .returning();
      return updated ?? null;
    },

    async confirmRefundTransfer(input: { legId: string; now: Date }) {
      return database.transaction(async (transaction) => {
        const [leg] = await transaction
          .select()
          .from(transferLegs)
          .where(and(eq(transferLegs.id, input.legId), eq(transferLegs.type, "refund")))
          .for("update");
        if (!leg) return null;
        if (leg.state === "confirmed") return leg;
        if (!["prepared", "broadcast", "unknown"].includes(leg.state)) {
          throw new Error("Refund transfer is not eligible for confirmation");
        }

        await transaction
          .insert(ledgerEntries)
          .values({
            id: randomUUID(),
            idempotencyKey: `refund-confirmed:${leg.id}`,
            podId: leg.podId,
            membershipId: leg.membershipId,
            depositIntentId: leg.depositIntentId,
            movementType: "refund_confirmed",
            debitAccount: `refund_liability:${leg.id}`,
            creditAccount: `treasury_asset:${leg.network}`,
            amountLuna: leg.amountLuna,
            createdAt: input.now
          })
          .onConflictDoNothing({ target: ledgerEntries.idempotencyKey });
        await transaction
          .update(depositIntents)
          .set({ state: "refunded", updatedAt: input.now })
          .where(
            and(
              eq(depositIntents.id, leg.depositIntentId),
              eq(depositIntents.state, "refund_pending")
            )
          );
        await transaction
          .update(memberships)
          .set({ state: "refunded", updatedAt: input.now })
          .where(
            and(
              eq(memberships.id, leg.membershipId),
              inArray(memberships.state, ["refund_pending", "excluded_at_cutoff"])
            )
          );
        const [confirmed] = await transaction
          .update(transferLegs)
          .set({
            state: "confirmed",
            confirmedAt: input.now,
            lastAttemptAt: input.now,
            errorCode: null,
            updatedAt: input.now
          })
          .where(and(eq(transferLegs.id, leg.id), ne(transferLegs.state, "confirmed")))
          .returning();
        if (!confirmed) throw new Error("Refund transfer state changed");

        const [unresolved] = await transaction
          .select({ id: transferLegs.id })
          .from(transferLegs)
          .where(
            and(
              eq(transferLegs.podId, leg.podId),
              eq(transferLegs.type, "refund"),
              ne(transferLegs.state, "confirmed")
            )
          )
          .limit(1);
        if (!unresolved) {
          await transaction
            .update(pods)
            .set({ state: "cancelled", updatedAt: input.now })
            .where(
              and(eq(pods.id, leg.podId), eq(pods.state, "cancelled_refunding"))
            );
        }
        return confirmed;
      });
    }
  };
}
