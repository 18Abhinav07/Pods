import { describe, expect, it } from "vitest";

import {
  createOpsSessionValue,
  verifyOpsAccessToken,
  verifyOpsSessionValue
} from "../src/lib/ops-auth";
import { opsSessionCookieOptions } from "../src/lib/ops-session";

describe("reviewer authentication", () => {
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
});
