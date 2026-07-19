import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { participantDepositIntent, readFundingConfiguration } from "../../../../../lib/funding-server";
import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId } = await params;
  try {
    const configuration = readFundingConfiguration();
    const intent = await podsRepository.createDepositIntent({
      podId,
      userId: session.userId,
      walletAddress: session.walletAddress,
      treasuryAddress: configuration.treasuryAddress,
      network: configuration.network,
      reference: `pods-${randomBytes(12).toString("hex")}`,
      now: new Date()
    });
    return NextResponse.json({ intent: participantDepositIntent(intent) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deposit intent could not be created";
    const status = message === "Membership already has an open deposit intent" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
