import { NextResponse } from "next/server";

import { privateEvidenceStorage } from "../../../../../../lib/evidence-storage";
import { hasOpsSession } from "../../../../../../lib/ops-session";
import { podsRepository } from "../../../../../../lib/server-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  if (!(await hasOpsSession())) {
    return NextResponse.json({ error: "Reviewer session required" }, { status: 401 });
  }
  const { submissionId } = await params;
  const result = await podsRepository.getReviewSubmission(submissionId);
  if (!result?.submission.evidenceObjectKey) {
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
