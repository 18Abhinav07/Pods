import { describe, expect, it } from "vitest";

import {
  runPayoutCycle,
  type PayoutTransferLeg,
  type PayoutTransferRepository
} from "../src/settlement/payout-service";

const queuedLeg: PayoutTransferLeg = {
  id: "2f358296-7f67-4236-8dc2-45010c1af824",
  recipientWallet: "NQ00 PAYOUT RECIPIENT",
  amountLuna: 20_000,
  network: "testnet",
  state: "queued",
  attempt: null
};

function payoutRepository(initial: PayoutTransferLeg[]) {
  const legs = new Map(initial.map((leg) => [leg.id, structuredClone(leg)]));
  const events: string[] = [];

  const value: PayoutTransferRepository = {
    async listOpenPayoutTransferLegs() {
      return [...legs.values()];
    },
    async persistPayoutTransferAttempt(input) {
      events.push(`persist:${input.legId}:${input.dataReference}`);
      const leg = legs.get(input.legId);
      if (!leg) return null;
      const next: PayoutTransferLeg = {
        ...leg,
        state: "prepared",
        attempt: {
          id: `attempt-${input.legId}`,
          sequence: 1,
          state: "prepared",
          dataReference: input.dataReference,
          rawTransactionHex: input.rawTransactionHex,
          transactionHash: input.transactionHash,
          validityStartHeight: input.validityStartHeight
        }
      };
      legs.set(input.legId, next);
      return next;
    },
    async claimPayoutBroadcast(input) {
      events.push(`claim:${input.legId}`);
      return true;
    },
    async markPayoutTransferBroadcast(input) {
      events.push(`broadcast:${input.legId}`);
    },
    async markPayoutTransferUnknown(input) {
      events.push(`unknown:${input.legId}:${input.errorCode}`);
    },
    async markPayoutTransferRetryableFailed(input) {
      events.push(`retryable_failed:${input.legId}:${input.errorCode}`);
    },
    async markPayoutTransferMismatched(input) {
      events.push(`mismatched:${input.legId}:${input.errorCode}`);
    },
    async markPayoutTransferLate(input) {
      events.push(`late:${input.legId}`);
    },
    async markPayoutTransferChecked(input) {
      events.push(`checked:${input.legId}`);
    },
    async confirmPayoutTransfer(input) {
      events.push(`confirmed:${input.legId}`);
    }
  };

  return { value, events, legs };
}

