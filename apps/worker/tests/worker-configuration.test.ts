import { describe, expect, it } from "vitest";

import { readDepositWorkerConfiguration } from "../src/index";

const validEnvironment = {
  APP_ENV: "alpha",
  NODE_ENV: "production",
  NIMIQ_NETWORK: "testnet",
  NIMIQ_RPC_URL: "https://rpc.testnet.example",
  DATABASE_URL: "postgresql://pods:secret@internal/pods",
  PODS_TREASURY_ADDRESS: "NQ00 TEST TREASURY ADDRESS",
  PODS_TREASURY_PRIVATE_KEY_HEX: "a".repeat(64),
  PODS_DEPOSIT_POLL_INTERVAL_MS: "5000",
  PODS_RELEASE_SHA: "abcdef0123456789abcdef0123456789abcdef01",
  PORT: "3412"
};

describe("funding worker alpha configuration", () => {
  it("starts closed by default and reads the Railway health port", async () => {
    const configuration = await readDepositWorkerConfiguration(validEnvironment);

    expect(configuration.healthPort).toBe(3412);
    expect(configuration.alphaMode).toBe(true);
    expect(configuration.capabilities.depositMode).toBe("off");
    expect(configuration.capabilities.settlement).toBe(false);
    expect(configuration.runtime).toEqual({
      deploymentFlavor: "testnet",
      fundsNetwork: "nimiq-testnet",
      commitSha: "abcdef012345",
      schemaVersion: "0017_robust_loners"
    });
  });

  it("parses public mode for worker reconciliation without enabling settlement or payout", async () => {
    const configuration = await readDepositWorkerConfiguration({
      ...validEnvironment,
      PODS_DEPOSIT_MODE: "public"
    });

    expect(configuration.capabilities).toMatchObject({
      depositMode: "public",
      proportionalPublishing: false,
      settlement: false,
      payoutBroadcast: false
    });
  });

  it("refuses an invalid health port", async () => {
    await expect(
      readDepositWorkerConfiguration({ ...validEnvironment, PORT: "70000" })
    ).rejects.toThrow("PORT must be an integer between 1 and 65535");
  });

  it("refuses to start an alpha worker without an exact release SHA", async () => {
    await expect(
      readDepositWorkerConfiguration({
        ...validEnvironment,
        PODS_RELEASE_SHA: "must-not-leak"
      })
    ).rejects.toThrow("Alpha deployments require PODS_RELEASE_SHA");
  });
});
