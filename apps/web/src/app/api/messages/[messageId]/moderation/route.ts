import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { messageId } = await params;
  const body = (await request.json()) as { conversationId?: unknown };
  if (typeof body.conversationId !== "string") {
    return NextResponse.json({ error: "Conversation is required" }, { status: 400 });
  }
  try {
    const message = await podsRepository.hideConversationMessage({
      conversationId: body.conversationId,
      messageId,
      moderatorUserId: session.userId,
      now: new Date()
    });
    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Message could not be hidden";
    return NextResponse.json({ error: message }, { status: message.includes("Only") ? 403 : 400 });
  }
}
