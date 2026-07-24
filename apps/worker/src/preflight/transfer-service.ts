export type TransferNetwork = "testnet" | "mainnet";

export interface TransferDraft {
  recipient: string;
  valueLuna: bigint;
  network: TransferNetwork;
  dataReference?: string;
}

export interface SignedTransfer {
  rawTransactionHex: string;
  hash: string;
  validityStartHeight: number;
}

export interface PreparedTransfer extends TransferDraft, SignedTransfer {
  preparedAt: string;
}

export type PersistedTransferState =
  | "prepared"
  | "broadcast"
  | "unknown"
  | "confirmed"
  | "failed";

export interface PersistedTransfer extends PreparedTransfer {
  state: PersistedTransferState;
}

export interface TransferSigner {
  sign(draft: TransferDraft): Promise<SignedTransfer>;
}

export interface TransferRepository {
  savePrepared(transfer: PreparedTransfer): Promise<void>;
  getByHash(hash: string): Promise<PersistedTransfer | undefined>;
  markBroadcast(hash: string): Promise<void>;
  markConfirmed(hash: string): Promise<void>;
  markUnknown(hash: string, reason: string): Promise<void>;
  markFailed(hash: string, reason: string): Promise<void>;
}

export interface TransactionLookup {
  hash: string;
  finalized: boolean;
  executionResult: boolean;
  blockNumber?: number;
  transactionBatch?: number;
  latestBatch?: number;
}

export interface TransferRpc {
  sendRawTransaction(rawTransactionHex: string): Promise<string>;
  getTransactionByHash(hash: string): Promise<TransactionLookup | undefined>;
}

export async function prepareTransfer(
  draft: TransferDraft,
  signer: TransferSigner,
  repository: TransferRepository,
  now: () => Date = () => new Date()
): Promise<PreparedTransfer> {
  const signed = await signer.sign(draft);
  const prepared: PreparedTransfer = {
    ...draft,
    ...signed,
    preparedAt: now().toISOString()
  };

  await repository.savePrepared(prepared);
  return prepared;
}

export async function broadcastPersistedTransfer(
  hash: string,
  repository: TransferRepository,
  rpc: TransferRpc
): Promise<void> {
  const prepared = await repository.getByHash(hash);
  if (!prepared) {
    throw new Error(`Prepared transfer not found: ${hash}`);
  }
  if (prepared.state !== "prepared") {
    throw new Error(
      `Transfer ${hash} is ${prepared.state} and must be reconciled before any retry`
    );
  }

  const returnedHash = await rpc.sendRawTransaction(prepared.rawTransactionHex);
  if (returnedHash !== prepared.hash) {
    throw new Error(`Broadcast hash mismatch for ${hash}`);
  }

  await repository.markBroadcast(hash);
}

export async function reconcileUnknownTransfer(
  hash: string,
  repository: TransferRepository,
  rpc: TransferRpc
): Promise<"confirmed" | "failed" | "pending" | "not_found"> {
  const prepared = await repository.getByHash(hash);
  if (!prepared) {
    throw new Error(`Prepared transfer not found: ${hash}`);
  }

  const transaction = await rpc.getTransactionByHash(prepared.hash);
  if (!transaction) {
    return "not_found";
  }

  if (!transaction.executionResult) {
    await repository.markFailed(hash, "execution_result_false");
    return "failed";
  }

  if (!transaction.finalized) {
    return "pending";
  }

  await repository.markConfirmed(hash);
  return "confirmed";
}
