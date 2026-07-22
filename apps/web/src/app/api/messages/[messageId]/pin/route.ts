import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { messageId } = await params;
  const body = (await request.json()) as { conversationId?: unknown; pinned?: unknown };
  if (typeof body.conversationId !== "string" || typeof body.pinned !== "boolean") {
    return NextResponse.json({ error: "Pin request is invalid" }, { status: 400 });
  }
  try {
    const message = await podsRepository.pinConversationAnnouncement({
      conversationId: body.conversationId,
      messageId,
      creatorUserId: session.userId,
      pinned: body.pinned,
      now: new Date()
    });
    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Announcement could not be pinned";
    return NextResponse.json({ error: message }, { status: message.includes("Only") ? 403 : 400 });
  }
}
