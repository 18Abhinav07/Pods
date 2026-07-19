import type { ApplicationDecision } from "@pods/domain";
import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ podId: string; applicationId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId, applicationId } = await params;
  const body = (await request.json()) as { decision?: unknown };
  if (body.decision !== "accept" && body.decision !== "reject") {
    return NextResponse.json({ error: "Choose accept or reject" }, { status: 400 });
  }
  const application = await podsRepository.decideApplication({
    creatorUserId: session.userId,
    podId,
    applicationId,
    decision: body.decision as ApplicationDecision,
    now: new Date()
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ application });
}
