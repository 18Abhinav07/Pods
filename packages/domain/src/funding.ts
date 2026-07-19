export type FundingNetwork = "testnet" | "mainnet";

export type DepositState =
  | "intent_created"
  | "wallet_approval_pending"
  | "wallet_rejected"
  | "transaction_submitted"
  | "observed"
  | "finalized"
  | "credited_provisional"
  | "applied_to_roster"
  | "exception_review"
  | "refund_pending"
  | "refunded";

export type DepositActor = "client" | "worker";

export type DepositEvent =
  | "open_wallet"
  | "wallet_reject"
  | "submit_hint"
  | "observe"
  | "finalize"
  | "credit"
  | "apply_roster"
  | "queue_refund"
  | "confirm_refund"
  | "flag_exception";

export type DepositExceptionCode =
  | "wrong_network"
  | "transaction_not_observed"
  | "reference_missing"
  | "reference_duplicate"
  | "reference_expired"
  | "reference_mismatch"
  | "amount_mismatch"
  | "recipient_mismatch"
  | "execution_failed"
  | "finalized_after_cutoff"
  | "capacity_excluded";

export type LedgerMovementType =
  | "deposit_credit"
  | "refund_entitlement"
  | "refund_confirmed";

export type TransferLegState =
  | "queued"
  | "prepared"
  | "broadcast"
  | "unknown"
  | "retryable_failed"
  | "confirmed"
  | "manual_review";

export interface FinalizedDepositOrder {
  blockNumber: number;
  transactionIndex: number;
  transactionHash: string;
}

type Transition = {
  from: DepositState;
  event: DepositEvent;
  actor: DepositActor;
  to: DepositState;
};

const transitions: Transition[] = [
  {
    from: "intent_created",
    event: "open_wallet",
    actor: "client",
    to: "wallet_approval_pending"
  },
  {
    from: "wallet_approval_pending",
    event: "wallet_reject",
    actor: "client",
    to: "wallet_rejected"
  },
  {
    from: "wallet_approval_pending",
    event: "submit_hint",
    actor: "client",
    to: "transaction_submitted"
  },
  {
    from: "transaction_submitted",
    event: "observe",
    actor: "worker",
    to: "observed"
  },
  {
    from: "wallet_approval_pending",
    event: "observe",
    actor: "worker",
    to: "observed"
  },
  {
    from: "observed",
    event: "finalize",
    actor: "worker",
    to: "finalized"
  },
  {
    from: "finalized",
    event: "credit",
    actor: "worker",
    to: "credited_provisional"
  },
  {
    from: "credited_provisional",
    event: "apply_roster",
    actor: "worker",
    to: "applied_to_roster"
  },
  {
    from: "credited_provisional",
    event: "queue_refund",
    actor: "worker",
    to: "refund_pending"
  },
  {
    from: "refund_pending",
    event: "confirm_refund",
    actor: "worker",
    to: "refunded"
  },
  {
    from: "transaction_submitted",
    event: "flag_exception",
    actor: "worker",
    to: "exception_review"
  },
  {
    from: "observed",
    event: "flag_exception",
    actor: "worker",
    to: "exception_review"
  }
];

export function nextDepositState(
  state: DepositState,
  event: DepositEvent,
  actor: DepositActor
): DepositState | null {
  return transitions.find(
    (transition) =>
      transition.from === state && transition.event === event && transition.actor === actor
  )?.to ?? null;
}

export function canApplyDepositEvent(
  state: DepositState,
  event: DepositEvent,
  actor: DepositActor
): boolean {
  return nextDepositState(state, event, actor) !== null;
}

export function requiredDepositLuna(
  occurrenceCount: number,
  lunaPerOccurrence: number
): number {
  const amountLuna = occurrenceCount * lunaPerOccurrence;
  if (
    !Number.isInteger(occurrenceCount) ||
    !Number.isInteger(lunaPerOccurrence) ||
    occurrenceCount <= 0 ||
    lunaPerOccurrence <= 0 ||
    !Number.isSafeInteger(amountLuna)
  ) {
    throw new Error("Required deposit must be a positive safe integer Luna amount");
  }
  return amountLuna;
}

export function compareFinalizedDeposits(
  left: FinalizedDepositOrder,
  right: FinalizedDepositOrder
): number {
  return (
    left.blockNumber - right.blockNumber ||
    left.transactionIndex - right.transactionIndex ||
    left.transactionHash.localeCompare(right.transactionHash)
  );
}
