import { NextResponse } from "next/server";

import { participantDepositIntent } from "../../../../lib/funding-server";
import { podsRepository } from "../../../../lib/server-db";
import { getCurrentSession } from "../../../../lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ intentId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { intentId } = await params;
  const intent = await podsRepository.getDepositIntentForUser(session.userId, intentId);
  if (!intent) return NextResponse.json({ error: "Deposit intent is unavailable" }, { status: 404 });
  return NextResponse.json({ intent: participantDepositIntent(intent) });
}
