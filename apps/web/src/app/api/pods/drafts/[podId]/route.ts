import type {
  ActivityStepInput,
  CommitmentStepInput,
  CommunityStepInput
} from "@pods/domain";
import {
  parseNimToLuna,
  validateActivityStep,
  validateCommunityStep
} from "@pods/domain";
import { NextResponse } from "next/server";

import { podsRepository } from "../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId } = await params;
  const pod = await podsRepository.getPodForOwner(session.userId, podId);
  if (!pod) return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  return NextResponse.json({ pod });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId } = await params;
  const pod = await podsRepository.getPodForOwner(session.userId, podId);
  if (!pod) return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  if (pod.state !== "draft") {
    return NextResponse.json(
      { error: "Published Pods cannot be deleted" },
      { status: 409 }
    );
  }
  const deleted = await podsRepository.deleteDraft(session.userId, podId);
  if (!deleted) {
    return NextResponse.json(
      { error: "Draft changed before it could be deleted" },
      { status: 409 }
    );
  }
  return new Response(null, { status: 204 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const { podId } = await params;
  const pod = await podsRepository.getPodForOwner(session.userId, podId);
  if (!pod) return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  if (pod.state !== "draft") {
    return NextResponse.json({ error: "Pod contract is immutable after publication" }, { status: 409 });
  }

  const body = (await request.json()) as { step?: unknown; value?: unknown };
  try {
    if (body.step === "activity") {
      const value = body.value as ActivityStepInput;
      const validation = validateActivityStep(pod.templateId, value);
      if (!validation.success) {
        return NextResponse.json({ errors: validation.errors }, { status: 400 });
      }
      return NextResponse.json({
        pod: await podsRepository.saveActivityStep(session.userId, podId, value)
      });
    }
    if (body.step === "community") {
      const value = body.value as CommunityStepInput;
      const validation = validateCommunityStep(value);
      if (!validation.success) {
        return NextResponse.json({ errors: validation.errors }, { status: 400 });
      }
      return NextResponse.json({
        pod: await podsRepository.saveCommunityStep(session.userId, podId, value)
      });
    }
    if (body.step === "commitment") {
      const value = body.value as CommitmentStepInput;
      parseNimToLuna(value.nimPerOccurrence);
      return NextResponse.json({
        pod: await podsRepository.saveCommitmentStep(session.userId, podId, value)
      });
    }
    return NextResponse.json({ error: "Choose a supported creation step" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Draft could not be saved" },
      { status: 400 }
    );
  }
}
