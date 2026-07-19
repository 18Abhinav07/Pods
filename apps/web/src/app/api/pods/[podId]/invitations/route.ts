import { NextResponse } from "next/server";

import { createInvitationToken, hashInvitationToken } from "../../../../../lib/invitations";
import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId } = await params;
  const token = createInvitationToken();
  try {
    const invitation = await podsRepository.createInvitation({
      creatorUserId: session.userId,
      podId,
      tokenHash: hashInvitationToken(token),
      now: new Date()
    });
    return NextResponse.json({
      invitation: { id: invitation.id, expiresAt: invitation.expiresAt.toISOString() },
      token
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invitation could not be created" }, { status: 400 });
  }
}
