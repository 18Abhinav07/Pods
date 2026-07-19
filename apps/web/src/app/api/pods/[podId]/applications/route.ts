import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId } = await params;
  const pod = await podsRepository.getPublicPod(podId, new Date());
  if (!pod?.contractData || pod.contractData.community.visibility !== "public") {
    return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  }
  const questions = pod.contractData.community.applicationQuestions;
  const body = (await request.json()) as { answers?: unknown };
  if (!Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Answer every application question" }, { status: 400 });
  }
  const answers = body.answers.map((answer, index) => ({
    question: questions[index] ?? "",
    answer: typeof answer === "string" ? answer : ""
  }));
  try {
    const application = await podsRepository.applyToPublicPod({
      podId,
      applicantUserId: session.userId,
      answers,
      now: new Date()
    });
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Application could not be sent";
    const status = message === "Application already exists" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
