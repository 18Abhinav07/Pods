import { validateMessageInput } from "@pods/domain";
import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

function statusForMessageError(message: string) {
  if (message.includes("access") || message.includes("locked roster")) return 404;
  if (message.includes("Only the Pod creator")) return 403;
  return 400;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { conversationId } = await params;
  const url = new URL(request.url);
  const afterSequence = Number.parseInt(url.searchParams.get("after") ?? "0", 10);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const cursorValue = url.searchParams.get("cursor");
  const changeCursor = cursorValue === null ? null : Number.parseInt(cursorValue, 10);
  const aroundMessageId = url.searchParams.get("around")?.trim() || null;
  try {
    const result = await podsRepository.listConversationMessages({
      conversationId,
      userId: session.userId,
      afterSequence: Number.isFinite(afterSequence) ? afterSequence : 0,
      ...(changeCursor !== null && Number.isFinite(changeCursor)
        ? { changeCursor }
        : {}),
      aroundMessageId,
      limit: Number.isFinite(limit) ? limit : 50
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversation not found";
    return NextResponse.json({ error: message }, { status: statusForMessageError(message) });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { conversationId } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const validated = validateMessageInput(body);
  if (!validated.success) {
    return NextResponse.json({ errors: validated.errors }, { status: 400 });
  }
  const kind = body.kind === "announcement" ? "announcement" : "member_message";
  try {
    const message = await podsRepository.postConversationMessage({
      conversationId,
      userId: session.userId,
      ...validated.value,
      kind,
      now: new Date()
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Message could not be sent";
    return NextResponse.json({ error: message }, { status: statusForMessageError(message) });
  }
}
