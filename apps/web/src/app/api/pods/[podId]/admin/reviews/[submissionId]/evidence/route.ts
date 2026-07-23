import { NextResponse } from "next/server";

import { privateEvidenceStorage } from "../../../../../../../../lib/evidence-storage";
import { isUuidRouteParam } from "../../../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../../lib/session";

function evidenceNotFound() {
  return NextResponse.json({ error: "Evidence image not found" }, { status: 404 });
}

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
    return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  }
  const { podId, submissionId } = await params;
  if (!isUuidRouteParam(podId) || !isUuidRouteParam(submissionId)) {
    return evidenceNotFound();
  }

  try {
    const access = await podsRepository.getCreatorSubmissionEvidence({
      creatorUserId: session.userId,
      podId,
      submissionId
    });
    if (!access) return evidenceNotFound();
    const evidence = await privateEvidenceStorage().readImage(access.objectKey);
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
