import { templateContracts, type TemplateId } from "@pods/domain";
import { NextResponse } from "next/server";

import { podsRepository } from "../../../../lib/server-db";
import { getCurrentSession } from "../../../../lib/session";

function isTemplateId(value: unknown): value is TemplateId {
  return templateContracts.some((template) => template.id === value);
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  return NextResponse.json({ pods: await podsRepository.listPodsForOwner(session.userId) });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  const body = (await request.json()) as { templateId?: unknown };
  if (!isTemplateId(body.templateId)) {
    return NextResponse.json({ error: "Choose one of the five fixed templates" }, { status: 400 });
  }
  const draft = await podsRepository.createDraft(session.userId, body.templateId);
  return NextResponse.json({ draft }, { status: 201 });
}
