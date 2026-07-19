import { randomUUID } from "node:crypto";

import {
  nextDepositState,
  type DepositExceptionCode,
  type DepositState,
  type FundingNetwork
} from "@pods/domain";
import { and, asc, eq, inArray, ne } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  depositIntents,
  ledgerEntries,
  memberships,
  occurrences,
  pods,
  users
} from "./schema";

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error as { code?: unknown }).code === "23505") return true;
  return "cause" in error && isUniqueViolation((error as { cause?: unknown }).cause);
}

const workerOpenStates: DepositState[] = [
  "wallet_approval_pending",
  "transaction_submitted",
  "observed",
  "finalized"
];

export function createFundingMethods(database: PodsDatabase) {
  return {
    async createDepositIntent(input: {
      podId: string;
      userId: string;
      walletAddress: string;
      treasuryAddress: string;
      network: FundingNetwork;
      reference: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [membership] = await transaction
          .select()
          .from(memberships)
          .where(and(eq(memberships.podId, input.podId), eq(memberships.userId, input.userId)))
          .for("update");
        if (membership?.depositIntentId) {
          throw new Error("Membership already has an open deposit intent");
        }
        if (!membership || !["accepted_unfunded", "funding_failed"].includes(membership.state)) {
          throw new Error("Membership is not eligible to fund this Pod");
        }

        const [pod] = await transaction
          .select()
          .from(pods)
          .where(eq(pods.id, input.podId))
          .for("update");
        if (!pod?.contractData || pod.state !== "enrollment_open") {
          throw new Error("Pod is not accepting deposits");
        }
        const [firstOccurrence] = await transaction
          .select({ opensAt: occurrences.opensAt })
          .from(occurrences)
          .where(and(eq(occurrences.podId, pod.id), eq(occurrences.ordinal, 1)));
        if (!firstOccurrence || firstOccurrence.opensAt.getTime() <= input.now.getTime()) {
          throw new Error("Funding cutoff has passed");
        }
        const [user] = await transaction
          .select({ walletAddress: users.walletAddress })
          .from(users)
          .where(eq(users.id, input.userId));
        if (!user || user.walletAddress !== input.walletAddress) {
          throw new Error("Funding wallet does not match the authenticated membership");
        }

        const intentId = randomUUID();
        const [intent] = await transaction
          .insert(depositIntents)
          .values({
            id: intentId,
            membershipId: membership.id,
            podId: pod.id,
            userId: input.userId,
            walletAddress: user.walletAddress,
            treasuryAddress: input.treasuryAddress,
            network: input.network,
            reference: input.reference,
            amountLuna: pod.contractData.commitment.totalLuna,
            state: "intent_created",
            expiresAt: firstOccurrence.opensAt,
            transactionHash: null,
            observedFrom: null,
            observedFromType: null,
            observedRelatedAddresses: null,
            blockNumber: null,
            transactionIndex: null,
            transactionBatch: null,
            observedAt: null,
            finalizedAt: null,
            creditedAt: null,
            exceptionCode: null,
            createdAt: input.now,
            updatedAt: input.now
          })
          .returning();
        if (!intent) throw new Error("Deposit intent could not be created");
        const [updatedMembership] = await transaction
          .update(memberships)
          .set({
            depositIntentId: intent.id,
            state: "deposit_pending",
            updatedAt: input.now
          })
          .where(and(eq(memberships.id, membership.id), eq(memberships.state, membership.state)))
          .returning();
        if (!updatedMembership) throw new Error("Membership funding state changed");
        return intent;
      });
    },

    async getDepositIntentForUser(userId: string, intentId: string) {
      const [intent] = await database
        .select()
        .from(depositIntents)
        .where(and(eq(depositIntents.id, intentId), eq(depositIntents.userId, userId)));
      return intent ?? null;
    },

    async getOpenDepositIntentForUser(userId: string, podId: string) {
      const [intent] = await database
        .select({ deposit: depositIntents })
        .from(memberships)
        .innerJoin(depositIntents, eq(depositIntents.id, memberships.depositIntentId))
        .where(and(eq(memberships.userId, userId), eq(memberships.podId, podId)));
      return intent?.deposit ?? null;
    },

    async recordDepositWalletAttempt(input: {
      intentId: string;
      userId: string;
      event: "open" | "rejected";
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [intent] = await transaction
          .select()
          .from(depositIntents)
          .where(and(eq(depositIntents.id, input.intentId), eq(depositIntents.userId, input.userId)))
          .for("update");
        if (!intent) return null;
        const event = input.event === "open" ? "open_wallet" : "wallet_reject";
        const nextState = nextDepositState(intent.state, event, "client");
        if (!nextState) throw new Error("Deposit wallet event is not valid for the current state");
        const [updated] = await transaction
          .update(depositIntents)
          .set({ state: nextState, updatedAt: input.now })
          .where(and(eq(depositIntents.id, intent.id), eq(depositIntents.state, intent.state)))
          .returning();
        if (!updated) throw new Error("Deposit intent state changed");
        if (nextState === "wallet_rejected") {
          await transaction
            .update(memberships)
            .set({ depositIntentId: null, state: "funding_failed", updatedAt: input.now })
            .where(and(eq(memberships.id, intent.membershipId), eq(memberships.depositIntentId, intent.id)));
        }
        return updated;
      });
    },

    async recordDepositTransactionHint(input: {
      intentId: string;
      userId: string;
      transactionHash: string;
      now: Date;
    }) {
      if (!/^[a-f0-9]{64}$/.test(input.transactionHash)) {
        throw new Error("Transaction hash is invalid");
      }
      try {
        return await database.transaction(async (transaction) => {
          const [intent] = await transaction
            .select()
            .from(depositIntents)
            .where(and(eq(depositIntents.id, input.intentId), eq(depositIntents.userId, input.userId)))
            .for("update");
          if (!intent) return null;
          const nextState = nextDepositState(intent.state, "submit_hint", "client");
          if (!nextState) throw new Error("Transaction hint is not valid for the current state");
          const [updated] = await transaction
            .update(depositIntents)
            .set({
              state: nextState,
              transactionHash: input.transactionHash,
              updatedAt: input.now
            })
            .where(and(eq(depositIntents.id, intent.id), eq(depositIntents.state, intent.state)))
            .returning();
          if (!updated) throw new Error("Deposit intent state changed");
          return updated;
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new Error("Transaction hash is already assigned to another deposit intent");
        }
        throw error;
      }
    },

    async listOpenDepositIntents() {
      return database
        .select()
        .from(depositIntents)
        .where(inArray(depositIntents.state, workerOpenStates))
        .orderBy(asc(depositIntents.createdAt));
    },

    async isDepositTransactionHashClaimed(transactionHash: string, intentId: string) {
      const [claimed] = await database
        .select({ id: depositIntents.id })
        .from(depositIntents)
        .where(
          and(
            eq(depositIntents.transactionHash, transactionHash),
            ne(depositIntents.id, intentId)
          )
        );
      return Boolean(claimed);
    },

    async recordDepositException(input: {
      intentId: string;
      code: DepositExceptionCode;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [intent] = await transaction
          .select()
          .from(depositIntents)
          .where(eq(depositIntents.id, input.intentId))
          .for("update");
        if (!intent) return null;
        if (intent.state === "exception_review") {
          if (intent.exceptionCode !== input.code) {
            throw new Error("Deposit already has a different exception classification");
          }
          return intent;
        }
        const nextState = nextDepositState(intent.state, "flag_exception", "worker");
        if (!nextState) throw new Error("Deposit cannot enter review from the current state");
        const [updated] = await transaction
          .update(depositIntents)
          .set({ state: nextState, exceptionCode: input.code, updatedAt: input.now })
          .where(and(eq(depositIntents.id, intent.id), eq(depositIntents.state, intent.state)))
          .returning();
        if (!updated) throw new Error("Deposit intent state changed");
        return updated;
      });
    },

    async recordObservedDeposit(input: {
      intentId: string;
      transactionHash: string;
      observedFrom: string;
      observedFromType: number;
      observedRelatedAddresses?: string[];
      blockNumber: number;
      transactionIndex: number;
      transactionBatch: number;
      now: Date;
    }) {
      try {
        return await database.transaction(async (transaction) => {
          const [intent] = await transaction
            .select()
            .from(depositIntents)
            .where(eq(depositIntents.id, input.intentId))
            .for("update");
          if (!intent) return null;
          if (
            intent.state === "observed" &&
            intent.transactionHash === input.transactionHash
          ) {
            return intent;
          }
          const [claimed] = await transaction
            .select({ id: depositIntents.id })
            .from(depositIntents)
            .where(
              and(
                eq(depositIntents.transactionHash, input.transactionHash),
                ne(depositIntents.id, intent.id)
              )
            );
          if (claimed) {
            throw new Error("Transaction hash is already assigned to another deposit intent");
          }
          const nextState = nextDepositState(intent.state, "observe", "worker");
          if (!nextState) throw new Error("Deposit cannot be observed from the current state");
          const [updated] = await transaction
            .update(depositIntents)
            .set({
              state: nextState,
              transactionHash: input.transactionHash,
              observedFrom: input.observedFrom,
              observedFromType: input.observedFromType,
              observedRelatedAddresses: input.observedRelatedAddresses ?? [],
              blockNumber: input.blockNumber,
              transactionIndex: input.transactionIndex,
              transactionBatch: input.transactionBatch,
              observedAt: input.now,
              updatedAt: input.now
            })
            .where(and(eq(depositIntents.id, intent.id), eq(depositIntents.state, intent.state)))
            .returning();
          if (!updated) throw new Error("Deposit intent state changed");
          return updated;
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new Error("Transaction hash is already assigned to another deposit intent");
        }
        throw error;
      }
    },

    async finalizeObservedDeposit(input: { intentId: string; now: Date }) {
      return database.transaction(async (transaction) => {
        const [intent] = await transaction
          .select()
          .from(depositIntents)
          .where(eq(depositIntents.id, input.intentId))
          .for("update");
        if (!intent) return null;
        if (["finalized", "credited_provisional", "applied_to_roster"].includes(intent.state)) {
          return intent;
        }
        const nextState = nextDepositState(intent.state, "finalize", "worker");
        if (!nextState) throw new Error("Deposit cannot be finalized from the current state");
        const [updated] = await transaction
          .update(depositIntents)
          .set({ state: nextState, finalizedAt: input.now, updatedAt: input.now })
          .where(and(eq(depositIntents.id, intent.id), eq(depositIntents.state, intent.state)))
          .returning();
        if (!updated) throw new Error("Deposit intent state changed");
        return updated;
      });
    },

    async creditFinalizedDeposit(input: { intentId: string; now: Date }) {
      return database.transaction(async (transaction) => {
        const [intent] = await transaction
          .select()
          .from(depositIntents)
          .where(eq(depositIntents.id, input.intentId))
          .for("update");
        if (!intent) return null;
        if (["credited_provisional", "applied_to_roster"].includes(intent.state)) {
          return intent;
        }
        const nextState = nextDepositState(intent.state, "credit", "worker");
        if (!nextState) throw new Error("Deposit cannot be credited from the current state");
        const [membership] = await transaction
          .select()
          .from(memberships)
          .where(eq(memberships.id, intent.membershipId))
          .for("update");
        if (!membership || membership.depositIntentId !== intent.id) {
          throw new Error("Membership is bound to a different deposit intent");
        }
        await transaction
          .insert(ledgerEntries)
          .values({
            id: randomUUID(),
            idempotencyKey: `deposit-credit:${intent.id}`,
            podId: intent.podId,
            membershipId: intent.membershipId,
            depositIntentId: intent.id,
            movementType: "deposit_credit",
            debitAccount: `treasury_asset:${intent.network}`,
            creditAccount: `participant_liability:${intent.membershipId}`,
            amountLuna: intent.amountLuna,
            createdAt: input.now
          })
          .onConflictDoNothing({ target: ledgerEntries.idempotencyKey });
        const [updatedIntent] = await transaction
          .update(depositIntents)
          .set({ state: nextState, creditedAt: input.now, updatedAt: input.now })
          .where(and(eq(depositIntents.id, intent.id), eq(depositIntents.state, intent.state)))
          .returning();
        if (!updatedIntent) throw new Error("Deposit intent state changed");
        const [updatedMembership] = await transaction
          .update(memberships)
          .set({ state: "funded_provisional", updatedAt: input.now })
          .where(
            and(
              eq(memberships.id, membership.id),
              eq(memberships.depositIntentId, intent.id),
              eq(memberships.state, "deposit_pending")
            )
          )
          .returning();
        if (!updatedMembership) throw new Error("Membership funding state changed");
        return updatedIntent;
      });
    },

    listLedgerEntriesForDeposit(intentId: string) {
      return database
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.depositIntentId, intentId))
        .orderBy(asc(ledgerEntries.createdAt));
    }
  };
}
