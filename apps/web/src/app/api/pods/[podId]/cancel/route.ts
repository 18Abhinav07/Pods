import { NextResponse } from "next/server";

import { alphaFinancialMutationsEnabled } from "../../../../../lib/alpha-access";
import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  if (!alphaFinancialMutationsEnabled(process.env)) {
    return NextResponse.json(
      { error: "Financial activity is paused" },
      { status: 503 }
    );
  }
  const { podId } = await params;
  const pod = await podsRepository.cancelEnrollmentPod({
    creatorUserId: session.userId,
    podId,
    now: new Date()
  });
  if (!pod) return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  return NextResponse.json({ pod });
}
