import { init } from "@nimiq/mini-app-sdk";

type ProviderError = { error: { type: string; message: string } };
type SignatureResult = { publicKey: string; signature: string };

interface WalletProviderLike {
  listAccounts(): Promise<string[] | ProviderError>;
  sign(input: { message: string }): Promise<SignatureResult | ProviderError>;
}

interface FundingProviderLike {
  sendBasicTransactionWithData(input: {
    recipient: string;
    value: number;
    data: string;
  }): Promise<string | ProviderError>;
}

export interface FundingPayment {
  recipient: string;
  valueLuna: number;
  reference: string;
}

function isProviderError(value: unknown): value is ProviderError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ProviderError).error?.message === "string"
  );
}

async function readResponse(response: Response): Promise<Record<string, unknown>> {
  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Wallet session request failed");
  }
  return data;
}

export async function establishWalletSession(dependencies?: {
  getProvider?: () => Promise<WalletProviderLike>;
  fetcher?: (path: string, init?: RequestInit) => Promise<Response>;
}) {
  const getProvider = dependencies?.getProvider ?? (() => init({ timeout: 8_000 }));
  const fetcher = dependencies?.fetcher ?? fetch;
  const provider = await getProvider();
  const accounts = await provider.listAccounts();
  if (isProviderError(accounts)) throw new Error(accounts.error.message);
  const walletAddress = accounts[0];
  if (!walletAddress) throw new Error("No Nimiq account is available in this wallet");

  const challenge = await readResponse(
    await fetcher("/api/auth/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ walletAddress })
    })
  );
  if (typeof challenge.id !== "string" || typeof challenge.message !== "string") {
    throw new Error("Wallet challenge response is incomplete");
  }

  const signed = await provider.sign({ message: challenge.message });
  if (isProviderError(signed)) throw new Error(signed.error.message);
  const session = await readResponse(
    await fetcher("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        challengeId: challenge.id,
        publicKey: signed.publicKey,
        signature: signed.signature
      })
    })
  );
  if (typeof session.walletAddress !== "string") {
    throw new Error("Wallet session response is incomplete");
  }
  return {
    walletAddress: session.walletAddress,
    needsProfile: session.needsProfile === true
  };
}

export async function sendNimCommitment(
  input: FundingPayment,
  dependencies?: { getProvider?: () => Promise<FundingProviderLike> }
) {
  if (!Number.isSafeInteger(input.valueLuna) || input.valueLuna <= 0) {
    throw new Error("Commitment must be a positive integer Luna amount");
  }
  const getProvider = dependencies?.getProvider ?? (() => init({ timeout: 8_000 }));
  const provider = await getProvider();
  const result = await provider.sendBasicTransactionWithData({
    recipient: input.recipient,
    value: input.valueLuna,
    data: input.reference
  });
  if (isProviderError(result)) throw new Error(result.error.message);
  if (!/^[a-f0-9]{64}$/.test(result)) {
    throw new Error("Wallet returned an invalid transaction hash");
  }
  return result;
}
