import { describe, expect, it } from "vitest";

import {
  canApplyDepositEvent,
  compareFinalizedDeposits,
  nextDepositState,
  requiredDepositLuna,
  type DepositEvent,
  type DepositState,
  type FinalizedDepositOrder
} from "../src/funding";

describe("Phase 3 funding contract", () => {
  it("keeps observation, finality, credit, roster, and refund transitions worker-owned", () => {
    const workerEvents: Array<[DepositState, DepositEvent, DepositState]> = [
      ["transaction_submitted", "observe", "observed"],
      ["observed", "finalize", "finalized"],
      ["finalized", "credit", "credited_provisional"],
      ["credited_provisional", "apply_roster", "applied_to_roster"],
      ["credited_provisional", "queue_refund", "refund_pending"],
      ["refund_pending", "confirm_refund", "refunded"]
    ];

    for (const [state, event, expected] of workerEvents) {
      expect(canApplyDepositEvent(state, event, "client")).toBe(false);
      expect(canApplyDepositEvent(state, event, "worker")).toBe(true);
      expect(nextDepositState(state, event, "worker")).toBe(expected);
    }
  });

  it("allows the client to record only wallet handoff outcomes and a transaction hint", () => {
    expect(nextDepositState("intent_created", "open_wallet", "client"))
      .toBe("wallet_approval_pending");
    expect(nextDepositState("wallet_approval_pending", "wallet_reject", "client"))
      .toBe("wallet_rejected");
    expect(nextDepositState("wallet_approval_pending", "submit_hint", "client"))
      .toBe("transaction_submitted");
    expect(nextDepositState("finalized", "credit", "client")).toBeNull();
  });

  it("routes only the two documented pre-credit states into exception review", () => {
    expect(nextDepositState("transaction_submitted", "flag_exception", "worker"))
      .toBe("exception_review");
    expect(nextDepositState("observed", "flag_exception", "worker"))
      .toBe("exception_review");
    expect(nextDepositState("finalized", "flag_exception", "worker")).toBeNull();
  });

  it("computes the exact upfront amount in integer Luna", () => {
    expect(requiredDepositLuna(5, 10_000)).toBe(50_000);
    expect(() => requiredDepositLuna(0, 10_000)).toThrow(
      "Required deposit must be a positive safe integer Luna amount"
    );
    expect(() => requiredDepositLuna(2, Number.MAX_SAFE_INTEGER)).toThrow(
      "Required deposit must be a positive safe integer Luna amount"
    );
  });

  it("orders capacity by finalized chain position and then transaction hash", () => {
    const deposits: FinalizedDepositOrder[] = [
      { blockNumber: 20, transactionIndex: 2, transactionHash: "bb" },
      { blockNumber: 20, transactionIndex: 2, transactionHash: "aa" },
      { blockNumber: 19, transactionIndex: 7, transactionHash: "cc" },
      { blockNumber: 20, transactionIndex: 1, transactionHash: "dd" }
    ];

    expect(
      [...deposits].sort(compareFinalizedDeposits).map((item) => item.transactionHash)
    ).toEqual(["cc", "dd", "aa", "bb"]);
  });
});
