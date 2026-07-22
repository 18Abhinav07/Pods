import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string; occurrenceId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId, occurrenceId } = await params;
  const body = (await request.json()) as {
    resultSummary?: unknown;
    artifactUrl?: unknown;
    proofShareMode?: unknown;
  };
  try {
    const now = await podsRepository.getEffectiveTime(new Date());
    const submission = await podsRepository.saveSubmissionDraft({
      userId: session.userId,
      podId,
      occurrenceId,
      resultSummary: body.resultSummary,
      artifactUrl: body.artifactUrl,
      proofShareMode: body.proofShareMode,
      now
    });
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evidence draft could not be saved" },
      { status: 400 }
    );
  }
}
