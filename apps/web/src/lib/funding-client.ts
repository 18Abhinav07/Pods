import type { DepositExceptionCode, DepositState, FundingNetwork } from "@pods/domain";

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

export interface ParticipantDepositIntent {
  id: string;
  podId: string;
  state: DepositState;
  recipient: string;
  amountLuna: number;
  network: FundingNetwork;
  reference: string;
  transactionHash: string | null;
  exceptionCode: DepositExceptionCode | null;
  expiresAt: string;
  observedAt: string | null;
  finalizedAt: string | null;
  creditedAt: string | null;
}

const depositStates = new Set<DepositState>([
  "intent_created",
  "wallet_approval_pending",
  "wallet_rejected",
  "transaction_submitted",
  "observed",
  "finalized",
  "credited_provisional",
  "applied_to_roster",
  "exception_review",
  "refund_pending",
  "refunded"
]);

async function readResponse(response: Response): Promise<ParticipantDepositIntent> {
  const data = (await response.json()) as { error?: unknown; intent?: unknown };
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Deposit intent request failed"
    );
  }
  const intent = data.intent;
  if (
    typeof intent !== "object" ||
    intent === null ||
    typeof (intent as ParticipantDepositIntent).id !== "string" ||
    typeof (intent as ParticipantDepositIntent).podId !== "string" ||
    !depositStates.has((intent as ParticipantDepositIntent).state) ||
    typeof (intent as ParticipantDepositIntent).recipient !== "string" ||
    !Number.isSafeInteger((intent as ParticipantDepositIntent).amountLuna) ||
    ((intent as ParticipantDepositIntent).network !== "testnet" &&
      (intent as ParticipantDepositIntent).network !== "mainnet") ||
    typeof (intent as ParticipantDepositIntent).reference !== "string" ||
    typeof (intent as ParticipantDepositIntent).expiresAt !== "string" ||
    !nullableString((intent as ParticipantDepositIntent).observedAt) ||
    !nullableString((intent as ParticipantDepositIntent).finalizedAt) ||
    !nullableString((intent as ParticipantDepositIntent).creditedAt)
  ) {
    throw new Error("Deposit intent response is incomplete");
  }
  return intent as ParticipantDepositIntent;
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export async function createDepositIntent(
  podId: string,
  acceptance: {
    contractHash: string;
    settlementDisclosureAccepted: boolean;
  },
  fetcher: Fetcher = fetch
) {
  return readResponse(
    await fetcher(`/api/pods/${podId}/deposit-intents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        acceptedContractHash: acceptance.contractHash,
        settlementDisclosureAccepted:
          acceptance.settlementDisclosureAccepted
      })
    })
  );
}

export async function recordDepositWalletAttempt(
  intentId: string,
  event: "open" | "rejected",
  fetcher: Fetcher = fetch
) {
  return readResponse(
    await fetcher(`/api/deposit-intents/${intentId}/wallet-attempt`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event })
    })
  );
}

export async function recordDepositTransactionHint(
  intentId: string,
  transactionHash: string,
  fetcher: Fetcher = fetch
) {
  return readResponse(
    await fetcher(`/api/deposit-intents/${intentId}/transaction-hint`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transactionHash })
    })
  );
}

export async function getDepositIntent(intentId: string, fetcher: Fetcher = fetch) {
  return readResponse(await fetcher(`/api/deposit-intents/${intentId}`));
}
