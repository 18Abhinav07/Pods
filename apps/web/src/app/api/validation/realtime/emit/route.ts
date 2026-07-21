import { NextResponse } from "next/server";

import {
  realtimeSpikeHub,
  realtimeSpikeKinds,
  type RealtimeSpikeKind
} from "../../../../../lib/realtime-spike-hub";
import {
  authorizeRealtimeSpikePod,
  realtimeSpikeEnabled
} from "../../../../../lib/realtime-spike-server";

export const dynamic = "force-dynamic";

function validKind(value: unknown): value is RealtimeSpikeKind {
  return (
    typeof value === "string" &&
    realtimeSpikeKinds.includes(value as RealtimeSpikeKind)
  );
}

export async function POST(request: Request) {
  if (!realtimeSpikeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { podId?: unknown; clientEventId?: unknown; kind?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  if (
    typeof body.podId !== "string" ||
    body.podId.length < 1 ||
    body.podId.length > 100 ||
    typeof body.clientEventId !== "string" ||
    body.clientEventId.length < 1 ||
    body.clientEventId.length > 100 ||
    !validKind(body.kind)
  ) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const authorization = await authorizeRealtimeSpikePod(body.podId);
  if (authorization.status === "unauthenticated") {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (authorization.status === "forbidden") {
    return NextResponse.json({ error: "Pod access required" }, { status: 403 });
  }

  const event = realtimeSpikeHub.publish({
    podId: body.podId,
    actorId: authorization.session.userId,
    clientEventId: body.clientEventId,
    kind: body.kind
  });
  return NextResponse.json(event, { status: 201 });
}
