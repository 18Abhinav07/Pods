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
  let body: {
    task?: unknown;
    deliverableType?: unknown;
    goal?: unknown;
    recoveryOfSubmissionId?: unknown;
  };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid commitment request" }, { status: 400 });
  }
  try {
    const now = await podsRepository.getEffectiveTime(new Date());
    const recoveryOfSubmissionId =
      typeof body.recoveryOfSubmissionId === "string"
        ? body.recoveryOfSubmissionId
        : null;
    const commitment = await podsRepository.lockOccurrenceCommitment({
      userId: session.userId,
      podId,
      occurrenceId,
      task: body.task,
      deliverableType: body.deliverableType,
      goal: body.goal,
      ...(recoveryOfSubmissionId ? { recoveryOfSubmissionId } : {}),
      now
    });
    return NextResponse.json({ commitment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Task could not be locked" },
      { status: 400 }
    );
  }
}
