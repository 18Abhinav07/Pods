import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentSession,
  getPodForOwner,
  getEffectiveTime,
  finalizePodSettlement
} = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getPodForOwner: vi.fn(),
  getEffectiveTime: vi.fn(),
  finalizePodSettlement: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getPodForOwner,
    getEffectiveTime,
    finalizePodSettlement
  }
}));

import { POST } from "../src/app/api/pods/[podId]/admin/settlement/route";

describe("creator settlement route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv("PODS_SETTLEMENT_ENABLED", "true");
    vi.stubEnv("PODS_PROPORTIONAL_PUBLISHING_ENABLED", "false");
    getCurrentSession.mockResolvedValue({ userId: "creator-1" });
    getEffectiveTime.mockResolvedValue(
      new Date("2027-05-04T00:00:00.000Z")
    );
    getPodForOwner.mockResolvedValue({
      id: "pod-1",
      creatorUserId: "creator-1",
      state: "final_review"
    });
    finalizePodSettlement.mockResolvedValue({
      kind: "finalized",
      settlement: { id: "settlement-1" }
    });
  });

  it("uses creator authorization and audited time for the canonical finalizer", async () => {
    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ podId: "pod-1" })
    });

    expect(response.status).toBe(200);
    expect(finalizePodSettlement).toHaveBeenCalledWith({
      podId: "pod-1",
      now: new Date("2027-05-04T00:00:00.000Z")
    });
  });

  it("does not expose finalization to a non-owner", async () => {
    getPodForOwner.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ podId: "pod-1" })
    });

    expect(response.status).toBe(404);
    expect(finalizePodSettlement).not.toHaveBeenCalled();
  });

  it("stops finalization when settlement processing is disabled", async () => {
    vi.stubEnv("PODS_SETTLEMENT_ENABLED", "false");

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ podId: "pod-1" })
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Settlement processing is paused"
    });
    expect(getPodForOwner).not.toHaveBeenCalled();
    expect(finalizePodSettlement).not.toHaveBeenCalled();
  });

  it("stops finalization during a financial incident", async () => {
    vi.stubEnv("PODS_FINANCIAL_INCIDENT_PAUSED", "true");

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ podId: "pod-1" })
    });

    expect(response.status).toBe(503);
    expect(finalizePodSettlement).not.toHaveBeenCalled();
  });
});
