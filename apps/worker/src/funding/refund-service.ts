import type { FundingNetwork, TransferLegState } from "@pods/domain";

import type {
  TransferRpc,
  TransferSigner,
  TransactionLookup
} from "../preflight/transfer-service.js";

export interface RefundTransferLeg {
  id: string;
  recipientWallet: string;
  amountLuna: number;
  network: FundingNetwork;
  state: TransferLegState;
  rawTransactionHex: string | null;
  transactionHash: string | null;
  validityStartHeight: number | null;
}

export interface RefundTransferRepository {
  listOpenRefundTransferLegs(): Promise<RefundTransferLeg[]>;
  markRefundTransferPrepared(input: {
    legId: string;
    rawTransactionHex: string;
    transactionHash: string;
    validityStartHeight: number;
    now: Date;
  }): Promise<RefundTransferLeg | null>;
  markRefundTransferBroadcast(input: {
    legId: string;
    now: Date;
  }): Promise<unknown>;
  markRefundTransferUnknown(input: {
    legId: string;
    errorCode: string;
    now: Date;
  }): Promise<unknown>;
  markRefundTransferRetryableFailed(input: {
    legId: string;
    errorCode: string;
    now: Date;
  }): Promise<unknown>;
  markRefundTransferMismatched(input: {
    legId: string;
    errorCode: string;
    now: Date;
  }): Promise<unknown>;
  confirmRefundTransfer(input: { legId: string; now: Date }): Promise<unknown>;
}

interface RefundCycleDependencies {
  repository: RefundTransferRepository;
  signer: TransferSigner;
  rpc: TransferRpc;
  allowBroadcast: boolean;
  now?: () => Date;
  onError?: (error: Error, leg: RefundTransferLeg) => void;
}

function requirePrepared(leg: RefundTransferLeg) {
  if (!leg.rawTransactionHex || !leg.transactionHash || leg.validityStartHeight === null) {
    throw new Error(`Refund ${leg.id} is missing persisted signed transfer data`);
  }
  return {
    rawTransactionHex: leg.rawTransactionHex,
    transactionHash: leg.transactionHash
  };
}

async function applyChainResult(
  repository: RefundTransferRepository,
  leg: RefundTransferLeg,
  transaction: TransactionLookup,
  now: Date
) {
  const { transactionHash } = requirePrepared(leg);
  if (transaction.hash !== transactionHash) {
    await repository.markRefundTransferMismatched({
      legId: leg.id,
      errorCode: "chain_hash_mismatch",
      now
    });
    return true;
  }
  if (!transaction.executionResult) {
    await repository.markRefundTransferRetryableFailed({
      legId: leg.id,
      errorCode: "execution_result_false",
      now
    });
    return true;
  }
  if (transaction.finalized) {
    await repository.confirmRefundTransfer({ legId: leg.id, now });
    return true;
  }
  return true;
}

async function processRefund(
  dependencies: RefundCycleDependencies,
  original: RefundTransferLeg
) {
  const now = (dependencies.now ?? (() => new Date()))();
  const allowBroadcast = dependencies.allowBroadcast;
  let leg = original;
  if (leg.state === "queued") {
    if (!allowBroadcast) return;
    const signed = await dependencies.signer.sign({
      recipient: leg.recipientWallet,
      valueLuna: BigInt(leg.amountLuna),
      network: leg.network
    });
    const prepared = await dependencies.repository.markRefundTransferPrepared({
      legId: leg.id,
      rawTransactionHex: signed.rawTransactionHex,
      transactionHash: signed.hash,
      validityStartHeight: signed.validityStartHeight,
      now
    });
    if (!prepared) throw new Error(`Refund ${leg.id} disappeared during preparation`);
    leg = prepared;
  }

  const { rawTransactionHex, transactionHash } = requirePrepared(leg);
  const transaction = await dependencies.rpc.getTransactionByHash(transactionHash);
  if (transaction) {
    await applyChainResult(dependencies.repository, leg, transaction, now);
    return;
  }

  if (leg.state !== "prepared") return;
  if (!allowBroadcast) return;
  try {
    const returnedHash = await dependencies.rpc.sendRawTransaction(rawTransactionHex);
    if (returnedHash !== transactionHash) {
      await dependencies.repository.markRefundTransferMismatched({
        legId: leg.id,
        errorCode: "broadcast_hash_mismatch",
        now
      });
      return;
    }
    await dependencies.repository.markRefundTransferBroadcast({ legId: leg.id, now });
  } catch {
    await dependencies.repository.markRefundTransferUnknown({
      legId: leg.id,
      errorCode: "broadcast_ambiguous",
      now
    });
  }
}

export async function runRefundCycle(dependencies: RefundCycleDependencies) {
  const legs = await dependencies.repository.listOpenRefundTransferLegs();
  for (const leg of legs) {
    try {
      await processRefund(dependencies, leg);
    } catch (error) {
      dependencies.onError?.(
        error instanceof Error ? error : new Error("Refund cycle failed"),
        leg
      );
    }
  }
}
