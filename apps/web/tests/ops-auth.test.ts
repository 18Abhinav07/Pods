import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOpsSessionValue,
  verifyOpsAccessToken,
  verifyOpsSessionValue
} from "../src/lib/ops-auth";
import { opsSessionCookieOptions } from "../src/lib/ops-session";
import { POST as createOpsSession } from "../src/app/api/ops/session/route";

describe("reviewer authentication", () => {
  beforeEach(() => {
    vi.stubEnv("PODS_OPS_ACCESS_TOKEN", "review-secret");
    vi.stubEnv("PODS_OPS_SESSION_SECRET", "session-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts only the exact configured access token", () => {
    expect(verifyOpsAccessToken("review-secret", "review-secret")).toBe(true);
    expect(verifyOpsAccessToken("wrong", "review-secret")).toBe(false);
    expect(verifyOpsAccessToken("", "review-secret")).toBe(false);
  });

  it("signs an expiring HttpOnly session value and rejects tampering", () => {
    const now = new Date("2027-04-05T12:00:00.000Z");
    const session = createOpsSessionValue({ secret: "session-secret", now });

    expect(verifyOpsSessionValue({ value: session.value, secret: "session-secret", now }))
      .toEqual({ valid: true, expiresAt: session.expiresAt });
    expect(verifyOpsSessionValue({
      value: `${session.value}tampered`,
      secret: "session-secret",
      now
    }).valid).toBe(false);
    expect(verifyOpsSessionValue({
      value: session.value,
      secret: "session-secret",
      now: new Date("2027-04-06T01:00:00.000Z")
    }).valid).toBe(false);
  });

  it("sends the HttpOnly reviewer session to both pages and API routes", () => {
    expect(opsSessionCookieOptions(new Date("2027-04-06T00:00:00.000Z")))
      .toMatchObject({ httpOnly: true, sameSite: "strict", path: "/" });
  });

  it("allows only the live public-safety page as an ops return target", async () => {
    for (const [requested, expected] of [
      ["/ops/public-safety", "/ops/public-safety"],
      ["/ops/reviews", "/ops/public-safety"],
      ["/ops/unknown", "/ops/public-safety"],
      ["/ops/public-safety/archive", "/ops/public-safety"],
      ["//ops/public-safety", "/ops/public-safety"]
    ]) {
      const response = await createOpsSession(new Request("http://localhost/api/ops/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken: "review-secret", returnTo: requested })
      }));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ returnTo: expected });
    }
  });
});
