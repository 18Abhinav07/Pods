import { describe, expect, it, vi } from "vitest";

import { establishWalletSession } from "../src/lib/nimiq-wallet-client";

describe("Nimiq wallet client flow", () => {
  it("lists an account, signs the server challenge, and verifies the session", async () => {
    const provider = {
      listAccounts: vi.fn(async () => ["NQ00 TEST"]),
      sign: vi.fn(async () => ({ publicKey: "public-key", signature: "signature" }))
    };
    const requests: Array<{ path: string; body: unknown }> = [];
    const fetcher = vi.fn(async (path: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({ path, body });
      if (path === "/api/auth/challenge") {
        return new Response(JSON.stringify({ id: "challenge-id", message: "Sign this" }), {
          status: 200
        });
      }
      return new Response(JSON.stringify({ walletAddress: "NQ00 TEST" }), { status: 200 });
    });

    const session = await establishWalletSession({
      getProvider: async () => provider,
      fetcher
    });

    expect(provider.sign).toHaveBeenCalledWith({ message: "Sign this" });
    expect(requests).toEqual([
      { path: "/api/auth/challenge", body: { walletAddress: "NQ00 TEST" } },
      {
        path: "/api/auth/verify",
        body: {
          challengeId: "challenge-id",
          publicKey: "public-key",
          signature: "signature"
        }
      }
    ]);
    expect(session.walletAddress).toBe("NQ00 TEST");
  });

  it("surfaces provider and wallet rejection states without creating a session", async () => {
    const fetcher = vi.fn();
    await expect(
      establishWalletSession({
        getProvider: async () => ({
          listAccounts: async () => ({ error: { type: "rejected", message: "Wallet closed" } }),
          sign: async () => ({ publicKey: "", signature: "" })
        }),
        fetcher
      })
    ).rejects.toThrow("Wallet closed");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
