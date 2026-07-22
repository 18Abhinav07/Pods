import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { conversationId } = await params;
  const body = (await request.json()) as { action?: unknown };
  if (body.action !== "accept" && body.action !== "discard" && body.action !== "block") {
    return NextResponse.json({ error: "Message request action is invalid" }, { status: 400 });
  }
  try {
    const conversation = await podsRepository.respondToDirectConversation({
      conversationId,
      recipientUserId: session.userId,
      action: body.action,
      now: new Date()
    });
    return NextResponse.json({ conversation });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Message request not found" }, { status: 400 });
  }
}
