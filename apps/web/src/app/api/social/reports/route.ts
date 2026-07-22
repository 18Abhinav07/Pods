import { validateReportInput } from "@pods/domain";
import { NextResponse } from "next/server";

import { podsRepository } from "../../../../lib/server-db";
import { getCurrentSession } from "../../../../lib/session";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  if (typeof body.handle !== "string") return NextResponse.json({ error: "Profile handle is required" }, { status: 400 });
  const validated = validateReportInput(body);
  if (!validated.success) return NextResponse.json({ errors: validated.errors }, { status: 400 });
  try {
    const report = await podsRepository.reportProfile({
      reporterUserId: session.userId,
      handle: body.handle,
      ...validated.value,
      now: new Date()
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Report could not be sent" }, { status: 400 });
  }
}
