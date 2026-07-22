import { NextResponse } from "next/server";

import { podsRepository } from "../../../lib/server-db";
import { getCurrentSession } from "../../../lib/session";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const body = (await request.json()) as { handle?: unknown; introduction?: unknown };
  if (typeof body.handle !== "string") return NextResponse.json({ error: "Profile handle is required" }, { status: 400 });
  try {
    const result = await podsRepository.openDirectConversation({
      senderUserId: session.userId,
      handle: body.handle,
      introduction: body.introduction,
      now: new Date()
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Conversation could not be opened" }, { status: 400 });
  }
}
