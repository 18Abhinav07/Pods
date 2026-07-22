import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { conversationId } = await params;
  const body = (await request.json()) as { roomState?: unknown };
  if (body.roomState !== "open" && body.roomState !== "archived") {
    return NextResponse.json({ error: "Room state is invalid" }, { status: 400 });
  }
  try {
    const conversation = await podsRepository.setPodRoomState({
      conversationId,
      creatorUserId: session.userId,
      roomState: body.roomState,
      now: new Date()
    });
    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Room state could not be changed";
    return NextResponse.json({ error: message }, { status: message.includes("Only") ? 403 : 400 });
  }
}
