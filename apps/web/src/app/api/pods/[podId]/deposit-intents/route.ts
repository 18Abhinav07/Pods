import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { alphaDepositsEnabled } from "../../../../../lib/alpha-access";
import { participantDepositIntent, readFundingConfiguration } from "../../../../../lib/funding-server";
import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  if (!alphaDepositsEnabled(process.env)) {
    return NextResponse.json(
      { error: "NIM commitments are not enabled in this alpha" },
      { status: 403 }
    );
  }
  const { podId } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      acceptedContractHash?: unknown;
      settlementDisclosureAccepted?: unknown;
    };
    const existing = await podsRepository.getOpenDepositIntentForUser(session.userId, podId);
    if (existing) {
      return NextResponse.json({ intent: participantDepositIntent(existing) });
    }
    const configuration = readFundingConfiguration();
    const intent = await podsRepository.createDepositIntent({
      podId,
      userId: session.userId,
      walletAddress: session.walletAddress,
      treasuryAddress: configuration.treasuryAddress,
      network: configuration.network,
      reference: `pods-${randomBytes(12).toString("hex")}`,
      ...(typeof body.acceptedContractHash === "string"
        ? { acceptedContractHash: body.acceptedContractHash }
        : {}),
      settlementDisclosureAccepted:
        body.settlementDisclosureAccepted === true,
      now: new Date()
    });
    return NextResponse.json({ intent: participantDepositIntent(intent) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deposit intent could not be created";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
