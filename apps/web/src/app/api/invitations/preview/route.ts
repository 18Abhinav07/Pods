import { normalizeInvitationToken } from "@pods/domain";
import { NextResponse } from "next/server";

import { hashInvitationToken } from "../../../../lib/invitations";
import { podsRepository } from "../../../../lib/server-db";

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: unknown };
  const token = normalizeInvitationToken(body.token);
  if (!token) return NextResponse.json({ error: "This invitation is unavailable" }, { status: 404 });
  const preview = await podsRepository.getInvitationPreviewByTokenHash(
    hashInvitationToken(token),
    new Date()
  );
  if (!preview) return NextResponse.json({ error: "This invitation is unavailable" }, { status: 404 });
  return NextResponse.json({ preview });
}
