import { buildPublishedContract } from "@pods/domain";
import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId } = await params;
  const pod = await podsRepository.getPodForOwner(session.userId, podId);
  if (!pod) return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  const { activity, community, commitment } = pod.draftData;
  if (!activity || !community || !commitment) {
    return NextResponse.json({ error: "Complete every creation step first" }, { status: 409 });
  }
  const result = buildPublishedContract({
    templateId: pod.templateId,
    activity,
    community,
    commitment
  });
  if (!result.success) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json(result);
}
