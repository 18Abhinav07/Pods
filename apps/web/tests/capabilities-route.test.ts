import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "../src/app/api/capabilities/route";

describe("public alpha capabilities route", () => {
  beforeEach(() => {
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv("PODS_ALPHA_ACCESS", "allowlist");
    vi.stubEnv("PODS_PROFILES_ENABLED", "true");
    vi.stubEnv("PODS_POD_CHAT_ENABLED", "false");
    vi.stubEnv("PODS_DEPOSIT_MODE", "allowlist_refund_only");
    vi.stubEnv("PODS_ALPHA_REFUND_ENABLED", "true");
    vi.stubEnv("PODS_MAX_DEPOSIT_LUNA", "100000");
    vi.stubEnv("PODS_MAX_TREASURY_EXPOSURE_LUNA", "1000000");
    vi.stubEnv("TREASURY_PRIVATE_KEY", "must-never-leak");
  });

  it("exposes presentation capabilities without internal controls or secrets", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      access: "allowlist",
      network: "testnet",
      profiles: true,
      podChat: false,
      depositMode: "allowlist_refund_only"
    });
    expect(body).not.toHaveProperty("maximumDepositLuna");
    expect(body).not.toHaveProperty("maximumTreasuryExposureLuna");
    expect(body).not.toHaveProperty("alphaRefund");
    expect(body).not.toHaveProperty("moderation");
    expect(JSON.stringify(body)).not.toContain("must-never-leak");
  });

  it("fails closed when alpha configuration is invalid", async () => {
    vi.stubEnv("NIMIQ_NETWORK", "mainnet");

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Capabilities are temporarily unavailable"
    });
  });
});
