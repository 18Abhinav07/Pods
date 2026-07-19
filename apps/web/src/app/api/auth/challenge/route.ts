import { issueWalletChallenge } from "../../../../lib/auth";
import { podsRepository } from "../../../../lib/server-db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { walletAddress?: unknown };
    if (typeof body.walletAddress !== "string") {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }
    const challenge = await issueWalletChallenge(
      podsRepository,
      body.walletAddress,
      new Date()
    );
    return NextResponse.json({
      id: challenge.id,
      message: challenge.message,
      expiresAt: challenge.expiresAt.toISOString()
    });
  } catch {
    return NextResponse.json({ error: "A valid Nimiq wallet address is required" }, { status: 400 });
  }
}
