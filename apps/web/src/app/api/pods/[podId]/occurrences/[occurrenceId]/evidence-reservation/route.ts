import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string; occurrenceId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId, occurrenceId } = await params;
  let body: { submissionId?: unknown; expectedMediaSha256?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid evidence reservation request" }, { status: 400 });
  }
  if (typeof body.submissionId !== "string") {
    return NextResponse.json({ error: "Evidence draft not found" }, { status: 404 });
  }
  if (
    typeof body.expectedMediaSha256 !== "string" ||
    !/^[a-f0-9]{64}$/i.test(body.expectedMediaSha256)
  ) {
    return NextResponse.json({ error: "Evidence image hash is required" }, { status: 400 });
  }
  try {
    const now = await podsRepository.getEffectiveTime(new Date());
    const reservation = await podsRepository.reserveEvidenceUpload({
      userId: session.userId,
      podId,
      occurrenceId,
      submissionId: body.submissionId,
      expectedMediaSha256: body.expectedMediaSha256,
      now
    });
    return NextResponse.json({
      reservation: {
        id: reservation.id,
        expiresAt: reservation.expiresAt
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evidence upload could not be reserved" },
      { status: 400 }
    );
  }
}
