import { getCurrentSession } from "../../../../lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    walletAddress: session.walletAddress
  });
}
