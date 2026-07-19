import { describe, expect, it } from "vitest";

import {
  broadcastPersistedTransfer,
  prepareTransfer,
  reconcileUnknownTransfer,
  type PreparedTransfer,
  type PersistedTransfer,
  type TransferDraft,
  type TransferRepository
} from "../src/preflight/transfer-service";

const draft: TransferDraft = {
  recipient: "NQ00 TEST RECIPIENT",
  valueLuna: 100_000n,
  network: "testnet"
};

function repository() {
  let record: PersistedTransfer | undefined;
  const events: string[] = [];

  const value: TransferRepository = {
    async savePrepared(next) {
      events.push("persisted");
      record = { ...next, state: "prepared" };
    },
    async getByHash(hash) {
      return record?.hash === hash ? record : undefined;
    },
    async markBroadcast(hash) {
      events.push(`broadcast:${hash}`);
      if (record?.hash === hash) record = { ...record, state: "broadcast" };
    },
    async markConfirmed(hash) {
      events.push(`confirmed:${hash}`);
      if (record?.hash === hash) record = { ...record, state: "confirmed" };
    },
    async markUnknown(hash, reason) {
      events.push(`unknown:${hash}:${reason}`);
      if (record?.hash === hash) record = { ...record, state: "unknown" };
    },
    async markFailed(hash, reason) {
      events.push(`failed:${hash}:${reason}`);
      if (record?.hash === hash) record = { ...record, state: "failed" };
    }
  };

  return { value, events, get record() { return record; } };
}

describe("transfer preflight", () => {
  it("persists signed bytes and hash before returning the prepared transfer", async () => {
    const store = repository();
    const signer = {
      async sign() {
        return { rawTransactionHex: "aabbcc", hash: "hash-1", validityStartHeight: 42 };
      }
    };

    const result = await prepareTransfer(draft, signer, store.value);

    expect(store.events).toEqual(["persisted"]);
    expect(store.record).toEqual({ ...result, state: "prepared" });
    expect(result.rawTransactionHex).toBe("aabbcc");
    expect(result.hash).toBe("hash-1");
  });

  it("broadcasts only the raw bytes loaded from persistence", async () => {
    const store = repository();
    const prepared: PreparedTransfer = {
      ...draft,
      rawTransactionHex: "persisted-bytes",
      hash: "hash-2",
      validityStartHeight: 50,
      preparedAt: "2026-07-19T00:00:00.000Z"
    };
    await store.value.savePrepared(prepared);
    const broadcasts: string[] = [];

    await broadcastPersistedTransfer(prepared.hash, store.value, {
      async sendRawTransaction(raw) {
        broadcasts.push(raw);
        return prepared.hash;
      },
      async getTransactionByHash() {
        return undefined;
      }
    });

    expect(broadcasts).toEqual(["persisted-bytes"]);
    expect(store.events).toContain("broadcast:hash-2");
  });

  it("refuses to broadcast a transfer that is no longer prepared", async () => {
    const store = repository();
    const prepared: PreparedTransfer = {
      ...draft,
      rawTransactionHex: "persisted-once",
      hash: "hash-once",
      validityStartHeight: 55,
      preparedAt: "2026-07-19T00:00:00.000Z"
    };
    await store.value.savePrepared(prepared);
    let broadcastCount = 0;
    const rpc = {
      async sendRawTransaction() {
        broadcastCount += 1;
        return prepared.hash;
      },
      async getTransactionByHash() {
        return undefined;
      }
    };

    await broadcastPersistedTransfer(prepared.hash, store.value, rpc);
    await expect(
      broadcastPersistedTransfer(prepared.hash, store.value, rpc)
    ).rejects.toThrow("must be reconciled");

    expect(broadcastCount).toBe(1);
  });

  it("reconciles an unknown response by hash without broadcasting again", async () => {
    const store = repository();
    const prepared: PreparedTransfer = {
      ...draft,
      rawTransactionHex: "signed-once",
      hash: "hash-3",
      validityStartHeight: 60,
      preparedAt: "2026-07-19T00:00:00.000Z"
    };
    await store.value.savePrepared(prepared);
    let broadcastCount = 0;

    const result = await reconcileUnknownTransfer(prepared.hash, store.value, {
      async sendRawTransaction() {
        broadcastCount += 1;
        return prepared.hash;
      },
      async getTransactionByHash() {
        return {
          hash: prepared.hash,
          finalized: true,
          executionResult: true
        };
      }
    });

    expect(result).toBe("confirmed");
    expect(broadcastCount).toBe(0);
    expect(store.events).toContain("confirmed:hash-3");
  });

  it("does not confirm a finalized transaction whose execution failed", async () => {
    const store = repository();
    const prepared: PreparedTransfer = {
      ...draft,
      rawTransactionHex: "failed-on-chain",
      hash: "hash-4",
      validityStartHeight: 70,
      preparedAt: "2026-07-19T00:00:00.000Z"
    };
    await store.value.savePrepared(prepared);

    const result = await reconcileUnknownTransfer(prepared.hash, store.value, {
      async sendRawTransaction() {
        throw new Error("must not broadcast during reconciliation");
      },
      async getTransactionByHash() {
        return { hash: prepared.hash, finalized: true, executionResult: false };
      }
    });

    expect(result).toBe("failed");
    expect(store.events).toContain("failed:hash-4:execution_result_false");
    expect(store.events).not.toContain("confirmed:hash-4");
  });
});
