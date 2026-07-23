import { NextResponse } from "next/server";

import { isUuidRouteParam } from "../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../lib/session";

function podNotFound() {
  return NextResponse.json({ error: "Pod not found" }, { status: 404 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  }
  const { podId } = await params;
  if (!isUuidRouteParam(podId)) return podNotFound();

  const queue = await podsRepository.listPendingReviewsForCreator({
    creatorUserId: session.userId,
    podId
  });
  if (!queue) return podNotFound();

  return NextResponse.json({
    reviews: queue.map(({ submission, occurrence, commitment, participant }) => ({
      submission: {
        id: submission.id,
        state: submission.state,
        submittedAt: submission.submittedAt,
        reviewTargetAt: submission.reviewTargetAt,
        reviewHardDeadlineAt: submission.reviewHardDeadlineAt
      },
      occurrence: {
        id: occurrence.id,
        ordinal: occurrence.ordinal,
        localDate: occurrence.localDate
      },
      commitment: {
        task: commitment.task,
        deliverableType: commitment.deliverableType
      },
      participant: {
        handle: participant.handle,
        displayName: participant.displayName,
        avatar: participant.avatar
      },
      evidenceAvailable: Boolean(submission.evidenceObjectKey)
    }))
  });
}
