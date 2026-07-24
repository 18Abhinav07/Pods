import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession, recordDepositWalletAttempt } = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  recordDepositWalletAttempt: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { recordDepositWalletAttempt }
}));

import { POST } from "../src/app/api/deposit-intents/[intentId]/wallet-attempt/route";

const storedIntent = {
  id: "intent-1",
  podId: "pod-1",
  state: "wallet_rejected",
  treasuryAddress: "NQ99 TEST TREASURY",
  amountLuna: 10_000,
  network: "testnet",
  reference: "pods-reference",
  transactionHash: null,
  exceptionCode: null,
  expiresAt: new Date("2027-05-01T00:00:00.000Z"),
  observedAt: null,
  finalizedAt: null,
  creditedAt: null
};

function walletEvent(event: "open" | "rejected") {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event })
  });
}

describe("deposit wallet attempt intake controls", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv("PODS_DEPOSIT_MODE", "public");
    vi.stubEnv("PODS_SETTLEMENT_ENABLED", "true");
    getCurrentSession.mockResolvedValue({ userId: "member-1" });
    recordDepositWalletAttempt.mockResolvedValue(storedIntent);
  });

  it("blocks opening the wallet during a financial incident", async () => {
    vi.stubEnv("PODS_FINANCIAL_INCIDENT_PAUSED", "true");

    const response = await POST(walletEvent("open"), {
      params: Promise.resolve({ intentId: "intent-1" })
    });

    expect(response.status).toBe(403);
    expect(recordDepositWalletAttempt).not.toHaveBeenCalled();
  });

  it("blocks opening the wallet while public settlement processing is off", async () => {
    vi.stubEnv("PODS_SETTLEMENT_ENABLED", "false");
    vi.stubEnv("PODS_PROPORTIONAL_PUBLISHING_ENABLED", "false");

    const response = await POST(walletEvent("open"), {
      params: Promise.resolve({ intentId: "intent-1" })
    });

    expect(response.status).toBe(403);
    expect(recordDepositWalletAttempt).not.toHaveBeenCalled();
  });

  it("records wallet rejection while new intake is paused", async () => {
    vi.stubEnv("PODS_FINANCIAL_INCIDENT_PAUSED", "true");

    const response = await POST(walletEvent("rejected"), {
      params: Promise.resolve({ intentId: "intent-1" })
    });

    expect(response.status).toBe(200);
    expect(recordDepositWalletAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        intentId: "intent-1",
        userId: "member-1",
        event: "rejected"
      })
    );
  });
});
