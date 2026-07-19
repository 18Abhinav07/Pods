import { describe, expect, it, vi } from "vitest";

import { NimiqDepositRpc } from "../src/funding/nimiq-deposit-rpc";
import {
  validateObservedDeposit,
  type DepositChainContext,
  type DepositIntentForValidation,
  type DepositTransaction
} from "../src/funding/deposit-reconciler";

const intent: DepositIntentForValidation = {
  id: "intent-1",
  walletAddress: "NQ34 8XNT QQD8 L8CF N92X 5BS8 P84Y GMF3 KKYQ",
  treasuryAddress: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
  amountLuna: 100_000,
  network: "testnet",
  reference: "pods-6032b85f8423909aacef4f79"
};

const transaction: DepositTransaction = {
  hash: "c".repeat(64),
  from: "NQ32 5RAR 2L93 TYJ7 KDFQ BHT0 G6H9 NF2Y 1A87",
  fromType: 2,
  to: intent.treasuryAddress,
  value: 100_000,
  recipientData: intent.reference,
  networkId: 5,
  executionResult: true,
  blockNumber: 6_407_464,
  transactionIndex: 3,
  relatedAddresses: [intent.walletAddress, intent.treasuryAddress]
};

const finalizedChain: DepositChainContext = {
  containingBlock: { number: 6_407_464, batch: 56_258, network: "TestAlbatross" },
  latestBlock: { number: 6_407_716, batch: 56_262, network: "TestAlbatross" },
  matchingReferenceCount: 1,
  hashClaimedByAnotherIntent: false
};

function rpcResponse(data: unknown) {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: 1, result: { data, metadata: null } }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

describe("NimiqDepositRpc", () => {
  it("uses the official address scan shape and decodes recipient data", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
      rpcResponse([
        {
          ...transaction,
          recipientData: [...new TextEncoder().encode(intent.reference)]
        }
      ])
    );
    const rpc = new NimiqDepositRpc("https://rpc.testnet.example", fetcher);

    await expect(rpc.getTransactionsByAddress(intent.treasuryAddress, 50))
      .resolves.toEqual([transaction]);
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({
      method: "getTransactionsByAddress",
      params: [intent.treasuryAddress, 50]
    });
  });

  it("reads a transaction and its containing and latest block", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(rpcResponse({ ...transaction, recipientData: intent.reference }))
      .mockResolvedValueOnce(rpcResponse(finalizedChain.containingBlock))
      .mockResolvedValueOnce(rpcResponse(finalizedChain.latestBlock));
    const rpc = new NimiqDepositRpc("https://rpc.testnet.example", fetcher);

    await expect(rpc.getTransactionByHash(transaction.hash)).resolves.toEqual(transaction);
    await expect(rpc.getBlockByNumber(transaction.blockNumber))
      .resolves.toEqual(finalizedChain.containingBlock);
    await expect(rpc.getLatestBlock()).resolves.toEqual(finalizedChain.latestBlock);
  });
});

describe("deposit reconciliation", () => {
  it("accepts the validated HTLC funding path without requiring direct sender equality", () => {
    expect(validateObservedDeposit(intent, transaction, finalizedChain)).toMatchObject({
      classification: "valid_finalized",
      audit: {
        from: transaction.from,
        fromType: 2,
        directWalletMatch: false,
        relatedWalletMatch: true,
        transactionBatch: 56_258,
        latestBatch: 56_262
      }
    });
  });

  it.each([
    [{ to: "NQ00 WRONG" }, "recipient_mismatch"],
    [{ value: 99_999 }, "amount_mismatch"],
    [{ networkId: 42 }, "wrong_network"],
    [{ recipientData: "" }, "reference_missing"],
    [{ recipientData: "pods-wrong" }, "reference_mismatch"],
    [{ executionResult: false }, "execution_failed"]
  ] as const)("classifies transaction mutation %j as %s", (mutation, code) => {
    expect(
      validateObservedDeposit(intent, { ...transaction, ...mutation }, finalizedChain)
    ).toMatchObject({ classification: "exception", code });
  });

  it("rejects a reference or hash already bound elsewhere", () => {
    expect(
      validateObservedDeposit(intent, transaction, {
        ...finalizedChain,
        matchingReferenceCount: 2
      })
    ).toMatchObject({ classification: "exception", code: "reference_duplicate" });
    expect(
      validateObservedDeposit(intent, transaction, {
        ...finalizedChain,
        hashClaimedByAnotherIntent: true
      })
    ).toMatchObject({ classification: "exception", code: "reference_duplicate" });
  });

  it("waits through the containing macro batch and finalizes only in a later batch", () => {
    expect(
      validateObservedDeposit(intent, transaction, {
        ...finalizedChain,
        latestBlock: { ...finalizedChain.latestBlock, batch: 56_258 }
      })
    ).toMatchObject({ classification: "pending_finality" });
    expect(validateObservedDeposit(intent, transaction, finalizedChain))
      .toMatchObject({ classification: "valid_finalized" });
  });

  it("rejects a block-network mismatch even when the transaction network id looks valid", () => {
    expect(
      validateObservedDeposit(intent, transaction, {
        ...finalizedChain,
        containingBlock: { ...finalizedChain.containingBlock, network: "MainAlbatross" }
      })
    ).toMatchObject({ classification: "exception", code: "wrong_network" });
  });
});
