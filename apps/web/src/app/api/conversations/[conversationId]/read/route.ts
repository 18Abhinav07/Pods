import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { conversationId } = await params;
  let body: { sequence?: unknown };
  try {
    body = (await request.json()) as { sequence?: unknown };
  } catch {
    return NextResponse.json({ error: "Read sequence is invalid" }, { status: 400 });
  }
  if (typeof body.sequence !== "number" || !Number.isInteger(body.sequence)) {
    return NextResponse.json({ error: "Read sequence is invalid" }, { status: 400 });
  }
  try {
    const read = await podsRepository.markConversationRead({
      conversationId,
      userId: session.userId,
      sequence: body.sequence
    });
    return NextResponse.json({ read });
  } catch {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
}
