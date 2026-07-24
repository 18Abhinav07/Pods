import { NextResponse } from "next/server";

import { participantSubmissionStatusDto } from "../../../../../../lib/participant-submission-status";
import { isUuidRouteParam } from "../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../lib/session";

const notFoundResponse = () =>
  NextResponse.json({ error: "Submission not found" }, { status: 404 });

export async function GET(
  _request: Request,
  {
    params
  }: {
    params: Promise<{ podId: string; submissionId: string }>;
  }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Wallet session required" },
      { status: 401 }
    );
  }
  const { podId, submissionId } = await params;
  if (!isUuidRouteParam(podId) || !isUuidRouteParam(submissionId)) {
    return notFoundResponse();
  }
  const result = await podsRepository.getSubmissionForOwner({
    userId: session.userId,
    submissionId
  });
  if (!result || result.pod.id !== podId) return notFoundResponse();
  const creatorProfile = result.pod.creatorUserId
    ? await podsRepository.getProfileForUser(result.pod.creatorUserId)
    : null;
  const creator = creatorProfile
    ? {
        handle: creatorProfile.handle,
        displayName: creatorProfile.displayName,
        avatar: creatorProfile.avatar
      }
    : null;
  return NextResponse.json(
    {
      status: participantSubmissionStatusDto({
        submission: result.submission,
        reviewDecision: result.reviewDecision,
        creator
      })
    },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
