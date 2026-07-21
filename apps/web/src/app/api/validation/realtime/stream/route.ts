import {
  realtimeSpikeHub,
  type RealtimeSpikeEvent
} from "../../../../../lib/realtime-spike-hub";
import {
  authorizeRealtimeSpikePod,
  realtimeSpikeEnabled
} from "../../../../../lib/realtime-spike-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function eventCursor(request: Request) {
  const raw = request.headers.get("last-event-id") ?? "0";
  const cursor = Number(raw);
  return Number.isSafeInteger(cursor) && cursor >= 0 ? cursor : 0;
}

function encodeEvent(event: RealtimeSpikeEvent) {
  return `id: ${event.id}\nevent: validation\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: Request) {
  if (!realtimeSpikeEnabled()) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const podId = new URL(request.url).searchParams.get("podId") ?? "";
  const authorization = await authorizeRealtimeSpikePod(podId);
  if (authorization.status === "unauthenticated") {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  if (authorization.status === "forbidden") {
    return Response.json({ error: "Pod access required" }, { status: 403 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("retry: 1500\n\n"));
      const unsubscribe = realtimeSpikeHub.subscribe(
        podId,
        eventCursor(request),
        (event) => controller.enqueue(encoder.encode(encodeEvent(event)))
      );
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 20_000);
      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // The client may already have closed the stream.
        }
      };
      request.signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "content-type": "text/event-stream; charset=utf-8",
      "x-accel-buffering": "no"
    }
  });
}
