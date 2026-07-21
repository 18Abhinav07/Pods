import { NextResponse } from "next/server";

import { hasOpsSession } from "../../../../../../lib/ops-session";
import { podsRepository } from "../../../../../../lib/server-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  if (!(await hasOpsSession())) {
    return NextResponse.json({ error: "Reviewer session required" }, { status: 401 });
  }
  const { submissionId } = await params;
  const body = (await request.json()) as { note?: unknown };
  try {
    const now = await podsRepository.getEffectiveTime(new Date());
    const submission = await podsRepository.approveSubmission({
      submissionId,
      reviewerId: process.env.PODS_OPS_REVIEWER_ID ?? "pods-team-reviewer",
      note: typeof body.note === "string" ? body.note : "",
      now,
      authority: "reviewer"
    });
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review could not be completed" },
      { status: 400 }
    );
  }
}
