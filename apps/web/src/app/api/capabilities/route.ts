import {
  parseAlphaCapabilities,
  publicAlphaCapabilities
} from "@pods/domain";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(
      publicAlphaCapabilities(parseAlphaCapabilities(process.env))
    );
  } catch {
    return NextResponse.json(
      { error: "Capabilities are temporarily unavailable" },
      { status: 503 }
    );
  }
}
