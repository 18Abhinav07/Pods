import {
  publicModerationActions,
  type PublicModerationAction
} from "@pods/domain";
import { NextResponse } from "next/server";

import { hasOpsSession } from "../../../../../../../lib/ops-session";
import { isUuidRouteParam } from "../../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../../lib/server-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  if (
    process.env.PODS_MODERATION_ENABLED !== "true" ||
    !(await hasOpsSession())
  ) {
    return NextResponse.json({ error: "Operations session required" }, { status: 401 });
  }
  const { reportId } = await params;
  if (!isUuidRouteParam(reportId)) {
    return NextResponse.json({ error: "Public report not found" }, { status: 404 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Moderation action is invalid" }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (
    !publicModerationActions.includes(action as PublicModerationAction) ||
    reason.length < 5 ||
    reason.length > 1000
  ) {
    return NextResponse.json({ error: "Moderation action is invalid" }, { status: 400 });
  }
  try {
    const result = await podsRepository.moderatePublicReport({
      reportId,
      action: action as PublicModerationAction,
      actor: process.env.PODS_OPS_REVIEWER_ID ?? "pods-team-reviewer",
      reason,
      now: new Date()
    });
    return NextResponse.json({
      action: { id: result.id, action: result.action }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Moderation action could not be recorded"
      },
      { status: 400 }
    );
  }
}
