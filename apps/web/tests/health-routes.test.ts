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
    checkHealth.mockResolvedValue({
      schemaVersion: "0017_robust_loners",
      migrationHash:
        "97136dbc69adf6a53bbcb077015df750ad185f71c022dbd27253f2bd150bc4cd"
    });
    assertReady.mockResolvedValue(undefined);
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv(
      "PODS_RELEASE_SHA",
      "abcdef0123456789abcdef0123456789abcdef01"
    );
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
        evidenceStorage: "ready",
        schema: "ready"
      },
      runtime: {
        deploymentFlavor: "testnet",
        fundsNetwork: "nimiq-testnet",
        commitSha: "abcdef012345",
        schemaVersion: "0017_robust_loners"
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
        evidenceStorage: "ready",
        schema: "failed"
      }
    });
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(JSON.stringify(body)).not.toContain("internal-host");
  });

  it("refuses readiness when the applied database schema is not the code-owned version", async () => {
    checkHealth.mockResolvedValueOnce({
      schemaVersion: "0016_previous_schema",
      migrationHash:
        "97136dbc69adf6a53bbcb077015df750ad185f71c022dbd27253f2bd150bc4cd"
    });

    const response = await getReady();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      service: "pods-web",
      status: "not_ready",
      checks: {
        configuration: "ready",
        database: "ready",
        evidenceStorage: "ready",
        schema: "failed"
      }
    });
  });

  it("refuses readiness when the applied migration hash is not the code-owned hash", async () => {
    checkHealth.mockResolvedValueOnce({
      schemaVersion: "0017_robust_loners",
      migrationHash: "0".repeat(64)
    });

    const response = await getReady();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      service: "pods-web",
      status: "not_ready",
      checks: {
        configuration: "ready",
        database: "ready",
        evidenceStorage: "ready",
        schema: "failed"
      }
    });
  });
});
