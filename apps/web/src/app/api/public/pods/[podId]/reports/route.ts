import { validatePublicContentReportInput } from "@pods/domain";
import { NextResponse } from "next/server";

import { publicVisitorRoomsEnabled } from "../../../../../../lib/alpha-access";
import { consumeAccountPublicLimit } from "../../../../../../lib/public-rate-limit";
import { isUuidRouteParam } from "../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../lib/server-db";
import { getCurrentSession } from "../../../../../../lib/session";

function unavailable() {
  return NextResponse.json({ error: "Public Pod not found" }, { status: 404 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  if (
    !publicVisitorRoomsEnabled(process.env) ||
    process.env.PODS_MODERATION_ENABLED !== "true"
  ) {
    return unavailable();
  }
  const { podId } = await params;
  if (!isUuidRouteParam(podId)) return unavailable();
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Report details are invalid" }, { status: 400 });
  }
  const validated = validatePublicContentReportInput(body);
  if (!validated.success) {
    return NextResponse.json({ errors: validated.errors }, { status: 400 });
  }
  try {
    const limit = await consumeAccountPublicLimit(session.userId, {
      action: "public_report",
      limit: 10,
      windowMs: 86_400_000
    });
    if (!limit.allowed) {
      const retryAfter = Math.max(
        Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000),
        1
      );
      return NextResponse.json(
        { error: "Daily public report limit reached" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
    const report = await podsRepository.reportPublicContent({
      reporterUserId: session.userId,
      podId,
      ...validated.value,
      now: new Date()
    });
    return NextResponse.json(
      { report: { id: report.id, state: report.state } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Report could not be sent" },
      { status: 400 }
    );
  }
}
