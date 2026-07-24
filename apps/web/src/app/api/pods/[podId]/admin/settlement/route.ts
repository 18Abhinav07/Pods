import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Wallet session required" },
      { status: 401 }
    );
  }
  const { podId } = await params;
  const owned = await podsRepository.getPodForOwner(session.userId, podId);
  if (!owned) {
    return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  }
  try {
    const now = await podsRepository.getEffectiveTime(new Date());
    const result = await podsRepository.finalizePodSettlement({ podId, now });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Settlement could not be finalized"
      },
      { status: 409 }
    );
  }
}
