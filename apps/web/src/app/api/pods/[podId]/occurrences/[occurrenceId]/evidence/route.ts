import { NextResponse } from "next/server";

import { privateEvidenceStorage } from "../../../../../../../lib/evidence-storage";
import { podsRepository } from "../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string; occurrenceId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId, occurrenceId } = await params;
  const form = await request.formData();
  const submissionId = form.get("submissionId");
  const image = form.get("image");
  if (typeof submissionId !== "string" || !(image instanceof File)) {
    return NextResponse.json({ error: "Choose an evidence image" }, { status: 400 });
  }
  const activity = await podsRepository.getActivityOccurrenceForMember({
    userId: session.userId,
    podId,
    occurrenceId
  });
  if (!activity || activity.submission?.id !== submissionId || activity.submission.state !== "draft") {
    return NextResponse.json({ error: "Editable evidence draft not found" }, { status: 404 });
  }
  let stored: Awaited<ReturnType<ReturnType<typeof privateEvidenceStorage>["storeImage"]>>;
  try {
    const storage = privateEvidenceStorage();
    stored = await storage.storeImage({
      podId,
      membershipId: activity.membership.id,
      occurrenceId,
      source: Buffer.from(await image.arrayBuffer())
    });
    try {
      const now = await podsRepository.getEffectiveTime(new Date());
      const submission = await podsRepository.attachSubmissionEvidence({
        userId: session.userId,
        submissionId,
        evidence: stored,
        now
      });
      return NextResponse.json({ submission, evidence: stored });
    } catch (error) {
      await storage.deleteImage(stored.objectKey);
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evidence image could not be stored" },
      { status: 400 }
    );
  }
}
