import { randomUUID } from "node:crypto";

import { and, asc, eq, inArray, ne } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  depositIntents,
  ledgerEntries,
  memberships,
  pods,
  transferLegs
} from "./schema";

const openRefundStates = ["queued", "prepared", "broadcast", "unknown"] as const;

export function createTransferMethods(database: PodsDatabase) {
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
