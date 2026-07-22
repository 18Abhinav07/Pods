import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { requestId } = await params;
  const body = (await request.json()) as { action?: unknown };
  if (body.action !== "accept" && body.action !== "decline" && body.action !== "cancel") {
    return NextResponse.json({ error: "Friend request action is invalid" }, { status: 400 });
  }
  try {
    const friendRequest = await podsRepository.respondToFriendRequest({
      requestId,
      userId: session.userId,
      action: body.action,
      now: new Date()
    });
    return NextResponse.json({ friendRequest });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Friend request not found" }, { status: 400 });
  }
}
