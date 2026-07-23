import type {
  DepositExceptionCode,
  DepositState,
  FundingNetwork
} from "@pods/domain";

import {
  validateObservedDeposit,
  type DepositTransaction
} from "./deposit-reconciler.js";
import type { DepositRpc } from "./nimiq-deposit-rpc.js";

interface OpenDepositIntent {
  id: string;
  walletAddress: string;
  treasuryAddress: string;
  amountLuna: number;
  network: FundingNetwork;
  reference: string;
  state: DepositState;
  transactionHash: string | null;
}

interface DepositRepository {
  listOpenDepositIntents(): Promise<OpenDepositIntent[]>;
  isDepositTransactionHashClaimed(transactionHash: string, intentId: string): Promise<boolean>;
  recordObservedDeposit(input: {
    intentId: string;
    transactionHash: string;
    observedFrom: string;
    observedFromType: number;
    observedRelatedAddresses?: string[];
    blockNumber: number;
    transactionIndex: number;
    transactionBatch: number;
    now: Date;
  }): Promise<unknown>;
  finalizeObservedDeposit(input: { intentId: string; now: Date }): Promise<unknown>;
  creditFinalizedDeposit(input: { intentId: string; now: Date }): Promise<unknown>;
  recordDepositException(input: {
    intentId: string;
    code: DepositExceptionCode;
    now: Date;
  }): Promise<unknown>;
}

export interface DepositCycleDependencies {
  repository: DepositRepository;
  rpc: DepositRpc;
  now?: () => Date;
  scanLimit?: number;
  onError?: (error: Error) => void;
}

function sameTransaction(left: DepositTransaction, right: DepositTransaction) {
  return left.hash === right.hash;
}

export async function runDepositCycle(dependencies: DepositCycleDependencies) {
  const now = dependencies.now ?? (() => new Date());
  const onError = dependencies.onError ?? ((error: Error) => console.error(error));
  let intents: OpenDepositIntent[];
  try {
    intents = await dependencies.repository.listOpenDepositIntents();
  } catch (cause) {
    onError(cause instanceof Error ? cause : new Error("Deposit intent query failed"));
    return;
  }

  const scans = new Map<string, Promise<DepositTransaction[]>>();
  const blocks = new Map<number, ReturnType<DepositRpc["getBlockByNumber"]>>();
  let latestBlock: ReturnType<DepositRpc["getLatestBlock"]> | undefined;

  function scan(address: string) {
    let pending = scans.get(address);
    if (!pending) {
      pending = dependencies.rpc.getTransactionsByAddress(address, dependencies.scanLimit ?? 100);
      scans.set(address, pending);
    }
    return pending;
  }

  function containingBlock(blockNumber: number) {
    let pending = blocks.get(blockNumber);
    if (!pending) {
      pending = dependencies.rpc.getBlockByNumber(blockNumber);
      blocks.set(blockNumber, pending);
    }
    return pending;
  }

  function headBlock() {
    latestBlock ??= dependencies.rpc.getLatestBlock();
    return latestBlock;
  }

  for (const intent of intents) {
    try {
      if (intent.state === "finalized") {
        await dependencies.repository.creditFinalizedDeposit({ intentId: intent.id, now: now() });
        continue;
      }

      const treasuryTransactions = await scan(intent.treasuryAddress);
      const referenceMatches = treasuryTransactions.filter(
        (transaction) => transaction.recipientData === intent.reference
      );
      let candidate = referenceMatches[0];

      if (!candidate && intent.transactionHash) {
        const hinted = await dependencies.rpc.getTransactionByHash(intent.transactionHash);
        if (hinted) candidate = hinted;
      }
      if (!candidate) continue;

      const hintedDuplicate = referenceMatches.some(
        (match) => candidate && sameTransaction(match, candidate)
      );
      const matchingReferenceCount =
        referenceMatches.length +
        (candidate.recipientData === intent.reference && !hintedDuplicate ? 1 : 0);
      const [block, latest, hashClaimedByAnotherIntent] = await Promise.all([
        containingBlock(candidate.blockNumber),
        headBlock(),
        dependencies.repository.isDepositTransactionHashClaimed(candidate.hash, intent.id)
      ]);
      const classification = validateObservedDeposit(intent, candidate, {
        containingBlock: block,
        latestBlock: latest,
        matchingReferenceCount,
        hashClaimedByAnotherIntent
      });

      if (classification.classification === "exception") {
        await dependencies.repository.recordDepositException({
          intentId: intent.id,
          code: classification.code,
          now: now()
        });
        continue;
      }

      if (intent.state !== "observed") {
        await dependencies.repository.recordObservedDeposit({
          intentId: intent.id,
          transactionHash: candidate.hash,
          observedFrom: candidate.from,
          observedFromType: candidate.fromType,
          observedRelatedAddresses: candidate.relatedAddresses,
          blockNumber: candidate.blockNumber,
          transactionIndex: candidate.transactionIndex,
          transactionBatch: block.batch,
          now: now()
        });
      }
      if (classification.classification === "pending_finality") continue;
      await dependencies.repository.finalizeObservedDeposit({ intentId: intent.id, now: now() });
      await dependencies.repository.creditFinalizedDeposit({ intentId: intent.id, now: now() });
    } catch (cause) {
      onError(cause instanceof Error ? cause : new Error(`Deposit cycle failed for ${intent.id}`));
    }
  }
}
