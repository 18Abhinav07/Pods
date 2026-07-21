import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyOpsSessionValue } from "./ops-auth";

export const OPS_SESSION_COOKIE_NAME = "pods_ops_session";

function sessionSecret() {
  const value = process.env.PODS_OPS_SESSION_SECRET;
  if (!value) throw new Error("PODS_OPS_SESSION_SECRET is required");
  return value;
}

export function opsSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  };
}

export async function hasOpsSession() {
  const value = (await cookies()).get(OPS_SESSION_COOKIE_NAME)?.value;
  if (!value) return false;
  return verifyOpsSessionValue({ value, secret: sessionSecret(), now: new Date() }).valid;
}

export async function requireOpsSession(returnTo: string) {
  if (!(await hasOpsSession())) {
    redirect(`/ops/connect?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return { reviewerId: process.env.PODS_OPS_REVIEWER_ID ?? "pods-team-reviewer" };
}
