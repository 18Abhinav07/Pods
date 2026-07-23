import { NextResponse } from "next/server";

import { publicVisitorRoomsEnabled } from "../../../../../../../../lib/alpha-access";
import { privateEvidenceStorage } from "../../../../../../../../lib/evidence-storage";
import { consumeNetworkPublicLimit } from "../../../../../../../../lib/public-rate-limit";
import { isUuidRouteParam } from "../../../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../../../lib/server-db";

function notFoundResponse() {
  return NextResponse.json({ error: "Public proof not found" }, { status: 404 });
}

export async function GET(
  request: Request,
  {
    params
  }: {
    params: Promise<{ podId: string; submissionId: string }>;
  }
) {
  if (!publicVisitorRoomsEnabled(process.env)) return notFoundResponse();
  const { podId, submissionId } = await params;
  if (!isUuidRouteParam(podId) || !isUuidRouteParam(submissionId)) {
    return notFoundResponse();
  }
  try {
    const limit = await consumeNetworkPublicLimit(request, {
      action: "public_proof_image",
      discriminator: podId,
      limit: 30,
      windowMs: 60_000
    });
    if (!limit.allowed) {
      const retryAfter = Math.max(
        Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000),
        1
      );
      return NextResponse.json(
        { error: "Public proof refresh limit reached" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
    const access = await podsRepository.getPublicSubmissionEvidence({
      podId,
      submissionId
    });
    if (!access) return notFoundResponse();
    const evidence = await privateEvidenceStorage().readImage(access.objectKey);
    return new NextResponse(new Uint8Array(evidence.bytes), {
      headers: {
        "Content-Type": evidence.contentType,
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return notFoundResponse();
  }
}
