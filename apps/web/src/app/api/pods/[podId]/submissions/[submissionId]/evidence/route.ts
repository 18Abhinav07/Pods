import { NextResponse } from "next/server";

import { privateEvidenceStorage } from "../../../../../../../lib/evidence-storage";
import { podsRepository } from "../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ podId: string; submissionId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId, submissionId } = await params;
  const result = await podsRepository.getSubmissionForOwner({
    userId: session.userId,
    submissionId
  });
  if (!result || result.pod.id !== podId || !result.submission.evidenceObjectKey) {
    return NextResponse.json({ error: "Evidence image not found" }, { status: 404 });
  }
  const evidence = await privateEvidenceStorage().readImage(
    result.submission.evidenceObjectKey
  );
  return new NextResponse(new Uint8Array(evidence.bytes), {
    headers: {
      "Content-Type": evidence.contentType,
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'"
    }
  });
}
