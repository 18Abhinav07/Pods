import { parseReactionCode } from "@pods/domain";
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
  const body = (await request.json()) as { code?: unknown };
  const reaction = parseReactionCode(body.code);
  if (!reaction) return NextResponse.json({ error: "Reaction is invalid" }, { status: 400 });
  try {
    const result = await podsRepository.setMessageReaction({
      messageId,
      userId: session.userId,
      reaction,
      now: new Date()
    });
    return NextResponse.json({ reaction: result });
  } catch {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { messageId } = await params;
  try {
    await podsRepository.removeMessageReaction({
      messageId,
      userId: session.userId,
      now: new Date()
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
}
