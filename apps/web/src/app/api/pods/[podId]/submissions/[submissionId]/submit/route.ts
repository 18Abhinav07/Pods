import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ podId: string; submissionId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId, submissionId } = await params;
  try {
    const owned = await podsRepository.getSubmissionForOwner({
      userId: session.userId,
      submissionId
    });
    if (!owned || owned.pod.id !== podId) {
      return NextResponse.json({ error: "Evidence draft not found" }, { status: 404 });
    }
    const now = await podsRepository.getEffectiveTime(new Date());
    const submission = await podsRepository.submitOccurrenceEvidence({
      userId: session.userId,
      submissionId,
      now
    });
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evidence could not be submitted" },
      { status: 400 }
    );
  }
}
