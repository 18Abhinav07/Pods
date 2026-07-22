import { NextResponse } from "next/server";

import { podsRepository } from "../../../../lib/server-db";
import { getCurrentSession } from "../../../../lib/session";

export async function DELETE(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const body = (await request.json()) as { handle?: unknown };
  if (typeof body.handle !== "string") return NextResponse.json({ error: "Profile handle is required" }, { status: 400 });
  await podsRepository.removeFriend({ userId: session.userId, handle: body.handle });
  return new NextResponse(null, { status: 204 });
}
