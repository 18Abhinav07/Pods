import { hashSessionToken, safeReturnTarget } from "./auth";
import { podsRepository } from "./server-db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE_NAME = "pods_session";

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  };
}

export async function getCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return podsRepository.getSession(hashSessionToken(token), new Date());
}

export async function requireSession(returnTo: string) {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/connect?returnTo=${encodeURIComponent(safeReturnTarget(returnTo))}`);
  }
  return session;
}
