import { validateCreatorReviewDecision } from "@pods/domain";
import { NextResponse } from "next/server";

import { isUuidRouteParam } from "../../../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../../lib/session";

function submissionNotFound() {
  return NextResponse.json({ error: "Submission not found" }, { status: 404 });
}

export async function POST(
  request: Request,
  {
    params
  }: {
    params: Promise<{ podId: string; submissionId: string }>;
  }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  }
  const { podId, submissionId } = await params;
  if (!isUuidRouteParam(podId) || !isUuidRouteParam(submissionId)) {
    return submissionNotFound();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const validation = validateCreatorReviewDecision(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
  }

  try {
    const now = await podsRepository.getEffectiveTime(new Date());
    const result = await podsRepository.decideSubmissionAsCreator({
      creatorUserId: session.userId,
      podId,
      submissionId,
      decision: validation.value,
      now
    });
    if (!result) return submissionNotFound();
    if (result.kind === "already_decided") {
      return NextResponse.json(
        { error: "This proof already has a final result" },
        { status: 409 }
      );
    }
    return NextResponse.json({
      submission: {
        id: result.submission.id,
        state: result.submission.state,
        reviewedAt: result.submission.reviewedAt,
        approvedAt: result.submission.approvedAt
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Review decision could not be recorded" },
      { status: 500 }
    );
  }
}
