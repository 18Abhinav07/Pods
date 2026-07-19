import { normalizeInvitationToken } from "@pods/domain";
import { NextResponse } from "next/server";

import { hashInvitationToken } from "../../../../../lib/invitations";
import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { token: tokenValue } = await params;
  const token = normalizeInvitationToken(tokenValue);
  const body = (await request.json()) as { acceptedFrozenContract?: unknown };
  if (!token || body.acceptedFrozenContract !== true) {
    return NextResponse.json({ error: "This invitation is unavailable" }, { status: 404 });
  }
  const membership = await podsRepository.acceptInvitation({
    tokenHash: hashInvitationToken(token),
    userId: session.userId,
    now: new Date()
  });
  if (!membership) return NextResponse.json({ error: "This invitation is unavailable" }, { status: 404 });
  return NextResponse.json({ membership });
}
