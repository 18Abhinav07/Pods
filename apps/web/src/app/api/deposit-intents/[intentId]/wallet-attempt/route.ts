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
  const body = (await request.json()) as { event?: unknown };
  if (body.event !== "open" && body.event !== "rejected") {
    return NextResponse.json({ error: "Choose a supported wallet event" }, { status: 400 });
  }
  const { intentId } = await params;
  try {
    const intent = await podsRepository.recordDepositWalletAttempt({
      intentId,
      userId: session.userId,
      event: body.event,
      now: new Date()
    });
    if (!intent) return NextResponse.json({ error: "Deposit intent is unavailable" }, { status: 404 });
    return NextResponse.json({ intent: participantDepositIntent(intent) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet event could not be recorded";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
