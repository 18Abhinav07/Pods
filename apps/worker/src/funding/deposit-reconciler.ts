import type { DepositExceptionCode, FundingNetwork } from "@pods/domain";

export interface DepositIntentForValidation {
  id: string;
  walletAddress: string;
  treasuryAddress: string;
  amountLuna: number;
  network: FundingNetwork;
  reference: string;
}

export interface DepositTransaction {
  hash: string;
  from: string;
  fromType: number;
  to: string;
  value: number;
  recipientData: string;
  networkId: number;
  executionResult: boolean;
  blockNumber: number;
  transactionIndex: number;
  relatedAddresses: string[];
}

export interface DepositBlock {
  number: number;
  batch: number;
  network: string;
}

export interface DepositChainContext {
  containingBlock: DepositBlock;
  latestBlock: DepositBlock;
  matchingReferenceCount: number;
  hashClaimedByAnotherIntent: boolean;
}

export interface DepositAudit {
  hash: string;
  from: string;
  fromType: number;
  relatedAddresses: string[];
  directWalletMatch: boolean;
  relatedWalletMatch: boolean;
  blockNumber: number;
  transactionIndex: number;
  transactionBatch: number | null;
  latestBatch: number | null;
}

export type DepositClassification =
  | { classification: "valid_observed"; audit: DepositAudit }
  | { classification: "valid_finalized"; audit: DepositAudit }
  | { classification: "pending_finality"; audit: DepositAudit }
  | { classification: "exception"; code: DepositExceptionCode; audit: DepositAudit };

function normalizedAddress(value: string) {
  return value.replaceAll(/\s/g, "").toUpperCase();
}

function isTestnetBlock(block: DepositBlock) {
  return block.network.toLowerCase() === "testalbatross";
}

function audit(
  intent: DepositIntentForValidation,
  transaction: DepositTransaction,
  context?: DepositChainContext
): DepositAudit {
  const wallet = normalizedAddress(intent.walletAddress);
  return {
    hash: transaction.hash,
    from: transaction.from,
    fromType: transaction.fromType,
    relatedAddresses: [...transaction.relatedAddresses],
    directWalletMatch: normalizedAddress(transaction.from) === wallet,
    relatedWalletMatch: transaction.relatedAddresses.some(
      (address) => normalizedAddress(address) === wallet
    ),
    blockNumber: transaction.blockNumber,
    transactionIndex: transaction.transactionIndex,
    transactionBatch: context?.containingBlock.batch ?? null,
    latestBatch: context?.latestBlock.batch ?? null
  };
}

export function validateObservedDeposit(
  intent: DepositIntentForValidation,
  transaction: DepositTransaction,
  context?: DepositChainContext
): DepositClassification {
  const depositAudit = audit(intent, transaction, context);
  const exception = (code: DepositExceptionCode): DepositClassification => ({
    classification: "exception",
    code,
    audit: depositAudit
  });

  if (
    intent.network !== "testnet" ||
    transaction.networkId !== 5 ||
    (context &&
      (!isTestnetBlock(context.containingBlock) || !isTestnetBlock(context.latestBlock)))
  ) {
    return exception("wrong_network");
  }
  if (normalizedAddress(transaction.to) !== normalizedAddress(intent.treasuryAddress)) {
    return exception("recipient_mismatch");
  }
  if (!Number.isSafeInteger(transaction.value) || transaction.value !== intent.amountLuna) {
    return exception("amount_mismatch");
  }
  if (!transaction.recipientData) return exception("reference_missing");
  if (transaction.recipientData !== intent.reference) return exception("reference_mismatch");
  if (
    context &&
    (context.matchingReferenceCount !== 1 || context.hashClaimedByAnotherIntent)
  ) {
    return exception("reference_duplicate");
  }
  if (!transaction.executionResult) return exception("execution_failed");
  if (!context) return { classification: "valid_observed", audit: depositAudit };
  if (context.latestBlock.batch <= context.containingBlock.batch) {
    return { classification: "pending_finality", audit: depositAudit };
  }
  return { classification: "valid_finalized", audit: depositAudit };
}
