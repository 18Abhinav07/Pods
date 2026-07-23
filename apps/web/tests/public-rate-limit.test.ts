import { beforeEach, describe, expect, it, vi } from "vitest";

const consumePublicRateLimit = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { consumePublicRateLimit }
}));

import {
  consumeAccountPublicLimit,
  consumeNetworkPublicLimit
} from "../src/lib/public-rate-limit";

describe("public rate limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("does not persist a bucket while limits are disabled", async () => {
    vi.stubEnv("PODS_RATE_LIMITS_ENABLED", "false");
    await expect(consumeNetworkPublicLimit(
      new Request("http://localhost", {
        headers: { "x-forwarded-for": "203.0.113.8" }
      }),
      { action: "public_room_poll", discriminator: "pod-1", limit: 40, windowMs: 60_000 }
    )).resolves.toMatchObject({ allowed: true });
    expect(consumePublicRateLimit).not.toHaveBeenCalled();
  });

  it("stores only an HMAC bucket for a network request", async () => {
    vi.stubEnv("PODS_RATE_LIMITS_ENABLED", "true");
    vi.stubEnv("PODS_RATE_LIMIT_HMAC_SECRET", "a-long-local-secret");
    consumePublicRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 39,
      resetAt: new Date("2027-04-05T12:01:00.000Z")
    });
    await consumeNetworkPublicLimit(
      new Request("http://localhost", {
        headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.2" }
      }),
      { action: "public_room_poll", discriminator: "pod-1", limit: 40, windowMs: 60_000 }
    );

    const call = consumePublicRateLimit.mock.calls[0]?.[0];
    expect(call.bucketKey).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(call)).not.toContain("203.0.113.8");
    expect(JSON.stringify(call)).not.toContain("pod-1");
  });

  it("uses the same opaque mechanism for account report limits", async () => {
    vi.stubEnv("PODS_RATE_LIMITS_ENABLED", "true");
    vi.stubEnv("PODS_RATE_LIMIT_HMAC_SECRET", "a-long-local-secret");
    consumePublicRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date("2027-04-06T00:00:00.000Z")
    });

    await expect(consumeAccountPublicLimit("user-1", {
      action: "public_report",
      limit: 10,
      windowMs: 86_400_000
    })).resolves.toMatchObject({ allowed: false, remaining: 0 });
    expect(JSON.stringify(consumePublicRateLimit.mock.calls[0]?.[0])).not.toContain("user-1");
  });
});
