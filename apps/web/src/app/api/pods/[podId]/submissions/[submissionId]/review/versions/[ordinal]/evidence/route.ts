import { NextResponse } from "next/server";

import { privateEvidenceStorage } from "../../../../../../../../../../lib/evidence-storage";
import { isUuidRouteParam } from "../../../../../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../../../../lib/session";

function evidenceNotFound() {
  return NextResponse.json({ error: "Review evidence not found" }, { status: 404 });
}

export async function GET(
  _request: Request,
  {
    params
  }: {
    params: Promise<{
      podId: string;
      submissionId: string;
      ordinal: string;
    }>;
  }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  }
  const { podId, submissionId, ordinal: rawOrdinal } = await params;
  const ordinal = Number(rawOrdinal);
  if (
    !isUuidRouteParam(podId) ||
    !isUuidRouteParam(submissionId) ||
    !Number.isSafeInteger(ordinal) ||
    ordinal < 1
  ) {
    return evidenceNotFound();
  }

  try {
    const participantReview = await podsRepository.getProofReviewForParticipant({
      userId: session.userId,
      podId,
      submissionId
    });
    const review = participantReview ?? await podsRepository.getProofReviewForCreator({
      creatorUserId: session.userId,
      podId,
      submissionId
    });
    const version = review?.versions.find((candidate) => candidate.ordinal === ordinal);
    if (!version?.evidenceObjectKey) return evidenceNotFound();
    const evidence = await privateEvidenceStorage().readImage(
      version.evidenceObjectKey
    );
    return new NextResponse(new Uint8Array(evidence.bytes), {
      headers: {
        "Content-Type": evidence.contentType,
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "default-src 'none'",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin"
      }
    });
  } catch {
    return evidenceNotFound();
  }
}
