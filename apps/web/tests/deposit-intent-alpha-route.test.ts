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
});
