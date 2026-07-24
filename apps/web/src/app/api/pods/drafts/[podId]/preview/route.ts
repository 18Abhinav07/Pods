import { buildPublishedContract } from "@pods/domain";
import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../lib/session";
import { alphaFundingPolicy } from "../../../../../../lib/alpha-access";

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
  let fundingPolicy: ReturnType<typeof alphaFundingPolicy>;
  try {
    fundingPolicy = alphaFundingPolicy(process.env);
  } catch {
    return NextResponse.json(
      { error: "Pod publication is paused" },
      { status: 503 }
    );
  }
  const result = buildPublishedContract({
    templateId: pod.templateId,
    activity,
    community,
    commitment
  }, fundingPolicy);
  if (!result.success) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json(result);
}
