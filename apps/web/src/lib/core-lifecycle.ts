import type {
  PodState,
  SettlementEntitlementState,
  SettlementMode,
  SettlementRunState,
  TransferLegState
} from "@pods/domain";

export type ParticipantFinancialSnapshot = {
  settlementState: SettlementRunState | null;
  entitlementState: SettlementEntitlementState | null;
  transferState: TransferLegState | null;
};

export type CoreLifecycleStage =
  | "draft"
  | "enrollment"
  | "cutoff"
  | "scheduled"
  | "active"
  | "final_review"
  | "payout_queued"
  | "payout_confirming"
  | "payout_confirmed"
  | "no_transfer_required"
  | "transfer_attention"
  | "completed"
  | "refunding"
  | "cancelled";

export type CoreLifecycleProjection = {
  stage: CoreLifecycleStage;
  terminal: boolean;
  current: boolean;
};

const transferAttentionStates = new Set<TransferLegState>([
  "retryable_failed",
  "mismatched",
  "late",
  "manual_review"
]);

const transferConfirmingStates = new Set<TransferLegState>([
  "prepared",
  "broadcast",
  "unknown"
]);

export function deriveCoreLifecycle(input: {
  podState: PodState;
  settlementMode?: SettlementMode;
  financial?: ParticipantFinancialSnapshot;
}): CoreLifecycleProjection {
  if (input.podState === "completed") {
    return { stage: "completed", terminal: true, current: false };
  }
  if (input.podState === "cancelled") {
    return { stage: "cancelled", terminal: true, current: false };
  }
  if (input.podState === "cancelled_refunding") {
    return { stage: "refunding", terminal: false, current: true };
  }

  const financial = input.financial;
  if (
    input.podState === "final_review" &&
    input.settlementMode === "proportional" &&
    financial
  ) {
    if (
      financial.settlementState === "manual_review" ||
      financial.entitlementState === "manual_review" ||
      (financial.transferState !== null &&
        transferAttentionStates.has(financial.transferState))
    ) {
      return { stage: "transfer_attention", terminal: false, current: true };
    }
    if (financial.entitlementState === "no_transfer_required") {
      return {
        stage: "no_transfer_required",
        terminal: true,
        current: false
      };
    }
    if (
      financial.entitlementState === "transfer_confirmed" ||
      financial.transferState === "confirmed"
    ) {
      return { stage: "payout_confirmed", terminal: true, current: false };
    }
    if (
      financial.transferState !== null &&
      transferConfirmingStates.has(financial.transferState)
    ) {
      return { stage: "payout_confirming", terminal: false, current: true };
    }
    if (
      financial.entitlementState === "transfer_queued" ||
      financial.transferState === "queued"
    ) {
      return { stage: "payout_queued", terminal: false, current: true };
    }
  }

  const stages: Record<PodState, CoreLifecycleStage> = {
    draft: "draft",
    enrollment_open: "enrollment",
    cutoff_evaluating: "cutoff",
    locked_scheduled: "scheduled",
    active: "active",
    final_review: "final_review",
    completed: "completed",
    cancelled_refunding: "refunding",
    cancelled: "cancelled"
  };
  return {
    stage: stages[input.podState],
    terminal: false,
    current: true
  };
}
