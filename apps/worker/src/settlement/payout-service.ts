import type {
  FundingNetwork,
  TransferAttemptState,
  TransferLegState
} from "@pods/domain";

import type {
  TransferRpc,
  TransferSigner,
  TransactionLookup
} from "../preflight/transfer-service.js";

const NIMIQ_TRANSACTION_VALIDITY_BLOCKS = 7_200;

export interface PayoutTransferAttempt {
  id: string;
  sequence: number;
  state: TransferAttemptState;
  dataReference: string;
  rawTransactionHex: string;
  transactionHash: string;
  validityStartHeight: number;
}

export interface PayoutTransferLeg {
  id: string;
  recipientWallet: string;
  amountLuna: number;
  network: FundingNetwork;
  state: TransferLegState;
  attempt: PayoutTransferAttempt | null;
}

interface TransitionInput {
  legId: string;
  attemptId: string;
  now: Date;
}

interface ErrorTransitionInput extends TransitionInput {
  errorCode: string;
}

export interface PayoutTransferRepository {
  listOpenPayoutTransferLegs(): Promise<PayoutTransferLeg[]>;
  persistPayoutTransferAttempt(input: {
    legId: string;
    dataReference: string;
    rawTransactionHex: string;
    transactionHash: string;
    validityStartHeight: number;
    now: Date;
  }): Promise<PayoutTransferLeg | null>;
  claimPayoutBroadcast(input: TransitionInput): Promise<boolean>;
  markPayoutTransferBroadcast(input: TransitionInput): Promise<unknown>;
  markPayoutTransferUnknown(input: ErrorTransitionInput): Promise<unknown>;
  markPayoutTransferRetryableFailed(
    input: ErrorTransitionInput
  ): Promise<unknown>;
  markPayoutTransferMismatched(input: ErrorTransitionInput): Promise<unknown>;
  markPayoutTransferLate(input: TransitionInput): Promise<unknown>;
  markPayoutTransferChecked(input: TransitionInput): Promise<unknown>;
  confirmPayoutTransfer(input: TransitionInput): Promise<unknown>;
}

interface PayoutRpc extends TransferRpc {
  getBlockNumber(): Promise<number>;
}

interface PayoutCycleDependencies {
  repository: PayoutTransferRepository;
  signer: TransferSigner;
  rpc: PayoutRpc;
  now?: () => Date;
  onError?: (error: Error, leg: PayoutTransferLeg) => void;
}

function requireAttempt(leg: PayoutTransferLeg) {
  if (!leg.attempt) {
    throw new Error(`Payout ${leg.id} is missing an immutable transfer attempt`);
  }
  return leg.attempt;
}

async function applyChainResult(
  repository: PayoutTransferRepository,
  leg: PayoutTransferLeg,
  transaction: TransactionLookup,
  now: Date
) {
  const attempt = requireAttempt(leg);
  if (transaction.hash !== attempt.transactionHash) {
    await repository.markPayoutTransferMismatched({
      legId: leg.id,
      attemptId: attempt.id,
      errorCode: "chain_hash_mismatch",
      now
    });
    return;
  }
  if (!transaction.executionResult) {
    await repository.markPayoutTransferRetryableFailed({
      legId: leg.id,
      attemptId: attempt.id,
      errorCode: "execution_result_false",
      now
    });
    return;
  }
  if (transaction.finalized) {
    await repository.confirmPayoutTransfer({
      legId: leg.id,
      attemptId: attempt.id,
      now
    });
    return;
  }
  await repository.markPayoutTransferChecked({
    legId: leg.id,
    attemptId: attempt.id,
    now
  });
}

async function processPayout(
  dependencies: PayoutCycleDependencies,
  original: PayoutTransferLeg
) {
  const now = (dependencies.now ?? (() => new Date()))();
  let leg = original;

  if (leg.state === "queued") {
    const sequence = (leg.attempt?.sequence ?? 0) + 1;
    const dataReference = `pods:payout:${leg.id}:${sequence}`;
    const signed = await dependencies.signer.sign({
      recipient: leg.recipientWallet,
      valueLuna: BigInt(leg.amountLuna),
      network: leg.network,
      dataReference
    });
    const prepared =
      await dependencies.repository.persistPayoutTransferAttempt({
        legId: leg.id,
        dataReference,
        rawTransactionHex: signed.rawTransactionHex,
        transactionHash: signed.hash,
        validityStartHeight: signed.validityStartHeight,
        now
      });
    if (!prepared) {
      throw new Error(`Payout ${leg.id} disappeared during preparation`);
    }
    leg = prepared;
  }

  const attempt = requireAttempt(leg);
  const transaction = await dependencies.rpc.getTransactionByHash(
    attempt.transactionHash
  );
  if (transaction) {
    await applyChainResult(dependencies.repository, leg, transaction, now);
    return;
  }

  if (leg.state !== "prepared") {
    const blockNumber = await dependencies.rpc.getBlockNumber();
    if (
      blockNumber >
      attempt.validityStartHeight + NIMIQ_TRANSACTION_VALIDITY_BLOCKS
    ) {
      await dependencies.repository.markPayoutTransferLate({
        legId: leg.id,
        attemptId: attempt.id,
        now
      });
    } else {
      await dependencies.repository.markPayoutTransferChecked({
        legId: leg.id,
        attemptId: attempt.id,
        now
      });
    }
    return;
  }

  const claimed = await dependencies.repository.claimPayoutBroadcast({
    legId: leg.id,
    attemptId: attempt.id,
    now
  });
  if (!claimed) return;

  try {
    const returnedHash = await dependencies.rpc.sendRawTransaction(
      attempt.rawTransactionHex
    );
    if (returnedHash !== attempt.transactionHash) {
      await dependencies.repository.markPayoutTransferMismatched({
        legId: leg.id,
        attemptId: attempt.id,
        errorCode: "broadcast_hash_mismatch",
        now
      });
      return;
    }
    await dependencies.repository.markPayoutTransferBroadcast({
      legId: leg.id,
      attemptId: attempt.id,
      now
    });
  } catch {
    await dependencies.repository.markPayoutTransferUnknown({
      legId: leg.id,
      attemptId: attempt.id,
      errorCode: "broadcast_ambiguous",
      now
    });
  }
}

export async function runPayoutCycle(
  dependencies: PayoutCycleDependencies
) {
  const legs = await dependencies.repository.listOpenPayoutTransferLegs();
  for (const leg of legs) {
    try {
      await processPayout(dependencies, leg);
    } catch (error) {
      dependencies.onError?.(
        error instanceof Error ? error : new Error("Payout cycle failed"),
        leg
      );
    }
  }
}
