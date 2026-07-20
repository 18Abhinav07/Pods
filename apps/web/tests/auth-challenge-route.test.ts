import { beforeEach, describe, expect, it, vi } from "vitest";

const { createChallenge } = vi.hoisted(() => ({ createChallenge: vi.fn() }));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { createChallenge }
}));

import { POST } from "../src/app/api/auth/challenge/route";

const validWalletAddress = "NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6";

function challengeRequest(walletAddress: unknown) {
  return new Request("http://localhost/api/auth/challenge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ walletAddress })
  });
}

describe("wallet challenge route", () => {
  beforeEach(() => {
    createChallenge.mockReset();
  });

  it("returns an address error only for an invalid address", async () => {
    const response = await POST(challengeRequest("not-a-nimiq-address"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A valid Nimiq wallet address is required"
    });
    expect(createChallenge).not.toHaveBeenCalled();
  });

  it("reports repository failures as temporary service failures", async () => {
    createChallenge.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await POST(challengeRequest(validWalletAddress));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Wallet sign-in is temporarily unavailable. Please try again shortly."
    });
  });
});
