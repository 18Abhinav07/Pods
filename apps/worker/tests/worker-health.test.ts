import { describe, expect, it } from "vitest";

import { workerHealthResponse } from "../src/health/server";

const runtime = {
  deploymentFlavor: "testnet" as const,
  fundsNetwork: "nimiq-testnet" as const,
  commitSha: "abcdef012345",
  schemaVersion: "0017_robust_loners"
};

describe("worker health response", () => {
  it("reports process liveness without depending on cycle readiness", () => {
    expect(
      workerHealthResponse("/health/live", {
        ready: false,
        cycleHealthy: null,
        lastSuccessfulCycleAt: null,
        runtime
      })
    ).toEqual({
      statusCode: 200,
      body: { service: "pods-worker", status: "live" }
    });
  });

  it("reports readiness after startup and a healthy cycle", () => {
    expect(
      workerHealthResponse("/health/ready", {
        ready: true,
        cycleHealthy: true,
        lastSuccessfulCycleAt: "2026-07-21T12:00:00.000Z",
        runtime
      })
    ).toEqual({
      statusCode: 200,
      body: {
        service: "pods-worker",
        status: "ready",
        cycle: "healthy",
        lastSuccessfulCycleAt: "2026-07-21T12:00:00.000Z",
        runtime
      }
    });
  });

  it("fails readiness safely when the last cycle failed", () => {
    const response = workerHealthResponse("/health/ready", {
      ready: true,
      cycleHealthy: false,
      lastSuccessfulCycleAt: null,
      runtime
    });

    expect(response).toEqual({
      statusCode: 503,
      body: {
        service: "pods-worker",
        status: "not_ready",
        cycle: "failed",
        lastSuccessfulCycleAt: null,
        runtime
      }
    });
    expect(JSON.stringify(response)).not.toContain("rpc");
    expect(JSON.stringify(response)).not.toContain("private");
  });

  it("returns a small not-found response for unrelated paths", () => {
    expect(
      workerHealthResponse("/metrics", {
        ready: true,
        cycleHealthy: true,
        lastSuccessfulCycleAt: null,
        runtime
      })
    ).toEqual({ statusCode: 404, body: { error: "Not found" } });
  });
});
