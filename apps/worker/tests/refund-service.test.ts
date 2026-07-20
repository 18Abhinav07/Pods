import { describe, expect, it } from "vitest";

import {
  runRefundCycle,
  type RefundTransferLeg,
  type RefundTransferRepository
} from "../src/funding/refund-service";

const queuedLeg: RefundTransferLeg = {
  id: "leg-1",
  recipientWallet: "NQ00 REFUND RECIPIENT",
  amountLuna: 800_000,
  network: "testnet",
  state: "queued",
  rawTransactionHex: null,
  transactionHash: null,
  validityStartHeight: null
};

function refundRepository(initial: RefundTransferLeg[]) {
  const legs = new Map(initial.map((leg) => [leg.id, { ...leg }]));
  const events: string[] = [];

  const value: RefundTransferRepository = {
    async listOpenRefundTransferLegs() {
      return [...legs.values()];
    },
    async markRefundTransferPrepared(input) {
      events.push(`prepared:${input.legId}`);
      const leg = legs.get(input.legId);
      if (!leg) throw new Error("missing leg");
      const next = {
        ...leg,
        state: "prepared" as const,
        rawTransactionHex: input.rawTransactionHex,
        transactionHash: input.transactionHash,
        validityStartHeight: input.validityStartHeight
      };
      legs.set(input.legId, next);
      return next;
    },
    async markRefundTransferBroadcast(input) {
      events.push(`broadcast:${input.legId}`);
      const leg = legs.get(input.legId);
      if (!leg) throw new Error("missing leg");
      legs.set(input.legId, { ...leg, state: "broadcast" });
    },
    async markRefundTransferUnknown(input) {
      events.push(`unknown:${input.legId}:${input.errorCode}`);
      const leg = legs.get(input.legId);
      if (!leg) throw new Error("missing leg");
      legs.set(input.legId, { ...leg, state: "unknown" });
    },
    async markRefundTransferRetryableFailed(input) {
      events.push(`retryable_failed:${input.legId}:${input.errorCode}`);
      const leg = legs.get(input.legId);
      if (!leg) throw new Error("missing leg");
      legs.set(input.legId, { ...leg, state: "retryable_failed" });
    },
    async markRefundTransferMismatched(input) {
      events.push(`mismatched:${input.legId}:${input.errorCode}`);
      const leg = legs.get(input.legId);
      if (!leg) throw new Error("missing leg");
      legs.set(input.legId, { ...leg, state: "mismatched" });
    },
    async confirmRefundTransfer(input) {
      events.push(`confirmed:${input.legId}`);
      const leg = legs.get(input.legId);
      if (!leg) throw new Error("missing leg");
      legs.set(input.legId, { ...leg, state: "confirmed" });
    }
  };

  return { value, events, legs };
}

describe("refund service", () => {
  it("persists the signed refund before broadcasting its exact bytes", async () => {
    const store = refundRepository([queuedLeg]);
    const events: string[] = [];

    await runRefundCycle({
      repository: store.value,
      signer: {
        async sign(draft) {
          expect(draft).toEqual({
            recipient: queuedLeg.recipientWallet,
            valueLuna: 800_000n,
            network: "testnet"
          });
          return {
            rawTransactionHex: "signed-refund-bytes",
            hash: "refund-hash",
            validityStartHeight: 120
          };
        }
      },
      rpc: {
        async getTransactionByHash() {
          events.push("chain-check");
          return undefined;
        },
        async sendRawTransaction(rawTransactionHex) {
          events.push(`send:${rawTransactionHex}`);
          return "refund-hash";
        }
      },
      now: () => new Date("2027-03-08T00:05:00.000Z")
    });

    expect(store.events).toEqual(["prepared:leg-1", "broadcast:leg-1"]);
    expect(events).toEqual(["chain-check", "send:signed-refund-bytes"]);
    expect(store.legs.get("leg-1")?.state).toBe("broadcast");
  });

  it("reconciles a prepared transfer from chain before attempting a broadcast", async () => {
    const store = refundRepository([{
      ...queuedLeg,
      state: "prepared",
      rawTransactionHex: "persisted-refund",
      transactionHash: "refund-hash",
      validityStartHeight: 120
    }]);
    let sends = 0;

    await runRefundCycle({
      repository: store.value,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getTransactionByHash() {
          return { hash: "refund-hash", finalized: true, executionResult: true };
        },
        async sendRawTransaction() {
          sends += 1;
          return "refund-hash";
        }
      },
      now: () => new Date("2027-03-08T00:06:00.000Z")
    });

    expect(sends).toBe(0);
    expect(store.events).toEqual(["confirmed:leg-1"]);
  });

  it("never rebroadcasts an unknown transfer when the hash is absent", async () => {
    const store = refundRepository([{
      ...queuedLeg,
      state: "unknown",
      rawTransactionHex: "ambiguous-refund",
      transactionHash: "refund-hash",
      validityStartHeight: 120
    }]);
    let sends = 0;

    await runRefundCycle({
      repository: store.value,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() {
          sends += 1;
          return "refund-hash";
        }
      },
      now: () => new Date("2027-03-08T00:07:00.000Z")
    });

    expect(sends).toBe(0);
    expect(store.events).toEqual([]);
    expect(store.legs.get("leg-1")?.state).toBe("unknown");
  });

  it("marks an ambiguous broadcast unknown and defers every retry to reconciliation", async () => {
    const store = refundRepository([{
      ...queuedLeg,
      state: "prepared",
      rawTransactionHex: "persisted-refund",
      transactionHash: "refund-hash",
      validityStartHeight: 120
    }]);

    await runRefundCycle({
      repository: store.value,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() { throw new Error("gateway timeout"); }
      },
      now: () => new Date("2027-03-08T00:08:00.000Z")
    });

    expect(store.events).toEqual(["unknown:leg-1:broadcast_ambiguous"]);
  });

  it("separates failed execution and returned-hash mismatch from confirmation", async () => {
    const failed = refundRepository([{
      ...queuedLeg,
      state: "broadcast",
      rawTransactionHex: "failed-refund",
      transactionHash: "failed-hash",
      validityStartHeight: 120
    }]);
    await runRefundCycle({
      repository: failed.value,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getTransactionByHash() {
          return { hash: "failed-hash", finalized: true, executionResult: false };
        },
        async sendRawTransaction() { throw new Error("must not broadcast"); }
      },
      now: () => new Date("2027-03-08T00:09:00.000Z")
    });
    expect(failed.events).toEqual([
      "retryable_failed:leg-1:execution_result_false"
    ]);

    const mismatch = refundRepository([{
      ...queuedLeg,
      state: "prepared",
      rawTransactionHex: "mismatch-refund",
      transactionHash: "expected-hash",
      validityStartHeight: 120
    }]);
    await runRefundCycle({
      repository: mismatch.value,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() { return "different-hash"; }
      },
      now: () => new Date("2027-03-08T00:10:00.000Z")
    });
    expect(mismatch.events).toEqual([
      "mismatched:leg-1:broadcast_hash_mismatch"
    ]);
  });
});
