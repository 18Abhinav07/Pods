import {
  buildPublishedContract,
  validatePublicationTiming
} from "@pods/domain";
import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../lib/session";
import { alphaFundingPolicy } from "../../../../../../lib/alpha-access";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId } = await params;
  const body = (await request.json()) as { acceptedFrozenContract?: unknown };
  if (body.acceptedFrozenContract !== true) {
    return NextResponse.json({ error: "Confirm that the published contract is immutable" }, { status: 400 });
  }
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
  }, alphaFundingPolicy(process.env));
  if (!result.success) return NextResponse.json({ errors: result.errors }, { status: 400 });
  const timing = validatePublicationTiming(result.occurrences, new Date());
  if (!timing.success) return NextResponse.json({ errors: timing.errors }, { status: 400 });

  try {
    const published = await podsRepository.publishDraft({
      creatorUserId: session.userId,
      podId,
      contract: result.contract,
      occurrences: result.occurrences,
      creatorConsentAccepted: body.acceptedFrozenContract === true
    });
    return NextResponse.json({ pod: published });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pod could not be published" },
      { status: 409 }
    );
  }
}
