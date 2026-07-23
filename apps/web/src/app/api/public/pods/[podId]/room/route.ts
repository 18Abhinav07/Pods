import { NextResponse } from "next/server";

import { publicVisitorRoomsEnabled } from "../../../../../../lib/alpha-access";
import { consumeNetworkPublicLimit } from "../../../../../../lib/public-rate-limit";
import { isUuidRouteParam } from "../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../lib/server-db";

function boundedInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number
) {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, minimum), maximum);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  if (!publicVisitorRoomsEnabled(process.env)) {
    return NextResponse.json({ error: "Public Pod not found" }, { status: 404 });
  }
  const { podId } = await params;
  if (!isUuidRouteParam(podId)) {
    return NextResponse.json({ error: "Public Pod not found" }, { status: 404 });
  }
  try {
    const limit = await consumeNetworkPublicLimit(request, {
      action: "public_room_poll",
      discriminator: podId,
      limit: 40,
      windowMs: 60_000
    });
    if (!limit.allowed) {
      const retryAfter = Math.max(
        Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000),
        1
      );
      return NextResponse.json(
        { error: "Public room refresh limit reached" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Public room temporarily unavailable" },
      { status: 503 }
    );
  }
  const url = new URL(request.url);
  const parsedCursor = url.searchParams.get("cursor");
  const result = await podsRepository.getPublicVisitorRoom({
    podId,
    afterSequence: boundedInteger(url.searchParams.get("after"), 0, 0, Number.MAX_SAFE_INTEGER),
    ...(parsedCursor !== null
      ? {
          changeCursor: boundedInteger(
            parsedCursor,
            0,
            0,
            Number.MAX_SAFE_INTEGER
          )
        }
      : {}),
    limit: boundedInteger(url.searchParams.get("limit"), 100, 1, 100)
  });
  if (!result) {
    return NextResponse.json({ error: "Public Pod not found" }, { status: 404 });
  }
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
