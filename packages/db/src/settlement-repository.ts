import { createHash, randomUUID } from "node:crypto";

import {
  calculateSettlement,
  type SettlementOutcomeState
} from "@pods/domain";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  depositIntents,
  ledgerEntries,
  memberships,
  occurrences,
  pods,
  settlementEntitlements,
  settlementOccurrences,
  settlementOutcomes,
  settlementRuns,
  submissions,
  transferAttempts,
  transferLegs,
  users
} from "./schema";

const CALCULATOR_VERSION = 1;
const rosterStates = ["roster_locked", "active"] as const;

function settlementInputDigest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function account(kind: string, ...ids: string[]) {
  return `${kind}:${ids.join(":")}`;
}

export function createSettlementMethods(database: PodsDatabase) {
  return {
    async getParticipantSettlement(input: {
      podId: string;
      userId: string;
    }) {
      const [pod] = await database
        .select({
          id: pods.id,
          state: pods.state,
          contractData: pods.contractData,
          contractHash: pods.contractHash
        })
        .from(pods)
        .where(eq(pods.id, input.podId));
      if (!pod) return null;
      const [membership] = await database
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.podId, input.podId),
            eq(memberships.userId, input.userId)
          )
        );
      if (!membership) return null;
      const [settlement] = await database
        .select()
        .from(settlementRuns)
        .where(eq(settlementRuns.podId, input.podId));
      if (!settlement) {
        return {
          pod,
          settlement: null,
          entitlement: null,
          outcomes: [],
          transfer: null
        };
      }
      const [entitlement] = await database
        .select()
        .from(settlementEntitlements)
        .where(
          and(
            eq(settlementEntitlements.settlementRunId, settlement.id),
            eq(settlementEntitlements.membershipId, membership.id)
          )
        );
      if (!entitlement) return null;
      const outcomes = await database
        .select({
          ordinal: settlementOccurrences.ordinal,
          state: settlementOutcomes.state,
          principalLuna: settlementOutcomes.principalLuna,
          provisionalForfeitureLuna:
            settlementOutcomes.provisionalForfeitureLuna,
          restorationLuna: settlementOutcomes.restorationLuna,
          bonusLuna: settlementOutcomes.bonusLuna,
          payoutLuna: settlementOutcomes.payoutLuna
        })
        .from(settlementOutcomes)
        .innerJoin(
          settlementOccurrences,
          eq(
            settlementOutcomes.settlementOccurrenceId,
            settlementOccurrences.id
          )
        )
        .where(
          and(
            eq(settlementOutcomes.settlementRunId, settlement.id),
            eq(settlementOutcomes.membershipId, membership.id)
          )
        )
        .orderBy(asc(settlementOccurrences.ordinal));
      const [leg] = await database
        .select({
          id: transferLegs.id,
          state: transferLegs.state,
          amountLuna: transferLegs.amountLuna
        })
        .from(transferLegs)
        .where(eq(transferLegs.settlementEntitlementId, entitlement.id));
      let transfer: {
        id: string;
        state: typeof transferLegs.$inferSelect.state;
        amountLuna: number;
        transactionHash: string | null;
      } | null = null;
      if (leg) {
        const [attempt] = await database
          .select({ transactionHash: transferAttempts.transactionHash })
          .from(transferAttempts)
          .where(eq(transferAttempts.transferLegId, leg.id))
          .orderBy(desc(transferAttempts.sequence))
          .limit(1);
        transfer = {
          ...leg,
          transactionHash: attempt?.transactionHash ?? null
        };
      }
      return {
        pod,
        settlement,
        entitlement,
        outcomes,
        transfer
      };
    },

    async getCreatorSettlement(input: {
      podId: string;
      creatorUserId: string;
    }) {
      const [pod] = await database
        .select({
          id: pods.id,
          state: pods.state,
          contractData: pods.contractData,
          contractHash: pods.contractHash
        })
        .from(pods)
        .where(
          and(
            eq(pods.id, input.podId),
            eq(pods.creatorUserId, input.creatorUserId)
          )
        );
      if (!pod) return null;
      const [settlement] = await database
        .select()
        .from(settlementRuns)
        .where(eq(settlementRuns.podId, input.podId));
      if (!settlement) {
        return {
          pod,
          settlement: null,
          occurrences: [],
          entitlements: []
        };
      }
      const frozenOccurrences = await database
        .select()
        .from(settlementOccurrences)
        .where(eq(settlementOccurrences.settlementRunId, settlement.id))
        .orderBy(asc(settlementOccurrences.ordinal));
      const entitlements = await database
        .select({
          membershipId: settlementEntitlements.membershipId,
          state: settlementEntitlements.state,
          depositLuna: settlementEntitlements.depositLuna,
          principalLuna: settlementEntitlements.principalLuna,
          provisionalForfeitureLuna:
            settlementEntitlements.provisionalForfeitureLuna,
          restorationLuna: settlementEntitlements.restorationLuna,
          bonusLuna: settlementEntitlements.bonusLuna,
          payoutLuna: settlementEntitlements.payoutLuna
        })
        .from(settlementEntitlements)
        .where(eq(settlementEntitlements.settlementRunId, settlement.id))
        .orderBy(asc(settlementEntitlements.membershipId));
      return {
        pod,
        settlement,
        occurrences: frozenOccurrences,
        entitlements
      };
    },

    async listSettlementReadyPods(now: Date) {
      const candidates = await database
        .select({ id: pods.id, contractData: pods.contractData })
        .from(pods)
        .where(eq(pods.state, "final_review"))
        .orderBy(asc(pods.id));
      const ready: { id: string }[] = [];

      for (const candidate of candidates) {
        const contract = candidate.contractData;
        if (!contract || contract.settlementMode !== "proportional") continue;

        const [existing] = await database
          .select({ id: settlementRuns.id })
          .from(settlementRuns)
          .where(eq(settlementRuns.podId, candidate.id))
          .limit(1);
        if (existing) continue;

        const frozenOccurrences = await database
          .select({
            id: occurrences.id,
            ordinal: occurrences.ordinal,
            closesAt: occurrences.closesAt,
            state: occurrences.state
          })
          .from(occurrences)
          .where(eq(occurrences.podId, candidate.id))
          .orderBy(asc(occurrences.ordinal));
        if (
          frozenOccurrences.length !== contract.commitment.occurrenceCount ||
          frozenOccurrences.some(
            (occurrence, index) =>
              occurrence.ordinal !== index + 1 ||
              occurrence.closesAt.getTime() > now.getTime() ||
              occurrence.state !== "review_open"
          )
        ) {
          continue;
        }

        const [pendingReview] = await database
          .select({ id: submissions.id })
          .from(submissions)
          .innerJoin(
            occurrences,
            eq(submissions.occurrenceId, occurrences.id)
          )
          .where(
            and(
              eq(occurrences.podId, candidate.id),
              eq(submissions.state, "reviewing")
            )
          )
          .limit(1);
        if (!pendingReview) ready.push({ id: candidate.id });
      }

      return ready;
    },

    async finalizePodSettlement(input: { podId: string; now: Date }) {
      return database.transaction(async (transaction) => {
        const [pod] = await transaction
          .select()
          .from(pods)
          .where(eq(pods.id, input.podId))
          .for("update");
        if (!pod) throw new Error("Pod not found");

        const [existing] = await transaction
          .select()
          .from(settlementRuns)
          .where(eq(settlementRuns.podId, input.podId));
        if (existing) {
          return {
            kind: "already_finalized" as const,
            settlement: existing
          };
        }

        const contract = pod.contractData;
        if (
          pod.state !== "final_review" ||
          !contract ||
          contract.settlementMode !== "proportional" ||
          !pod.contractHash
        ) {
          throw new Error("Pod is not ready for proportional settlement");
        }

        const frozenOccurrences = await transaction
          .select()
          .from(occurrences)
          .where(eq(occurrences.podId, pod.id))
          .orderBy(asc(occurrences.ordinal));
        if (
          frozenOccurrences.length !== contract.commitment.occurrenceCount ||
          frozenOccurrences.some(
            (occurrence, index) =>
              occurrence.ordinal !== index + 1 ||
              occurrence.closesAt.getTime() > input.now.getTime() ||
              occurrence.state !== "review_open"
          )
        ) {
          throw new Error("Every frozen occurrence must be closed before settlement");
        }

        const roster = await transaction
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.podId, pod.id),
              inArray(memberships.state, [...rosterStates])
            )
          )
          .orderBy(asc(memberships.id));
        if (roster.length === 0) {
          throw new Error("Settlement requires a funded roster");
        }
        if (roster.some((membership) => membership.userId === pod.creatorUserId)) {
          throw new Error("Creator membership requires operations review");
        }

        const appliedDeposits = await transaction
          .select()
          .from(depositIntents)
          .where(
            and(
              eq(depositIntents.podId, pod.id),
              eq(depositIntents.state, "applied_to_roster")
            )
          )
          .orderBy(asc(depositIntents.membershipId));
        if (appliedDeposits.length !== roster.length) {
          throw new Error("Applied deposits do not match the frozen roster");
        }
        const depositByMembership = new Map(
          appliedDeposits.map((deposit) => [deposit.membershipId, deposit])
        );
        const participantUsers = await transaction
          .select()
          .from(users)
          .where(inArray(users.id, roster.map((membership) => membership.userId)));
        const userById = new Map(participantUsers.map((user) => [user.id, user]));

        for (const membership of roster) {
          const deposit = depositByMembership.get(membership.id);
          if (
            membership.acceptedContractHash !== pod.contractHash ||
            !membership.depositIntentId ||
            !deposit ||
            deposit.id !== membership.depositIntentId ||
            deposit.userId !== membership.userId ||
            deposit.amountLuna !== contract.commitment.totalLuna ||
            !deposit.finalizedAt ||
            !userById.has(membership.userId)
          ) {
            throw new Error("Funded membership does not match the frozen settlement contract");
          }
        }

        const depositCredits = await transaction
          .select()
          .from(ledgerEntries)
          .where(
            and(
              eq(ledgerEntries.podId, pod.id),
              eq(ledgerEntries.movementType, "deposit_credit")
            )
          );
        if (depositCredits.length !== appliedDeposits.length) {
          throw new Error("Deposit credit ledger does not match the frozen roster");
        }
        for (const deposit of appliedDeposits) {
          const credits = depositCredits.filter(
            (entry) =>
              entry.depositIntentId === deposit.id &&
              entry.membershipId === deposit.membershipId &&
              entry.amountLuna === deposit.amountLuna
          );
          if (credits.length !== 1) {
            throw new Error("Deposit credit ledger does not match the frozen roster");
          }
        }

        const submitted = await transaction
          .select({ submission: submissions })
          .from(submissions)
          .where(
            inArray(
              submissions.occurrenceId,
              frozenOccurrences.map((occurrence) => occurrence.id)
            )
          );
        const rosterIds = new Set(roster.map((membership) => membership.id));
        if (
          submitted.some(({ submission }) => !rosterIds.has(submission.membershipId))
        ) {
          throw new Error("Settlement submissions include a non-roster member");
        }
        if (
          submitted.some(({ submission }) => submission.state === "reviewing")
        ) {
          throw new Error("Settlement cannot start while a review is pending");
        }
        const submissionByOccurrenceMember = new Map(
          submitted.map(({ submission }) => [
            `${submission.occurrenceId}:${submission.membershipId}`,
            submission
          ])
        );

        const sourceOccurrences = frozenOccurrences.map((occurrence) => ({
          occurrenceId: occurrence.id,
          ordinal: occurrence.ordinal,
          outcomes: roster.map((membership) => {
            const submission = submissionByOccurrenceMember.get(
              `${occurrence.id}:${membership.id}`
            );
            let state: SettlementOutcomeState;
            if (!submission || submission.state === "draft") {
              state = "missed";
            } else if (
              submission.state === "approved" ||
              submission.state === "rejected" ||
              submission.state === "timeout_protected"
            ) {
              state = submission.state;
            } else {
              throw new Error("Settlement encountered a nonterminal submission");
            }
            return {
              membershipId: membership.id,
              state,
              sourceSubmissionId: submission?.id ?? null
            };
          })
        }));
        const settlementInput = {
          contractHash: pod.contractHash,
          calculatorVersion: CALCULATOR_VERSION,
          members: roster.map((membership) => {
            const deposit = depositByMembership.get(membership.id);
            if (!deposit) throw new Error("Settlement deposit is missing");
            return {
              membershipId: membership.id,
              depositIntentId: deposit.id,
              depositLuna: deposit.amountLuna
            };
          }),
          occurrences: sourceOccurrences
        };
        const calculated = calculateSettlement({
          lunaPerOccurrence: contract.commitment.lunaPerOccurrence,
          members: settlementInput.members.map((member) => ({
            membershipId: member.membershipId,
            depositLuna: member.depositLuna
          })),
          occurrences: sourceOccurrences.map((occurrence) => ({
            occurrenceId: occurrence.occurrenceId,
            outcomes: occurrence.outcomes.map((outcome) => ({
              membershipId: outcome.membershipId,
              state: outcome.state
            }))
          }))
        });
        const runId = randomUUID();
        const [settlement] = await transaction
          .insert(settlementRuns)
          .values({
            id: runId,
            podId: pod.id,
            contractHash: pod.contractHash,
            calculatorVersion: CALCULATOR_VERSION,
            inputDigest: settlementInputDigest(settlementInput),
            state: "executing",
            totalDepositLuna: calculated.totalDepositLuna,
            totalPayoutLuna: calculated.totalPayoutLuna,
            finalizedAt: input.now,
            settledAt: null,
            createdAt: input.now,
            updatedAt: input.now
          })
          .returning();
        if (!settlement) throw new Error("Settlement run could not be created");

        const sourceByOccurrence = new Map(
          sourceOccurrences.map((occurrence) => [
            occurrence.occurrenceId,
            occurrence
          ])
        );
        const depositInputByMembership = new Map(
          settlementInput.members.map((member) => [member.membershipId, member])
        );

        for (const calculatedOccurrence of calculated.occurrences) {
          const sourceOccurrence = sourceByOccurrence.get(
            calculatedOccurrence.occurrenceId
          );
          if (!sourceOccurrence) throw new Error("Settlement occurrence source is missing");
          const settlementOccurrenceId = randomUUID();
          await transaction.insert(settlementOccurrences).values({
            id: settlementOccurrenceId,
            settlementRunId: runId,
            podId: pod.id,
            occurrenceId: calculatedOccurrence.occurrenceId,
            ordinal: sourceOccurrence.ordinal,
            state: calculatedOccurrence.state,
            forfeiturePoolLuna: calculatedOccurrence.forfeiturePoolLuna,
            bonusRecipientCount: calculatedOccurrence.bonusRecipientCount,
            createdAt: input.now
          });

          const sourceOutcomeByMembership = new Map(
            sourceOccurrence.outcomes.map((outcome) => [
              outcome.membershipId,
              outcome
            ])
          );
          for (const outcome of calculatedOccurrence.outcomes) {
            const depositInput = depositInputByMembership.get(outcome.membershipId);
            const sourceOutcome = sourceOutcomeByMembership.get(outcome.membershipId);
            if (!depositInput || !sourceOutcome) {
              throw new Error("Settlement outcome source is missing");
            }
            await transaction.insert(settlementOutcomes).values({
              id: randomUUID(),
              settlementRunId: runId,
              settlementOccurrenceId,
              podId: pod.id,
              occurrenceId: calculatedOccurrence.occurrenceId,
              membershipId: outcome.membershipId,
              depositIntentId: depositInput.depositIntentId,
              sourceSubmissionId: sourceOutcome.sourceSubmissionId,
              state: outcome.state,
              principalLuna: outcome.principalLuna,
              provisionalForfeitureLuna: outcome.provisionalForfeitureLuna,
              restorationLuna: outcome.restorationLuna,
              bonusLuna: outcome.bonusLuna,
              payoutLuna: outcome.payoutLuna,
              createdAt: input.now
            });

            await transaction.insert(ledgerEntries).values({
              id: randomUUID(),
              idempotencyKey:
                `settlement:${runId}:allocation:${calculatedOccurrence.occurrenceId}:${outcome.membershipId}`,
              podId: pod.id,
              membershipId: outcome.membershipId,
              depositIntentId: depositInput.depositIntentId,
              movementType: "principal_allocation",
              debitAccount: account(
                "participant_liability",
                outcome.membershipId
              ),
              creditAccount: account(
                "occurrence_liability",
                calculatedOccurrence.occurrenceId,
                outcome.membershipId
              ),
              amountLuna: contract.commitment.lunaPerOccurrence,
              createdAt: input.now
            });
            if (outcome.principalLuna > 0) {
              await transaction.insert(ledgerEntries).values({
                id: randomUUID(),
                idempotencyKey:
                  `settlement:${runId}:principal:${calculatedOccurrence.occurrenceId}:${outcome.membershipId}`,
                podId: pod.id,
                membershipId: outcome.membershipId,
                depositIntentId: depositInput.depositIntentId,
                movementType: "principal_protection",
                debitAccount: account(
                  "occurrence_liability",
                  calculatedOccurrence.occurrenceId,
                  outcome.membershipId
                ),
                creditAccount: account(
                  "payout_liability",
                  runId,
                  outcome.membershipId
                ),
                amountLuna: outcome.principalLuna,
                createdAt: input.now
              });
            }
            if (outcome.provisionalForfeitureLuna > 0) {
              await transaction.insert(ledgerEntries).values({
                id: randomUUID(),
                idempotencyKey:
                  `settlement:${runId}:forfeiture:${calculatedOccurrence.occurrenceId}:${outcome.membershipId}`,
                podId: pod.id,
                membershipId: outcome.membershipId,
                depositIntentId: depositInput.depositIntentId,
                movementType: "provisional_forfeiture",
                debitAccount: account(
                  "occurrence_liability",
                  calculatedOccurrence.occurrenceId,
                  outcome.membershipId
                ),
                creditAccount: account(
                  "bonus_pool_liability",
                  calculatedOccurrence.occurrenceId
                ),
                amountLuna: outcome.provisionalForfeitureLuna,
                createdAt: input.now
              });
            }
            if (outcome.restorationLuna > 0) {
              await transaction.insert(ledgerEntries).values({
                id: randomUUID(),
                idempotencyKey:
                  `settlement:${runId}:restoration:${calculatedOccurrence.occurrenceId}:${outcome.membershipId}`,
                podId: pod.id,
                membershipId: outcome.membershipId,
                depositIntentId: depositInput.depositIntentId,
                movementType: "zero_recipient_restoration",
                debitAccount: account(
                  "bonus_pool_liability",
                  calculatedOccurrence.occurrenceId
                ),
                creditAccount: account(
                  "payout_liability",
                  runId,
                  outcome.membershipId
                ),
                amountLuna: outcome.restorationLuna,
                createdAt: input.now
              });
            }
            if (outcome.bonusLuna > 0) {
              await transaction.insert(ledgerEntries).values({
                id: randomUUID(),
                idempotencyKey:
                  `settlement:${runId}:bonus:${calculatedOccurrence.occurrenceId}:${outcome.membershipId}`,
                podId: pod.id,
                membershipId: outcome.membershipId,
                depositIntentId: depositInput.depositIntentId,
                movementType: "bonus_entitlement",
                debitAccount: account(
                  "bonus_pool_liability",
                  calculatedOccurrence.occurrenceId
                ),
                creditAccount: account(
                  "payout_liability",
                  runId,
                  outcome.membershipId
                ),
                amountLuna: outcome.bonusLuna,
                createdAt: input.now
              });
            }
          }
        }

        for (const entitlement of calculated.members) {
          const depositInput = depositInputByMembership.get(entitlement.membershipId);
          const membership = roster.find(
            (candidate) => candidate.id === entitlement.membershipId
          );
          const participant = membership
            ? userById.get(membership.userId)
            : undefined;
          if (!depositInput || !participant) {
            throw new Error("Settlement entitlement source is missing");
          }
          const entitlementId = randomUUID();
          const state =
            entitlement.payoutLuna > 0
              ? "transfer_queued"
              : "no_transfer_required";
          await transaction.insert(settlementEntitlements).values({
            id: entitlementId,
            settlementRunId: runId,
            podId: pod.id,
            membershipId: entitlement.membershipId,
            depositIntentId: depositInput.depositIntentId,
            state,
            depositLuna: entitlement.depositLuna,
            principalLuna: entitlement.principalLuna,
            provisionalForfeitureLuna: entitlement.provisionalForfeitureLuna,
            restorationLuna: entitlement.restorationLuna,
            bonusLuna: entitlement.bonusLuna,
            payoutLuna: entitlement.payoutLuna,
            createdAt: input.now,
            updatedAt: input.now
          });
          if (entitlement.payoutLuna > 0) {
            await transaction.insert(transferLegs).values({
              id: randomUUID(),
              idempotencyKey: `payout:${runId}:${entitlement.membershipId}`,
              podId: pod.id,
              membershipId: entitlement.membershipId,
              depositIntentId: depositInput.depositIntentId,
              settlementEntitlementId: entitlementId,
              type: "payout",
              recipientWallet: participant.walletAddress,
              amountLuna: entitlement.payoutLuna,
              network: "testnet",
              state: "queued",
              rawTransactionHex: null,
              transactionHash: null,
              validityStartHeight: null,
              preparedAt: null,
              broadcastAt: null,
              confirmedAt: null,
              lastAttemptAt: null,
              errorCode: null,
              createdAt: input.now,
              updatedAt: input.now
            });
          }
        }

        return {
          kind: "finalized" as const,
          settlement
        };
      });
    }
  };
}
