import type { DepositExceptionCode, DepositState, FundingNetwork } from "@pods/domain";

type StoredDepositIntent = {
  id: string;
  podId: string;
  state: DepositState;
  treasuryAddress: string;
  amountLuna: number;
  network: FundingNetwork;
  reference: string;
  transactionHash: string | null;
  exceptionCode: DepositExceptionCode | null;
  expiresAt: Date;
};

export function readFundingConfiguration() {
  const network = process.env.NIMIQ_NETWORK;
  const treasuryAddress = process.env.PODS_TREASURY_ADDRESS?.trim();
  if (network !== "testnet") {
    throw new Error("Phase 3 funding is Testnet only");
  }
  if (!treasuryAddress) {
    throw new Error("PODS_TREASURY_ADDRESS is not configured");
  }
  return { network, treasuryAddress } as const;
}

export function participantDepositIntent(intent: StoredDepositIntent) {
  return {
    id: intent.id,
    podId: intent.podId,
    state: intent.state,
    recipient: intent.treasuryAddress,
    amountLuna: intent.amountLuna,
    network: intent.network,
    reference: intent.reference,
    transactionHash: intent.transactionHash,
    exceptionCode: intent.exceptionCode,
    expiresAt: intent.expiresAt.toISOString()
  };
}
