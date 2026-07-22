import { validateProfileInput } from "@pods/domain";
import { NextResponse } from "next/server";

import { podsRepository } from "../../../lib/server-db";
import { getCurrentSession } from "../../../lib/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  }
  return NextResponse.json({
    profile: await podsRepository.getProfileForUser(session.userId)
  });
}

export async function PUT(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Profile data is required" }, { status: 400 });
  }
  const validation = validateProfileInput(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  try {
    const profile = await podsRepository.saveProfile(session.userId, validation.value);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.message === "Profile handle is already taken") {
      return NextResponse.json(
        { errors: { handle: "Profile handle is already taken" } },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Profile could not be saved" }, { status: 500 });
  }
}
