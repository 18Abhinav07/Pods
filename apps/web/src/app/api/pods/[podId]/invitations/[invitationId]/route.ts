import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ podId: string; invitationId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId, invitationId } = await params;
  const revoked = await podsRepository.revokeInvitation({ creatorUserId: session.userId, podId, invitationId, now: new Date() });
  if (!revoked) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
