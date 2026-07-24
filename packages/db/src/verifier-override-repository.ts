import type { FundingNetwork } from "@pods/domain";
import { and, eq } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  memberships,
  occurrences,
  pods,
  podVerifierOverrides,
  reviewDecisions,
  settlementRuns,
  submissions
} from "./schema";

export type VerifierAuthority = {
  creatorUserId: string;
  frozenVerifier: "pods_team" | "creator";
  effectiveVerifier: "pods_team" | "creator";
  source: "contract" | "testnet_override";
  amendedAt: Date | null;
};

export async function resolveVerifierAuthority(
  database: PodsDatabase,
  podId: string
): Promise<VerifierAuthority | null> {
  const [record] = await database
    .select({ pod: pods, override: podVerifierOverrides })
    .from(pods)
    .leftJoin(
      podVerifierOverrides,
      and(
        eq(podVerifierOverrides.podId, pods.id),
        eq(podVerifierOverrides.contractHash, pods.contractHash),
        eq(podVerifierOverrides.creatorUserId, pods.creatorUserId),
        eq(podVerifierOverrides.network, "testnet"),
        eq(podVerifierOverrides.fromVerifier, "pods_team"),
        eq(podVerifierOverrides.toVerifier, "creator")
      )
    )
    .where(eq(pods.id, podId));
  const frozenVerifier = record?.pod.contractData?.verification.verifier;
  if (!record || (frozenVerifier !== "pods_team" && frozenVerifier !== "creator")) {
    return null;
  }
  const validOverride =
    frozenVerifier === "pods_team" && record.override?.toVerifier === "creator";
  return {
    creatorUserId: record.pod.creatorUserId,
    frozenVerifier,
    effectiveVerifier: validOverride ? "creator" : frozenVerifier,
    source: validOverride ? "testnet_override" : "contract",
    amendedAt: validOverride ? record.override?.effectiveAt ?? null : null
  };
}

type LegacyVerifierAmendment = {
  network: FundingNetwork;
  podId: string;
  expectedContractHash: string;
  expectedCreatorUserId: string;
  actor: string;
  reason: string;
  effectiveAt: Date;
  createdAt: Date;
};

export function createVerifierOverrideMethods(database: PodsDatabase) {
  return {
    getVerifierAuthorityForPod(podId: string) {
      return resolveVerifierAuthority(database, podId);
    },

    async amendLegacyPodVerifierForTestnet(input: LegacyVerifierAmendment) {
      if (input.network !== "testnet") {
        throw new Error("Legacy verifier amendments require Nimiq Testnet");
      }
      const actor = input.actor.trim();
      const reason = input.reason.trim();
      if (!actor || !reason) {
        throw new Error("Legacy verifier amendments require an actor and reason");
      }
      if (
        !Number.isFinite(input.effectiveAt.getTime()) ||
        !Number.isFinite(input.createdAt.getTime())
      ) {
        throw new Error("Legacy verifier amendment timestamps are invalid");
      }

      return database.transaction(async (transaction) => {
        const [pod] = await transaction
          .select()
          .from(pods)
          .where(eq(pods.id, input.podId))
          .for("update");
        if (!pod || !pod.contractData || !pod.contractHash) {
          throw new Error("Frozen Pod not found");
        }
        if (pod.contractHash !== input.expectedContractHash) {
          throw new Error("Frozen Pod contract does not match");
        }
        if (pod.creatorUserId !== input.expectedCreatorUserId) {
          throw new Error("Frozen Pod creator does not match");
        }
        if (pod.contractData.verification.verifier !== "pods_team") {
          throw new Error("Pod does not use the legacy Pods Team verifier");
        }
        if (pod.contractData.settlementMode !== "full_refund_alpha") {
          throw new Error("Only full-return alpha Pods can be amended");
        }
        if (!["locked_scheduled", "active", "final_review"].includes(pod.state)) {
          throw new Error("Pod lifecycle is not eligible for amendment");
        }

        const [existing] = await transaction
          .select()
          .from(podVerifierOverrides)
          .where(eq(podVerifierOverrides.podId, pod.id));
        if (existing) {
          if (
            existing.contractHash !== pod.contractHash ||
            existing.creatorUserId !== pod.creatorUserId ||
            existing.network !== "testnet" ||
            existing.fromVerifier !== "pods_team" ||
            existing.toVerifier !== "creator" ||
            existing.actor !== actor ||
            existing.reason !== reason
          ) {
            throw new Error("Existing verifier amendment does not match");
          }
          return {
            kind: "existing" as const,
            authority: {
              creatorUserId: pod.creatorUserId,
              frozenVerifier: "pods_team" as const,
              effectiveVerifier: "creator" as const,
              source: "testnet_override" as const,
              amendedAt: existing.effectiveAt
            }
          };
        }

        const [creatorMembership] = await transaction
          .select({ id: memberships.id })
          .from(memberships)
          .where(
            and(
              eq(memberships.podId, pod.id),
              eq(memberships.userId, pod.creatorUserId)
            )
          )
          .limit(1);
        if (creatorMembership) {
          throw new Error("Pod creator has participant financial state");
        }
        const [creatorDecision] = await transaction
          .select({ id: reviewDecisions.id })
          .from(reviewDecisions)
          .innerJoin(submissions, eq(reviewDecisions.submissionId, submissions.id))
          .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
          .where(
            and(
              eq(occurrences.podId, pod.id),
              eq(reviewDecisions.reviewerId, pod.creatorUserId)
            )
          )
          .limit(1);
        if (creatorDecision) {
          throw new Error("Pod creator already has a review decision");
        }
        const [settlement] = await transaction
          .select({ id: settlementRuns.id })
          .from(settlementRuns)
          .where(eq(settlementRuns.podId, pod.id))
          .limit(1);
        if (settlement) {
          throw new Error("Pod settlement already exists");
        }

        const [override] = await transaction
          .insert(podVerifierOverrides)
          .values({
            podId: pod.id,
            contractHash: pod.contractHash,
            creatorUserId: pod.creatorUserId,
            network: "testnet",
            fromVerifier: "pods_team",
            toVerifier: "creator",
            actor,
            reason,
            effectiveAt: input.effectiveAt,
            createdAt: input.createdAt
          })
          .returning();
        if (!override) throw new Error("Verifier amendment could not be recorded");
        return {
          kind: "created" as const,
          authority: {
            creatorUserId: pod.creatorUserId,
            frozenVerifier: "pods_team" as const,
            effectiveVerifier: "creator" as const,
            source: "testnet_override" as const,
            amendedAt: override.effectiveAt
          }
        };
      });
    }
  };
}
