import { NextResponse } from "next/server";

import { podsRepository } from "../../../../lib/server-db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;
  const presence = await podsRepository.getPublicProfilePresence(handle);
  if (presence.kind === "not_found") {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  if (presence.kind === "private") {
    return NextResponse.json({ private: true });
  }
  return NextResponse.json({ profile: presence.profile });
}
