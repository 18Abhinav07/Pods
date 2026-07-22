import { NextResponse } from "next/server";

import { podsRepository } from "../../../../lib/server-db";
import { getCurrentSession } from "../../../../lib/session";

async function handleFrom(request: Request) {
  const body = (await request.json()) as { handle?: unknown };
  return typeof body.handle === "string" ? body.handle : null;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const handle = await handleFrom(request);
  if (!handle) return NextResponse.json({ error: "Profile handle is required" }, { status: 400 });
  try {
    const follow = await podsRepository.followProfile({ viewerUserId: session.userId, handle });
    return NextResponse.json({ follow }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Profile could not be followed" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const handle = await handleFrom(request);
  if (!handle) return NextResponse.json({ error: "Profile handle is required" }, { status: 400 });
  await podsRepository.unfollowProfile({ viewerUserId: session.userId, handle });
  return new NextResponse(null, { status: 204 });
}
