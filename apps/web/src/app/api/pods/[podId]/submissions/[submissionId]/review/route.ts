import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { privateEvidenceStorage } from "../../../../../../../lib/evidence-storage";
import { proofReviewView } from "../../../../../../../lib/proof-review-view";
import { isUuidRouteParam } from "../../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../lib/session";

const missing = () =>
  NextResponse.json({ error: "Proof review not found" }, { status: 404 });

async function context(params: Promise<{ podId: string; submissionId: string }>) {
  const session = await getCurrentSession();
  if (!session) return { response: NextResponse.json({ error: "Wallet session required" }, { status: 401 }) };
  const { podId, submissionId } = await params;
  if (!isUuidRouteParam(podId) || !isUuidRouteParam(submissionId)) {
    return { response: missing() };
  }
  return { session, podId, submissionId };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ podId: string; submissionId: string }> }
) {
  const resolved = await context(params);
  if ("response" in resolved) return resolved.response;
  const review = await podsRepository.getProofReviewForParticipant({
    userId: resolved.session.userId,
    podId: resolved.podId,
    submissionId: resolved.submissionId
  });
  if (!review) return missing();
  return NextResponse.json(
    { review: proofReviewView(review) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string; submissionId: string }> }
) {
  const resolved = await context(params);
  if ("response" in resolved) return resolved.response;
  let body: Record<string, unknown>;
  let image: File | null = null;
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      body = {};
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") body[key] = value;
      }
      const candidate = form.get("image");
      image = candidate !== null && typeof candidate !== "string" && candidate.size > 0
        ? candidate
        : null;
    } else {
      body = await request.json() as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json({ error: "Proof review request is invalid" }, { status: 400 });
  }
  const idempotencyKey = typeof body.idempotencyKey === "string"
    ? body.idempotencyKey
    : "";
  if (body.action !== "share_with_pod" && !isUuidRouteParam(idempotencyKey)) {
    return NextResponse.json({ error: "A valid action key is required" }, { status: 400 });
  }
  let storedEvidence: Awaited<
    ReturnType<ReturnType<typeof privateEvidenceStorage>["storeImage"]>
  > | null = null;
  let mediaSha256: string | null = null;
  try {
    if (image) {
      if (
        body.action !== "respond_clarification" &&
        body.action !== "open_appeal"
      ) {
        return NextResponse.json(
          { error: "Supporting media is not available for this action" },
          { status: 400 }
        );
      }
      const authorizedReview = await podsRepository.getProofReviewForParticipant({
        userId: resolved.session.userId,
        podId: resolved.podId,
        submissionId: resolved.submissionId
      });
      if (!authorizedReview) return missing();
      const source = Buffer.from(await image.arrayBuffer());
      mediaSha256 = createHash("sha256").update(source).digest("hex");
      storedEvidence = await privateEvidenceStorage().storeImage({
        podId: resolved.podId,
        membershipId: authorizedReview.submission.membershipId,
        occurrenceId: authorizedReview.occurrence.id,
        source
      });
    }
    const now = await podsRepository.getEffectiveTime(new Date());
    let result;
    if (body.action === "share_with_pod") {
      result = await podsRepository.shareProofReviewWithPod({
        userId: resolved.session.userId,
        podId: resolved.podId,
        submissionId: resolved.submissionId,
        now
      });
    } else if (body.action === "respond_clarification") {
      result = await podsRepository.respondToProofClarification({
        userId: resolved.session.userId,
        podId: resolved.podId,
        submissionId: resolved.submissionId,
        idempotencyKey,
        response: body,
        evidence: storedEvidence,
        mediaSha256,
        now
      });
    } else if (body.action === "open_appeal") {
      result = await podsRepository.appealProofRejection({
        userId: resolved.session.userId,
        podId: resolved.podId,
        submissionId: resolved.submissionId,
        idempotencyKey,
        appeal: body,
        evidence: storedEvidence,
        mediaSha256,
        now
      });
    } else if (body.action === "accept_rejection") {
      result = await podsRepository.acceptProofRejection({
        userId: resolved.session.userId,
        podId: resolved.podId,
        submissionId: resolved.submissionId,
        idempotencyKey,
        now
      });
    } else {
      return NextResponse.json({ error: "Proof review action is not supported" }, { status: 400 });
    }
    if (!result) {
      if (storedEvidence) {
        await privateEvidenceStorage().deleteImage(storedEvidence.objectKey);
      }
      return missing();
    }
    if (
      storedEvidence &&
      "kind" in result &&
      result.kind === "idempotent"
    ) {
      await privateEvidenceStorage().deleteImage(storedEvidence.objectKey);
      storedEvidence = null;
    }
    const review = await podsRepository.getProofReviewForParticipant({
      userId: resolved.session.userId,
      podId: resolved.podId,
      submissionId: resolved.submissionId
    });
    if (!review) return missing();
    return NextResponse.json({ review: proofReviewView(review) });
  } catch (error) {
    if (storedEvidence) {
      try {
        await privateEvidenceStorage().deleteImage(storedEvidence.objectKey);
      } catch {
        // The durable action did not commit. Storage cleanup can be retried by maintenance.
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proof review action failed" },
      { status: 409 }
    );
  }
}
