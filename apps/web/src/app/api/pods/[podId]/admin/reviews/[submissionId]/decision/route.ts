import { validateCreatorReviewDecision } from "@pods/domain";
import { NextResponse } from "next/server";

import { isUuidRouteParam } from "../../../../../../../../lib/route-params";
import { proofReviewView } from "../../../../../../../../lib/proof-review-view";
import { podsRepository } from "../../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../../lib/session";

function submissionNotFound() {
  return NextResponse.json({ error: "Submission not found" }, { status: 404 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ podId: string; submissionId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  }
  const { podId, submissionId } = await params;
  if (!isUuidRouteParam(podId) || !isUuidRouteParam(submissionId)) {
    return submissionNotFound();
  }
  const review = await podsRepository.getProofReviewForCreator({
    creatorUserId: session.userId,
    podId,
    submissionId
  });
  if (!review) return submissionNotFound();
  return NextResponse.json(
    { review: proofReviewView(review) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
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
  const candidate = typeof body === "object" && body !== null
    ? body as Record<string, unknown>
    : {};
  const reconciliationActions = new Set([
    "approve",
    "request_clarification",
    "provisionally_reject",
    "appeal_approve",
    "appeal_reject",
    "appeal_grace"
  ]);
  const reconciliationAction = typeof candidate.action === "string" &&
    reconciliationActions.has(candidate.action)
    ? candidate.action
    : null;
  const validation = reconciliationAction
    ? null
    : validateCreatorReviewDecision(body);
  if (validation && !validation.success) {
    return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
  }

  try {
    const now = await podsRepository.getEffectiveTime(new Date());
    if (reconciliationAction) {
      const idempotencyKey = typeof candidate.idempotencyKey === "string"
        ? candidate.idempotencyKey
        : "";
      if (!isUuidRouteParam(idempotencyKey)) {
        return NextResponse.json({ error: "A valid action key is required" }, { status: 400 });
      }
      const result = await podsRepository.reviewProofAsCreator({
        creatorUserId: session.userId,
        podId,
        submissionId,
        idempotencyKey,
        action: {
          ...candidate,
          type: reconciliationAction
        } as Parameters<typeof podsRepository.reviewProofAsCreator>[0]["action"],
        now
      });
      if (!result) return submissionNotFound();
      const review = await podsRepository.getProofReviewForCreator({
        creatorUserId: session.userId,
        podId,
        submissionId
      });
      if (!review) return submissionNotFound();
      return NextResponse.json({ review: proofReviewView(review) });
    }
    const result = await podsRepository.decideSubmissionAsCreator({
      creatorUserId: session.userId,
      podId,
      submissionId,
      decision: validation!.value,
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
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review decision could not be recorded" },
      { status: reconciliationAction ? 409 : 500 }
    );
  }
}
