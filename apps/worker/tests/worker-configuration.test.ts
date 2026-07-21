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
  PORT: "3412"
};

describe("funding worker alpha configuration", () => {
  it("starts closed by default and reads the Railway health port", async () => {
    const configuration = await readDepositWorkerConfiguration(validEnvironment);

    expect(configuration.healthPort).toBe(3412);
    expect(configuration.alphaMode).toBe(true);
    expect(configuration.capabilities.depositMode).toBe("off");
    expect(configuration.capabilities.settlement).toBe(false);
  });

  it("refuses unsafe public deposits before settlement exists", async () => {
    await expect(
      readDepositWorkerConfiguration({
        ...validEnvironment,
        PODS_DEPOSIT_MODE: "public"
      })
    ).rejects.toThrow("Public deposits require settlement to be enabled");
  });

  it("refuses an invalid health port", async () => {
    await expect(
      readDepositWorkerConfiguration({ ...validEnvironment, PORT: "70000" })
    ).rejects.toThrow("PORT must be an integer between 1 and 65535");
  });
});
