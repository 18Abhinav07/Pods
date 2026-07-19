import { hashSessionToken } from "../../../../lib/auth";
import { podsRepository } from "../../../../lib/server-db";
import { SESSION_COOKIE_NAME } from "../../../../lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) await podsRepository.deleteSession(hashSessionToken(token));
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
