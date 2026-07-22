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

export async function getOptionalProfileSession(returnTo = "/") {
  const session = await getCurrentSession();
  if (!session) return null;
  const profile = await podsRepository.getProfileForUser(session.userId);
  if (!profile) {
    redirect(
      `/onboarding/profile?returnTo=${encodeURIComponent(safeReturnTarget(returnTo))}`
    );
  }
  return { ...session, profile };
}

export async function requireSession(returnTo: string) {
  const session = await getOptionalProfileSession(returnTo);
  if (!session) {
    redirect(`/connect?returnTo=${encodeURIComponent(safeReturnTarget(returnTo))}`);
  }
  return session;
}
