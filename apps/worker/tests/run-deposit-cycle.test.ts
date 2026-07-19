import type { DepositState } from "@pods/domain";
import { describe, expect, it, vi } from "vitest";

import type { DepositTransaction } from "../src/funding/deposit-reconciler";
import { runDepositCycle } from "../src/funding/run-deposit-cycle";

const treasuryAddress = "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A";

function openIntent(state: DepositState = "transaction_submitted") {
  return {
    id: "intent-1",
    walletAddress: "NQ34 8XNT QQD8 L8CF N92X 5BS8 P84Y GMF3 KKYQ",
    treasuryAddress,
    amountLuna: 100_000,
    network: "testnet" as const,
    reference: "pods-6032b85f8423909aacef4f79",
    state,
    transactionHash: state === "wallet_approval_pending" ? null : "a".repeat(64)
  };
}

function transaction(mutation: Partial<DepositTransaction> = {}): DepositTransaction {
  const intent = openIntent();
  return {
    hash: "c".repeat(64),
    from: "NQ32 5RAR 2L93 TYJ7 KDFQ BHT0 G6H9 NF2Y 1A87",
    fromType: 2,
    to: treasuryAddress,
    value: 100_000,
    recipientData: intent.reference,
    networkId: 5,
    executionResult: true,
    blockNumber: 6_407_464,
    transactionIndex: 3,
    relatedAddresses: [intent.walletAddress, treasuryAddress],
    ...mutation
  };
}

function repository(intents = [openIntent()]) {
  return {
    listOpenDepositIntents: vi.fn().mockResolvedValueOnce(intents).mockResolvedValue([]),
    isDepositTransactionHashClaimed: vi.fn(async () => false),
    recordObservedDeposit: vi.fn(async () => ({ state: "observed" })),
    finalizeObservedDeposit: vi.fn(async () => ({ state: "finalized" })),
    creditFinalizedDeposit: vi.fn(async () => ({ state: "credited_provisional" })),
    recordDepositException: vi.fn(async () => ({ state: "exception_review" }))
  };
}

function rpc(transactions = [transaction()]) {
  return {
    getTransactionsByAddress: vi.fn(async () => transactions),
    getTransactionByHash: vi.fn(async (hash: string) =>
      transactions.find((item) => item.hash === hash)
    ),
    getBlockByNumber: vi.fn(async (number: number) => ({
      number,
      batch: 56_258,
      network: "TestAlbatross"
    })),
    getLatestBlock: vi.fn(async () => ({
      number: 6_407_716,
      batch: 56_262,
      network: "TestAlbatross"
    }))
  };
}

describe("runDepositCycle", () => {
  it("observes, finalizes, and credits one exact transaction only once", async () => {
    const store = repository();
    const chain = rpc();

    await runDepositCycle({ repository: store, rpc: chain, now: () => new Date("2026-07-19T00:00:00.000Z") });
    await runDepositCycle({ repository: store, rpc: chain, now: () => new Date("2026-07-19T00:00:05.000Z") });

    expect(store.recordObservedDeposit).toHaveBeenCalledTimes(1);
    expect(store.finalizeObservedDeposit).toHaveBeenCalledTimes(1);
    expect(store.creditFinalizedDeposit).toHaveBeenCalledTimes(1);
    expect(chain.getTransactionsByAddress).toHaveBeenCalledTimes(1);
  });

  it("recovers a payment by reference when the WebView missed the hash callback", async () => {
    const store = repository([openIntent("wallet_approval_pending")]);

    await runDepositCycle({ repository: store, rpc: rpc(), now: () => new Date() });

    expect(store.recordObservedDeposit).toHaveBeenCalledWith(
      expect.objectContaining({ intentId: "intent-1", transactionHash: "c".repeat(64) })
    );
    expect(store.creditFinalizedDeposit).toHaveBeenCalledTimes(1);
  });

  it("uses a mismatched client hash only as a hint and credits the reference match", async () => {
    const correct = transaction();
    const wrongHint = transaction({
      hash: "a".repeat(64),
      recipientData: "pods-someone-else"
    });
    const store = repository();
    const chain = rpc([wrongHint, correct]);

    await runDepositCycle({ repository: store, rpc: chain, now: () => new Date() });

    expect(store.recordObservedDeposit).toHaveBeenCalledWith(
      expect.objectContaining({ transactionHash: correct.hash })
    );
    expect(store.recordDepositException).not.toHaveBeenCalled();
  });

  it("records one exact mismatch as an exception and never credits it", async () => {
    const store = repository();
    const chain = rpc([transaction({ value: 99_999 })]);

    await runDepositCycle({ repository: store, rpc: chain, now: () => new Date() });
    await runDepositCycle({ repository: store, rpc: chain, now: () => new Date() });

    expect(store.recordDepositException).toHaveBeenCalledTimes(1);
    expect(store.recordDepositException).toHaveBeenCalledWith(
      expect.objectContaining({ code: "amount_mismatch" })
    );
    expect(store.creditFinalizedDeposit).not.toHaveBeenCalled();
  });

  it("leaves the intent retryable when RPC fails", async () => {
    const store = repository();
    const onError = vi.fn();
    const chain = rpc();
    chain.getTransactionsByAddress.mockRejectedValue(new Error("RPC unavailable"));

    await runDepositCycle({ repository: store, rpc: chain, now: () => new Date(), onError });

    expect(store.recordObservedDeposit).not.toHaveBeenCalled();
    expect(store.recordDepositException).not.toHaveBeenCalled();
    expect(store.creditFinalizedDeposit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
