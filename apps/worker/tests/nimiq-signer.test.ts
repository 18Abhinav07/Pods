import { Transaction } from "@nimiq/core";
import { describe, expect, it } from "vitest";

import { NimiqTransferSigner } from "../src/preflight/nimiq-signer";

describe("NimiqTransferSigner", () => {
  it("creates a verified Testnet transaction from the configured treasury", async () => {
    const privateKeyHex = "11".repeat(32);
    const recipientPrivateKeyHex = "22".repeat(32);
    const recipientSigner = new NimiqTransferSigner({
      privateKeyHex: recipientPrivateKeyHex,
      getBlockNumber: async () => 6_407_500
    });
    const recipient = recipientSigner.address;
    const signer = new NimiqTransferSigner({
      privateKeyHex,
      getBlockNumber: async () => 6_407_500
    });

    const signed = await signer.sign({
      recipient,
      valueLuna: 1_000n,
      network: "testnet"
    });
    const transaction = Transaction.fromAny(signed.rawTransactionHex);

    expect(transaction.sender.toUserFriendlyAddress()).toBe(signer.address);
    expect(transaction.recipient.toUserFriendlyAddress()).toBe(recipient);
    expect(transaction.value).toBe(1_000n);
    expect(transaction.validityStartHeight).toBe(6_407_500);
    expect(transaction.networkId).toBe(5);
    expect(transaction.hash()).toBe(signed.hash);
    expect(() => transaction.verify(5)).not.toThrow();
  });

  it("rejects mainnet transfers in the Testnet preflight", async () => {
    const signer = new NimiqTransferSigner({
      privateKeyHex: "33".repeat(32),
      getBlockNumber: async () => 1
    });

    await expect(
      signer.sign({
        recipient: signer.address,
        valueLuna: 1n,
        network: "mainnet"
      })
    ).rejects.toThrow("Testnet only");
  });

  it("commits an opaque attempt reference so otherwise identical payouts have distinct hashes", async () => {
    const signer = new NimiqTransferSigner({
      privateKeyHex: "44".repeat(32),
      getBlockNumber: async () => 6_407_500
    });
    const recipientSigner = new NimiqTransferSigner({
      privateKeyHex: "55".repeat(32),
      getBlockNumber: async () => 6_407_500
    });

    const first = await signer.sign({
      recipient: recipientSigner.address,
      valueLuna: 10_000n,
      network: "testnet",
      dataReference: "pods:payout:leg-1:1"
    });
    const repeated = await signer.sign({
      recipient: recipientSigner.address,
      valueLuna: 10_000n,
      network: "testnet",
      dataReference: "pods:payout:leg-1:1"
    });
    const second = await signer.sign({
      recipient: recipientSigner.address,
      valueLuna: 10_000n,
      network: "testnet",
      dataReference: "pods:payout:leg-2:1"
    });
    const firstTransaction = Transaction.fromAny(first.rawTransactionHex);

    expect(new TextDecoder().decode(firstTransaction.data)).toBe(
      "pods:payout:leg-1:1"
    );
    expect(first.hash).toBe(repeated.hash);
    expect(first.hash).not.toBe(second.hash);
    expect(() => firstTransaction.verify(5)).not.toThrow();
  });
});
