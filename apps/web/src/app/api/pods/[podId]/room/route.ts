import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId } = await params;
  try {
    const conversation = await podsRepository.ensurePodConversation({
      podId,
      userId: session.userId
    });
    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json({ error: "Pod room not found" }, { status: 404 });
  }
}
