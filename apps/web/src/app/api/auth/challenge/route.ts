import { issueWalletChallenge, normalizeWalletAddress } from "../../../../lib/auth";
import { podsRepository } from "../../../../lib/server-db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { walletAddress?: unknown };
  try {
    body = (await request.json()) as { walletAddress?: unknown };
  } catch {
    return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
  }

  if (typeof body.walletAddress !== "string") {
    return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
  }

  let walletAddress: string;
  try {
    walletAddress = normalizeWalletAddress(body.walletAddress);
  } catch {
    return NextResponse.json({ error: "A valid Nimiq wallet address is required" }, { status: 400 });
  }

  try {
    const challenge = await issueWalletChallenge(
      podsRepository,
      walletAddress,
      new Date()
    );
    return NextResponse.json({
      id: challenge.id,
      message: challenge.message,
      expiresAt: challenge.expiresAt.toISOString()
    });
  } catch {
    return NextResponse.json(
      { error: "Wallet sign-in is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }
}
