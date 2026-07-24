import {
  Address,
  KeyPair,
  PrivateKey,
  TransactionBuilder
} from "@nimiq/core";

import type {
  SignedTransfer,
  TransferDraft,
  TransferSigner
} from "./transfer-service.js";

const TESTNET_NETWORK_ID = 5;

interface NimiqTransferSignerOptions {
  privateKeyHex: string;
  getBlockNumber: () => Promise<number>;
}

export class NimiqTransferSigner implements TransferSigner {
  readonly address: string;

  private readonly keyPair: KeyPair;
  private readonly getBlockNumber: () => Promise<number>;

  constructor(options: NimiqTransferSignerOptions) {
    this.keyPair = KeyPair.derive(PrivateKey.fromHex(options.privateKeyHex));
    this.address = this.keyPair.toAddress().toUserFriendlyAddress();
    this.getBlockNumber = options.getBlockNumber;
  }

  async sign(draft: TransferDraft): Promise<SignedTransfer> {
    if (draft.network !== "testnet") {
      throw new Error("Testnet only: the Phase 0 preflight cannot sign Mainnet transfers");
    }
    if (draft.valueLuna <= 0n) {
      throw new Error("Transfer value must be greater than zero Luna");
    }

    const validityStartHeight = await this.getBlockNumber();
    const data = draft.dataReference
      ? new TextEncoder().encode(draft.dataReference)
      : undefined;
    if (data && data.length > 64) {
      throw new Error("Transfer data reference must not exceed 64 UTF-8 bytes");
    }
    const transaction = data
      ? TransactionBuilder.newBasicWithData(
          this.keyPair.toAddress(),
          Address.fromString(draft.recipient),
          data,
          draft.valueLuna,
          0n,
          validityStartHeight,
          TESTNET_NETWORK_ID
        )
      : TransactionBuilder.newBasic(
          this.keyPair.toAddress(),
          Address.fromString(draft.recipient),
          draft.valueLuna,
          0n,
          validityStartHeight,
          TESTNET_NETWORK_ID
        );
    transaction.sign(this.keyPair, undefined);
    transaction.verify(TESTNET_NETWORK_ID);

    return {
      rawTransactionHex: transaction.toHex(),
      hash: transaction.hash(),
      validityStartHeight
    };
  }
}
