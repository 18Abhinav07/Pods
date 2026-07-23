import { describe, expect, it } from "vitest";

import {
  parseAlphaCapabilities,
  publicAlphaCapabilities
} from "../src/alpha-capabilities";

const alphaEnvironment = {
  APP_ENV: "alpha",
  NIMIQ_NETWORK: "testnet"
};

describe("alpha capability configuration", () => {
  it("defaults an alpha deployment to a closed, non-financial surface", () => {
    expect(parseAlphaCapabilities(alphaEnvironment)).toEqual({
      access: "closed",
      network: "testnet",
      profiles: false,
      podChat: false,
      socialGraph: false,
      directMessages: false,
      directMessageRequests: false,
      uploads: false,
      gifs: false,
      moderation: false,
      rateLimits: false,
      reviewExceptions: false,
      settlement: false,
      alphaRefund: false,
      depositMode: "off",
      realtimeTransport: "poll"
    });
  });

  it("refuses an alpha deployment outside Nimiq Testnet", () => {
    expect(() =>
      parseAlphaCapabilities({ APP_ENV: "alpha", NIMIQ_NETWORK: "mainnet" })
    ).toThrow("Alpha deployments require NIMIQ_NETWORK=testnet");
  });

  it("refuses public deposits until settlement is enabled", () => {
    expect(() =>
      parseAlphaCapabilities({
        ...alphaEnvironment,
        PODS_DEPOSIT_MODE: "public"
      })
    ).toThrow("Public deposits require settlement to be enabled");
  });

  it("requires the full refund path for allowlisted deposits", () => {
    expect(() =>
      parseAlphaCapabilities({
        ...alphaEnvironment,
        PODS_DEPOSIT_MODE: "allowlist_refund_only"
      })
    ).toThrow("Allowlisted alpha deposits require the full refund path");

    expect(parseAlphaCapabilities({
      ...alphaEnvironment,
      PODS_DEPOSIT_MODE: "allowlist_refund_only",
      PODS_ALPHA_REFUND_ENABLED: "true"
    })).toMatchObject({
      depositMode: "allowlist_refund_only",
      alphaRefund: true
    });
  });

  it("requires safety controls before non-friend message requests", () => {
    expect(() =>
      parseAlphaCapabilities({
        ...alphaEnvironment,
        PODS_DMS_ENABLED: "true",
        PODS_DM_REQUESTS_ENABLED: "true"
      })
    ).toThrow("Message requests require DMs, moderation, and rate limits");
  });

  it("returns a secret-free capability projection", () => {
    const parsed = parseAlphaCapabilities({
      ...alphaEnvironment,
      PODS_ALPHA_ACCESS: "allowlist",
      PODS_PROFILES_ENABLED: "true",
      PODS_POD_CHAT_ENABLED: "true",
      REALTIME_TRANSPORT: "sse",
      PODS_TREASURY_PRIVATE_KEY_HEX: "must-not-leak"
    });

    expect(publicAlphaCapabilities(parsed)).toEqual({
      access: "allowlist",
      network: "testnet",
      profiles: true,
      podChat: true,
      socialGraph: false,
      directMessages: false,
      directMessageRequests: false,
      uploads: false,
      gifs: false,
      reviewExceptions: false,
      settlement: false,
      depositMode: "off",
      realtimeTransport: "sse"
    });
    expect(JSON.stringify(publicAlphaCapabilities(parsed))).not.toContain("private");
  });
});