describe("payout service", () => {
  it("does not prepare a queued payout while broadcasts are paused", async () => {
    const store = payoutRepository([queuedLeg]);
    let signs = 0;
    let sends = 0;

    await runPayoutCycle({
      repository: store.value,
      signer: {
        async sign() {
          signs += 1;
          throw new Error("must not sign");
        }
      },
      rpc: {
        async getBlockNumber() { return 1_000; },
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() {
          sends += 1;
          return "payout-hash";
        }
      },
      allowBroadcast: false
    });

    expect(signs).toBe(0);
    expect(sends).toBe(0);
    expect(store.events).toEqual([]);
  });

  it("checks a prepared payout without claiming or broadcasting while paused", async () => {
    const preparedLeg: PayoutTransferLeg = {
      ...queuedLeg,
      state: "prepared",
      attempt: {
        id: "attempt-1",
        sequence: 1,
        state: "prepared",
        dataReference: `pods:payout:${queuedLeg.id}:1`,
        rawTransactionHex: "persisted-payout",
        transactionHash: "payout-hash",
        validityStartHeight: 1_000
      }
    };
    const store = payoutRepository([preparedLeg]);
    let sends = 0;

    await runPayoutCycle({
      repository: store.value,
      signer: { async sign() { throw new Error("must not sign"); } },
      rpc: {
        async getBlockNumber() { return 1_001; },
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() {
          sends += 1;
          return "payout-hash";
        }
      },
      allowBroadcast: false
    });

    expect(sends).toBe(0);
    expect(store.events).toEqual([`checked:${queuedLeg.id}`]);
  });

  it("confirms a finalized prepared payout while new broadcasts are paused", async () => {
    const preparedLeg: PayoutTransferLeg = {
      ...queuedLeg,
      state: "prepared",
      attempt: {
        id: "attempt-1",
        sequence: 1,
        state: "prepared",
        dataReference: `pods:payout:${queuedLeg.id}:1`,
        rawTransactionHex: "persisted-payout",
        transactionHash: "payout-hash",
        validityStartHeight: 1_000
      }
    };
    const store = payoutRepository([preparedLeg]);

    await runPayoutCycle({
      repository: store.value,
      signer: { async sign() { throw new Error("must not sign"); } },
      rpc: {
        async getBlockNumber() { return 1_001; },
        async getTransactionByHash() {
          return {
            hash: "payout-hash",
            finalized: true,
            executionResult: true
          };
        },
        async sendRawTransaction() { throw new Error("must not broadcast"); }
      },
      allowBroadcast: false
    });

    expect(store.events).toEqual([`confirmed:${queuedLeg.id}`]);
  });

  it("persists unique signed attempt bytes before claiming and broadcasting", async () => {
    const store = payoutRepository([queuedLeg]);
    const transportEvents: string[] = [];

    await runPayoutCycle({
      repository: store.value,
      allowBroadcast: true,
      signer: {
        async sign(draft) {
          expect(draft).toEqual({
            recipient: queuedLeg.recipientWallet,
            valueLuna: 20_000n,
            network: "testnet",
            dataReference:
              "pods:payout:2f358296-7f67-4236-8dc2-45010c1af824:1"
          });
          return {
            rawTransactionHex: "signed-payout-bytes",
            hash: "payout-hash",
            validityStartHeight: 1_000
          };
        }
      },
      rpc: {
        async getBlockNumber() {
          return 1_000;
        },
        async getTransactionByHash() {
          transportEvents.push("chain-check");
          return undefined;
        },
        async sendRawTransaction(rawTransactionHex) {
          transportEvents.push(`send:${rawTransactionHex}`);
          return "payout-hash";
        }
      },
      now: () => new Date("2027-05-04T00:01:00.000Z")
    });

    expect(store.events).toEqual([
      `persist:${queuedLeg.id}:pods:payout:${queuedLeg.id}:1`,
      `claim:${queuedLeg.id}`,
      `broadcast:${queuedLeg.id}`
    ]);
    expect(transportEvents).toEqual([
      "chain-check",
      "send:signed-payout-bytes"
    ]);
  });

  it("uses the next immutable attempt sequence after an operations retry request", async () => {
    const retryLeg: PayoutTransferLeg = {
      ...queuedLeg,
      state: "queued",
      attempt: {
        id: "attempt-1",
        sequence: 1,
        state: "late",
        dataReference: `pods:payout:${queuedLeg.id}:1`,
        rawTransactionHex: "expired-payout",
        transactionHash: "expired-hash",
        validityStartHeight: 1_000
      }
    };
    const store = payoutRepository([retryLeg]);

    await runPayoutCycle({
      repository: store.value,
      allowBroadcast: true,
      signer: {
        async sign(draft) {
          expect(draft.dataReference).toBe(
            `pods:payout:${queuedLeg.id}:2`
          );
          return {
            rawTransactionHex: "replacement-payout",
            hash: "replacement-hash",
            validityStartHeight: 9_000
          };
        }
      },
      rpc: {
        async getBlockNumber() { return 9_000; },
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() { return "replacement-hash"; }
      }
    });

    expect(store.events[0]).toBe(
      `persist:${queuedLeg.id}:pods:payout:${queuedLeg.id}:2`
    );
  });

  it("never rebroadcasts an unknown attempt and marks it late only after expiry", async () => {
    const unknownLeg: PayoutTransferLeg = {
      ...queuedLeg,
      state: "unknown",
      attempt: {
        id: "attempt-1",
        sequence: 1,
        state: "unknown",
        dataReference: `pods:payout:${queuedLeg.id}:1`,
        rawTransactionHex: "ambiguous-payout",
        transactionHash: "payout-hash",
        validityStartHeight: 1_000
      }
    };
    const pending = payoutRepository([unknownLeg]);
    let sends = 0;

    await runPayoutCycle({
      repository: pending.value,
      allowBroadcast: true,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getBlockNumber() { return 8_200; },
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() {
          sends += 1;
          return "payout-hash";
        }
      }
    });

    expect(sends).toBe(0);
    expect(pending.events).toEqual([`checked:${queuedLeg.id}`]);

    const expired = payoutRepository([unknownLeg]);
    await runPayoutCycle({
      repository: expired.value,
      allowBroadcast: true,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getBlockNumber() { return 8_201; },
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() { throw new Error("must not broadcast"); }
      }
    });

    expect(expired.events).toEqual([`late:${queuedLeg.id}`]);
  });

  it("confirms a finalized chain transaction without broadcasting again", async () => {
    const preparedLeg: PayoutTransferLeg = {
      ...queuedLeg,
      state: "prepared",
      attempt: {
        id: "attempt-1",
        sequence: 1,
        state: "prepared",
        dataReference: `pods:payout:${queuedLeg.id}:1`,
        rawTransactionHex: "persisted-payout",
        transactionHash: "payout-hash",
        validityStartHeight: 1_000
      }
    };
    const store = payoutRepository([preparedLeg]);
    let sends = 0;

    await runPayoutCycle({
      repository: store.value,
      allowBroadcast: true,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getBlockNumber() { return 1_001; },
        async getTransactionByHash() {
          return {
            hash: "payout-hash",
            finalized: true,
            executionResult: true
          };
        },
        async sendRawTransaction() {
          sends += 1;
          return "payout-hash";
        }
      }
    });

    expect(sends).toBe(0);
    expect(store.events).toEqual([`confirmed:${queuedLeg.id}`]);
  });

  it("separates failed execution, returned-hash mismatch, and ambiguous broadcast", async () => {
    const preparedLeg: PayoutTransferLeg = {
      ...queuedLeg,
      state: "prepared",
      attempt: {
        id: "attempt-1",
        sequence: 1,
        state: "prepared",
        dataReference: `pods:payout:${queuedLeg.id}:1`,
        rawTransactionHex: "persisted-payout",
        transactionHash: "payout-hash",
        validityStartHeight: 1_000
      }
    };

    const failed = payoutRepository([preparedLeg]);
    await runPayoutCycle({
      repository: failed.value,
      allowBroadcast: true,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getBlockNumber() { return 1_001; },
        async getTransactionByHash() {
          return {
            hash: "payout-hash",
            finalized: true,
            executionResult: false
          };
        },
        async sendRawTransaction() { throw new Error("must not broadcast"); }
      }
    });
    expect(failed.events).toEqual([
      `retryable_failed:${queuedLeg.id}:execution_result_false`
    ]);

    const mismatched = payoutRepository([preparedLeg]);
    await runPayoutCycle({
      repository: mismatched.value,
      allowBroadcast: true,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getBlockNumber() { return 1_001; },
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() { return "different-hash"; }
      }
    });
    expect(mismatched.events).toEqual([
      `claim:${queuedLeg.id}`,
      `mismatched:${queuedLeg.id}:broadcast_hash_mismatch`
    ]);

    const ambiguous = payoutRepository([preparedLeg]);
    await runPayoutCycle({
      repository: ambiguous.value,
      allowBroadcast: true,
      signer: { async sign() { throw new Error("must not sign again"); } },
      rpc: {
        async getBlockNumber() { return 1_001; },
        async getTransactionByHash() { return undefined; },
        async sendRawTransaction() { throw new Error("timeout"); }
      }
    });
    expect(ambiguous.events).toEqual([
      `claim:${queuedLeg.id}`,
      `unknown:${queuedLeg.id}:broadcast_ambiguous`
    ]);
  });
});
