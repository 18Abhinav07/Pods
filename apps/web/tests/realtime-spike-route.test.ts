import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession, getMembershipForUser, getPodForOwner } = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getMembershipForUser: vi.fn(),
  getPodForOwner: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { getMembershipForUser, getPodForOwner }
}));

import { POST } from "../src/app/api/validation/realtime/emit/route";

describe("realtime validation emit route", () => {
  beforeEach(() => {
    getCurrentSession.mockReset();
    getMembershipForUser.mockReset();
    getPodForOwner.mockReset();
    vi.stubEnv("PODS_REALTIME_SPIKE_ENABLED", "true");
    getCurrentSession.mockResolvedValue({ userId: "user-a" });
    getMembershipForUser.mockResolvedValue({ state: "accepted_unfunded" });
    getPodForOwner.mockResolvedValue(null);
  });

  function request(body: unknown) {
    return new Request("http://localhost/api/validation/realtime/emit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  it("is unavailable unless the server-side spike flag is enabled", async () => {
    vi.stubEnv("PODS_REALTIME_SPIKE_ENABLED", "false");

    const response = await POST(
      request({ podId: "pod-a", clientEventId: "one", kind: "message" })
    );

    expect(response.status).toBe(404);
  });

  it("requires an authenticated roster member or creator", async () => {
    getMembershipForUser.mockResolvedValueOnce({ state: "applied" });

    const response = await POST(
      request({ podId: "pod-a", clientEventId: "one", kind: "message" })
    );

    expect(response.status).toBe(403);
  });

  it("admits the creator without a membership", async () => {
    getMembershipForUser.mockResolvedValueOnce(null);
    getPodForOwner.mockResolvedValueOnce({ id: "pod-a" });

    const response = await POST(
      request({ podId: "pod-a", clientEventId: "creator-one", kind: "message" })
    );

    expect(response.status).toBe(201);
  });

  it("emits an authorized presentation-only event", async () => {
    const response = await POST(
      request({
        podId: "pod-a",
        clientEventId: "one",
        kind: "reaction"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({ clientEventId: "one", kind: "reaction" });
    expect(body).not.toHaveProperty("actorId");
    expect(body).not.toHaveProperty("userId");
  });
});
