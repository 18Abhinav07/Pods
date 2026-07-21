import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkHealth, assertReady } = vi.hoisted(() => ({
  checkHealth: vi.fn(),
  assertReady: vi.fn()
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { checkHealth }
}));

vi.mock("../src/lib/evidence-storage", () => ({
  privateEvidenceStorage: () => ({ assertReady })
}));

import { GET as getLive } from "../src/app/api/health/live/route";
import { GET as getReady } from "../src/app/api/health/ready/route";

describe("web health routes", () => {
  beforeEach(() => {
    checkHealth.mockReset();
    assertReady.mockReset();
    checkHealth.mockResolvedValue(undefined);
    assertReady.mockResolvedValue(undefined);
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
  });

  it("reports process liveness without infrastructure details", async () => {
    const response = await getLive();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: "pods-web",
      status: "live"
    });
  });

  it("reports readiness only after database, storage, and configuration checks pass", async () => {
    const response = await getReady();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: "pods-web",
      status: "ready",
      checks: {
        configuration: "ready",
        database: "ready",
        evidenceStorage: "ready"
      }
    });
    expect(checkHealth).toHaveBeenCalledOnce();
    expect(assertReady).toHaveBeenCalledOnce();
  });

  it("returns a safe not-ready response without leaking dependency errors", async () => {
    checkHealth.mockRejectedValueOnce(
      new Error("postgresql://pods:secret@internal-host/pods")
    );

    const response = await getReady();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      service: "pods-web",
      status: "not_ready",
      checks: {
        configuration: "ready",
        database: "failed",
        evidenceStorage: "ready"
      }
    });
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(JSON.stringify(body)).not.toContain("internal-host");
  });
});
