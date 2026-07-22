import { beforeEach, describe, expect, it, vi } from "vitest";

const { completeWalletSession, deleteSession, getProfileForUser } = vi.hoisted(() => ({
  completeWalletSession: vi.fn(),
  deleteSession: vi.fn(),
  getProfileForUser: vi.fn()
}));

vi.mock("../src/lib/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/lib/auth")>();
  return { ...original, completeWalletSession };
});
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { deleteSession, getProfileForUser }
}));

import { POST } from "../src/app/api/auth/verify/route";

describe("wallet verification alpha access", () => {
  beforeEach(() => {
    completeWalletSession.mockReset();
    deleteSession.mockReset();
    getProfileForUser.mockReset();
    getProfileForUser.mockResolvedValue(null);
    completeWalletSession.mockResolvedValue({
      walletAddress: "NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6",
      token: "session-token",
      tokenHash: "session-token-hash",
      expiresAt: new Date("2026-07-28T12:00:00.000Z")
    });
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv("PODS_ALPHA_ACCESS", "allowlist");
    vi.stubEnv("PODS_ALPHA_WALLET_ALLOWLIST", "");
  });

  it("removes the new session when the wallet is outside the allowlist", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeId: "challenge",
          publicKey: "public-key",
          signature: "signature"
        })
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "This wallet is not included in the current Pods alpha"
    });
    expect(deleteSession).toHaveBeenCalledWith("session-token-hash");
  });

  it("marks a first wallet session for mandatory profile onboarding", async () => {
    vi.stubEnv(
      "PODS_ALPHA_WALLET_ALLOWLIST",
      "NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6"
    );
    const response = await POST(
      new Request("http://localhost/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeId: "challenge",
          publicKey: "public-key",
          signature: "signature"
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      walletAddress: "NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6",
      needsProfile: true
    });
  });
});
