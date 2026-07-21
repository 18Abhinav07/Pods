import { NextResponse } from "next/server";

import { createOpsSessionValue, verifyOpsAccessToken } from "../../../../lib/ops-auth";
import {
  OPS_SESSION_COOKIE_NAME,
  opsSessionCookieOptions
} from "../../../../lib/ops-session";

function safeOpsReturnTarget(value: unknown) {
  return typeof value === "string" && value.startsWith("/ops/") && !value.startsWith("//")
    ? value
    : "/ops/reviews";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { accessToken?: unknown; returnTo?: unknown };
  const configuredToken = process.env.PODS_OPS_ACCESS_TOKEN ?? "";
  const sessionSecret = process.env.PODS_OPS_SESSION_SECRET ?? "";
  if (!configuredToken || !sessionSecret) {
    return NextResponse.json({ error: "Reviewer access is not configured" }, { status: 503 });
  }
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  if (!verifyOpsAccessToken(accessToken, configuredToken)) {
    return NextResponse.json({ error: "Reviewer access token is invalid" }, { status: 401 });
  }
  const session = createOpsSessionValue({ secret: sessionSecret, now: new Date() });
  const response = NextResponse.json({ returnTo: safeOpsReturnTarget(body.returnTo) });
  response.cookies.set(
    OPS_SESSION_COOKIE_NAME,
    session.value,
    opsSessionCookieOptions(session.expiresAt)
  );
  return response;
}
