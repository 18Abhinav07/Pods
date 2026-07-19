import { completeWalletSession } from "../../../../lib/auth";
import { podsRepository } from "../../../../lib/server-db";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions
} from "../../../../lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (
      typeof body.challengeId !== "string" ||
      typeof body.publicKey !== "string" ||
      typeof body.signature !== "string"
    ) {
      return NextResponse.json({ error: "Complete wallet signature data is required" }, { status: 400 });
    }
    const session = await completeWalletSession(
      podsRepository,
      {
        challengeId: body.challengeId,
        publicKey: body.publicKey,
        signature: body.signature
      },
      new Date()
    );
    const response = NextResponse.json({ walletAddress: session.walletAddress });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      session.token,
      sessionCookieOptions(session.expiresAt)
    );
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Wallet sign-in failed" },
      { status: 401 }
    );
  }
}
