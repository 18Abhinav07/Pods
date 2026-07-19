import { NextResponse } from "next/server";

import { participantDepositIntent } from "../../../../../lib/funding-server";
import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ intentId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const body = (await request.json()) as { transactionHash?: unknown };
  if (typeof body.transactionHash !== "string" || !/^[a-f0-9]{64}$/.test(body.transactionHash)) {
    return NextResponse.json({ error: "Transaction hash is invalid" }, { status: 400 });
  }
  const { intentId } = await params;
  try {
    const intent = await podsRepository.recordDepositTransactionHint({
      intentId,
      userId: session.userId,
      transactionHash: body.transactionHash,
      now: new Date()
    });
    if (!intent) return NextResponse.json({ error: "Deposit intent is unavailable" }, { status: 404 });
    return NextResponse.json({ intent: participantDepositIntent(intent) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction hint could not be saved";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
