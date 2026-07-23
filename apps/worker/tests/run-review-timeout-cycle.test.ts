import { afterEach, describe, expect, it, vi } from "vitest";

import { runReviewTimeoutCycle } from "../src/activity/run-review-timeout-cycle";
import { startFundingWorker } from "../src/index";

const workerMocks = vi.hoisted(() => ({
  repository: {
    checkHealth: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    getEffectiveTime: vi.fn(async (realNow: Date) => realNow),
    protectTimedOutReviews: vi.fn(async () => ({ protectedSubmissions: 0 }))
  },
  runOccurrenceCycle: vi.fn(async () => undefined),
  runRefundCycle: vi.fn(async () => undefined),
  healthClose: vi.fn(async () => undefined),
  healthStateReader: undefined as undefined | (() => {
    ready: boolean;
    cycleHealthy: boolean | null;
    lastSuccessfulCycleAt: string | null;
  })
}));

vi.mock("@pods/db", () => ({
  createPodsRepository: vi.fn(() => workerMocks.repository)
}));

vi.mock("../src/funding/nimiq-deposit-rpc.js", () => ({
  NimiqDepositRpc: class NimiqDepositRpc {}
}));

vi.mock("../src/funding/run-deposit-cycle.js", () => ({
  runDepositCycle: vi.fn(async () => undefined)
}));

vi.mock("../src/funding/run-cutoff-cycle.js", () => ({
  runCutoffCycle: vi.fn(async () => undefined)
}));

vi.mock("../src/funding/refund-service.js", () => ({
  runRefundCycle: workerMocks.runRefundCycle
}));

vi.mock("../src/preflight/nimiq-rpc.js", () => ({
  NimiqRpcClient: class NimiqRpcClient {}
}));

vi.mock("../src/preflight/nimiq-signer.js", () => ({
  NimiqTransferSigner: class NimiqTransferSigner {
    address = "NQ00 TEST TREASURY ADDRESS";
  }
}));

vi.mock("../src/activity/run-occurrence-cycle.js", () => ({
  runOccurrenceCycle: workerMocks.runOccurrenceCycle
}));

vi.mock("../src/health/server.js", () => ({
  startWorkerHealthServer: vi.fn(
    async (input: { getState: typeof workerMocks.healthStateReader }) => {
      workerMocks.healthStateReader = input.getState;
      return { close: workerMocks.healthClose };
    }
  )
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("runReviewTimeoutCycle", () => {
  it("protects timed out reviews at the audited effective time and returns the result", async () => {
    const realNow = new Date("2026-07-23T12:00:00.000Z");
    const effectiveNow = new Date("2027-04-06T11:00:00.000Z");
    const calls: Array<{ name: string; now: Date }> = [];
    const repository = {
      async getEffectiveTime(now: Date) {
        calls.push({ name: "getEffectiveTime", now });
        return effectiveNow;
      },
      async protectTimedOutReviews(now: Date) {
        calls.push({ name: "protectTimedOutReviews", now });
        return { protectedSubmissions: 2 };
      }
    };

    const result = await runReviewTimeoutCycle({
      repository,
      realNow: () => realNow
    });

    expect(calls).toEqual([
      { name: "getEffectiveTime", now: realNow },
      { name: "protectTimedOutReviews", now: effectiveNow }
    ]);
    expect(result).toEqual({ protectedSubmissions: 2 });
  });

  it("marks timeout failures unhealthy and still runs the later refund stage", async () => {
    vi.clearAllMocks();
    workerMocks.repository.protectTimedOutReviews.mockRejectedValueOnce(
      new Error("inactive reviews failed")
    );
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv("NIMIQ_RPC_URL", "https://rpc.testnet.example");
    vi.stubEnv("DATABASE_URL", "postgresql://pods:secret@internal/pods");
    vi.stubEnv("PODS_TREASURY_ADDRESS", "NQ00 TEST TREASURY ADDRESS");
    vi.stubEnv("PODS_TREASURY_PRIVATE_KEY_HEX", "a".repeat(64));
    vi.stubEnv("PODS_DEPOSIT_POLL_INTERVAL_MS", "5000");
    vi.stubEnv("PODS_ALPHA_REFUND_ENABLED", "true");
    vi.stubEnv("PORT", "3412");
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const processOnce = vi.spyOn(process, "once").mockImplementation(() => process);

    const worker = await startFundingWorker();
    try {
      expect(workerMocks.runOccurrenceCycle).toHaveBeenCalledOnce();
      expect(workerMocks.repository.protectTimedOutReviews).toHaveBeenCalledOnce();
      expect(workerMocks.runRefundCycle).toHaveBeenCalledOnce();
      expect(
        workerMocks.runOccurrenceCycle.mock.invocationCallOrder[0]
      ).toBeLessThan(
        workerMocks.repository.protectTimedOutReviews.mock.invocationCallOrder[0] ?? 0
      );
      expect(
        workerMocks.repository.protectTimedOutReviews.mock.invocationCallOrder[0]
      ).toBeLessThan(workerMocks.runRefundCycle.mock.invocationCallOrder[0] ?? 0);
      expect(workerMocks.healthStateReader?.()).toMatchObject({
        ready: true,
        cycleHealthy: false,
        lastSuccessfulCycleAt: null
      });
      expect(errorLog).toHaveBeenCalledWith(
        "[review-timeout-cycle] inactive reviews failed"
      );
    } finally {
      await worker.stop();
      errorLog.mockRestore();
      processOnce.mockRestore();
    }
  });
});
