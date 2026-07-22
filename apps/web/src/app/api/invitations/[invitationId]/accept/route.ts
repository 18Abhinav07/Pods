import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { invitationId } = await params;
  try {
    const membership = await podsRepository.acceptTargetedInvitation({
      invitationId,
      userId: session.userId,
      now: new Date()
    });
    if (!membership) return NextResponse.json({ error: "Invitation is unavailable" }, { status: 404 });
    return NextResponse.json({ membership });
  } catch {
    return NextResponse.json({ error: "Invitation is unavailable" }, { status: 404 });
  }
}
