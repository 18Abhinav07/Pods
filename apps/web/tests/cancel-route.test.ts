import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession, cancelEnrollmentPod } = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  cancelEnrollmentPod: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { cancelEnrollmentPod }
}));

import { POST } from "../src/app/api/pods/[podId]/cancel/route";

describe("Pod cancellation financial controls", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv("PODS_FINANCIAL_INCIDENT_PAUSED", "true");
    getCurrentSession.mockResolvedValue({ userId: "creator-1" });
  });

  it("does not create cancellation or refund obligations during an incident", async () => {
    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ podId: "pod-1" })
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Financial activity is paused"
    });
    expect(cancelEnrollmentPod).not.toHaveBeenCalled();
  });
});
