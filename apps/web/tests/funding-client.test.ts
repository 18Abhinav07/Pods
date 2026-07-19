import { describe, expect, it, vi } from "vitest";

import {
  createDepositIntent,
  getDepositIntent,
  recordDepositTransactionHint,
  recordDepositWalletAttempt
} from "../src/lib/funding-client";

const intent = {
  id: "intent-1",
  podId: "pod-1",
  state: "intent_created",
  recipient: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
  amountLuna: 50_000,
  network: "testnet",
  reference: "pods-00112233445566778899aabb",
  transactionHash: null,
  exceptionCode: null,
  expiresAt: "2027-03-08T00:00:00.000Z",
  observedAt: null,
  finalizedAt: null,
  creditedAt: null
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("funding client", () => {
  it("creates a server-derived Pod deposit intent without sending money fields", async () => {
    const fetcher = vi.fn(async () => response({ intent }, 201));

    await expect(createDepositIntent("pod-1", fetcher)).resolves.toEqual(intent);
    expect(fetcher).toHaveBeenCalledWith("/api/pods/pod-1/deposit-intents", {
      method: "POST",
      headers: { "content-type": "application/json" }
    });
  });

  it("records wallet handoff events without exposing a state setter", async () => {
    const fetcher = vi.fn(async () =>
      response({ intent: { ...intent, state: "wallet_approval_pending" } })
    );

    await recordDepositWalletAttempt("intent-1", "open", fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "/api/deposit-intents/intent-1/wallet-attempt",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "open" })
      }
    );
  });

  it("persists a wallet-returned hash only as a transaction hint", async () => {
    const transactionHash = "a".repeat(64);
    const fetcher = vi.fn(async () =>
      response({ intent: { ...intent, state: "transaction_submitted", transactionHash } })
    );

    await recordDepositTransactionHint("intent-1", transactionHash, fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "/api/deposit-intents/intent-1/transaction-hint",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash })
      }
    );
  });

  it("reads participant-safe status and surfaces server errors", async () => {
    const successfulFetcher = vi.fn(async () => response({ intent }));
    await expect(getDepositIntent("intent-1", successfulFetcher)).resolves.toEqual(intent);

    const rejectedFetcher = vi.fn(async () =>
      response({ error: "Deposit intent is unavailable" }, 404)
    );
    await expect(getDepositIntent("intent-1", rejectedFetcher)).rejects.toThrow(
      "Deposit intent is unavailable"
    );
  });

  it("rejects an incomplete server response instead of inventing transaction values", async () => {
    const fetcher = vi.fn(async () => response({ intent: { id: "intent-1" } }, 201));

    await expect(createDepositIntent("pod-1", fetcher)).rejects.toThrow(
      "Deposit intent response is incomplete"
    );
  });
});
