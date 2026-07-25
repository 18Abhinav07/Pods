import { describe, expect, it } from "vitest";

import { presentPodRelationship } from "../src/lib/participant-pod-state";

type RelationshipInput = Parameters<typeof presentPodRelationship>[0] & {
  financial?: {
    settlementState: "executing" | "settled" | "manual_review" | null;
    entitlementState:
      | "transfer_queued"
      | "no_transfer_required"
      | "transfer_confirmed"
      | "manual_review"
      | null;
    transferState:
      | "queued"
      | "prepared"
      | "broadcast"
      | "unknown"
      | "retryable_failed"
      | "mismatched"
      | "late"
      | "confirmed"
      | "manual_review"
      | null;
  };
};

function participantFinancialPresentation(
  financial: NonNullable<RelationshipInput["financial"]>,
  podState: "final_review" | "completed" = "final_review"
) {
  return presentPodRelationship({
    podId: "pod-1",
    podState,
    settlementMode: "proportional",
    relationship: {
      kind: "member",
      state: "active",
      depositIntentId: "intent-1"
    },
    financial
  } as RelationshipInput);
}

describe("canonical Build and Ship afterstate", () => {
  it("distinguishes a queued payout from unresolved review", () => {
    expect(participantFinancialPresentation({
      settlementState: "executing",
      entitlementState: "transfer_queued",
      transferState: "queued"
    })).toMatchObject({
      statusLabel: "Payout queued",
      actionLabel: "Track payout",
      href: "/pods/pod-1/settlement",
      tone: "pending"
    });
  });

  it.each([
    [
      "prepared",
      "Transfer prepared and waiting for safe submission",
      "Your Testnet payout is prepared."
    ],
    [
      "broadcast",
      "Transfer submitted and awaiting Nimiq finality",
      "Your Testnet transfer is on chain."
    ],
    [
      "unknown",
      "Confirmation is delayed while Pods checks the transaction hash",
      "Your Testnet transfer status is being reconciled."
    ]
  ] as const)(
    "presents %s with truthful payout confirmation copy",
    (transferState, statusDetail, todayTitle) => {
      expect(participantFinancialPresentation({
        settlementState: "executing",
        entitlementState: "transfer_queued",
        transferState
      })).toMatchObject({
        statusLabel: "Payout confirming",
        statusDetail,
        actionLabel: "Track payout",
        href: "/pods/pod-1/settlement",
        todayTitle
      });
    }
  );

  it.each([
    "retryable_failed",
    "mismatched",
    "late",
    "manual_review"
  ] as const)(
    "presents %s as a transfer that needs review",
    (transferState) => {
      expect(participantFinancialPresentation({
        settlementState: "manual_review",
        entitlementState: "manual_review",
        transferState
      })).toMatchObject({
        statusLabel: "Transfer needs review",
        actionLabel: "View transfer",
        href: "/pods/pod-1/settlement",
        tone: "attention"
      });
    }
  );

  it("makes a zero entitlement explicit while the Pod finishes other transfers", () => {
    expect(participantFinancialPresentation({
      settlementState: "executing",
      entitlementState: "no_transfer_required",
      transferState: null
    })).toMatchObject({
      statusLabel: "No transfer required",
      actionLabel: "View settlement",
      href: "/pods/pod-1/settlement",
      tone: "closed"
    });
  });

  it("keeps confirmed completion terminal and historical", () => {
    expect(participantFinancialPresentation({
      settlementState: "settled",
      entitlementState: "transfer_confirmed",
      transferState: "confirmed"
    }, "completed")).toMatchObject({
      statusLabel: "Completed",
      actionLabel: "View settlement",
      href: "/pods/pod-1/settlement",
      tone: "closed",
      todayPriority: null
    });
  });
});
