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
    vi.clearAllMocks();
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
});
