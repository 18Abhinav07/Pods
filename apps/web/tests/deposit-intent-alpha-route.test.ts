import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession, createDepositIntent, getOpenDepositIntentForUser } =
  vi.hoisted(() => ({
    getCurrentSession: vi.fn(),
    createDepositIntent: vi.fn(),
    getOpenDepositIntentForUser: vi.fn()
  }));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { createDepositIntent, getOpenDepositIntentForUser }
}));

import { POST } from "../src/app/api/pods/[podId]/deposit-intents/route";

describe("deposit intent alpha lock", () => {
  beforeEach(() => {
    getCurrentSession.mockReset();
    createDepositIntent.mockReset();
    getOpenDepositIntentForUser.mockReset();
    getCurrentSession.mockResolvedValue({
      userId: "user-a",
      walletAddress: "NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6"
    });
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv("PODS_DEPOSIT_MODE", "off");
  });

  it("blocks intent creation before any funding repository call", async () => {
    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ podId: "pod-a" })
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "NIM commitments are not enabled in this alpha"
    });
    expect(getOpenDepositIntentForUser).not.toHaveBeenCalled();
    expect(createDepositIntent).not.toHaveBeenCalled();
  });

  it("passes the current contract acceptance into a proportional funding intent", async () => {
    vi.stubEnv("PODS_DEPOSIT_MODE", "public");
    vi.stubEnv("PODS_SETTLEMENT_ENABLED", "true");
    vi.stubEnv("PODS_TREASURY_ADDRESS", "NQ99 TEST TREASURY");
    getOpenDepositIntentForUser.mockResolvedValue(null);
    createDepositIntent.mockResolvedValue({
      id: "intent-a",
      podId: "pod-a",
      state: "intent_created",
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
    });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          acceptedContractHash: "contract-hash-1",
          settlementDisclosureAccepted: true
        })
      }),
      { params: Promise.resolve({ podId: "pod-a" }) }
    );

    expect(response.status).toBe(201);
    expect(createDepositIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        podId: "pod-a",
        userId: "user-a",
        acceptedContractHash: "contract-hash-1",
        settlementDisclosureAccepted: true
      })
    );
  });
});
