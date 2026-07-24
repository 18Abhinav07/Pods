import { NextResponse } from "next/server";

import type { PublicVisitorRoomData } from "../../../../../../components/public-visitor-room";
import { publicVisitorRoomsEnabled } from "../../../../../../lib/alpha-access";
import { consumeNetworkPublicLimit } from "../../../../../../lib/public-rate-limit";
import { isUuidRouteParam } from "../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../lib/server-db";

type PublicVisitorRoomRecord = NonNullable<
  Awaited<ReturnType<typeof podsRepository.getPublicVisitorRoom>>
>;

function serializePublicVisitorRoom(
  result: PublicVisitorRoomRecord
): PublicVisitorRoomData {
  if (result.pod.stage !== "live" && result.pod.stage !== "recent") {
    throw new Error("Public visitor room returned a non-public Pod stage");
  }
  return {
    pod: {
      id: result.pod.id,
      stage: result.pod.stage,
      state: result.pod.state,
      templateId: result.pod.templateId,
      name: result.pod.name,
      purpose: result.pod.purpose,
      roomState: result.pod.roomState,
      participantCount: result.pod.participantCount,
      occurrenceCount: result.pod.occurrenceCount,
      creator: result.pod.creator
        ? {
            handle: result.pod.creator.handle,
            displayName: result.pod.creator.displayName,
            avatar: result.pod.creator.avatar,
            profileVisibility: result.pod.creator.profileVisibility
          }
        : null
    },
    changeCursor: result.changeCursor,
    lastSequence: result.lastSequence,
    messages: result.messages.map((message) => ({
      id: message.id,
      sequence: message.sequence,
      kind: message.kind,
      body: message.body,
      reply: message.reply
        ? {
            messageId: message.reply.messageId,
            available: message.reply.available,
            senderDisplayName: message.reply.senderDisplayName,
            excerpt: message.reply.excerpt
          }
        : null,
      hidden: message.hidden,
      pinned: message.pinned,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender
        ? {
            handle: message.sender.handle,
            displayName: message.sender.displayName,
            avatar: message.sender.avatar,
            profileVisibility: message.sender.profileVisibility
          }
        : null,
      activity: message.activity
        ? {
            occurrenceOrdinal: message.activity.occurrenceOrdinal,
            localDate: message.activity.localDate,
            task: message.activity.task,
            deliverableType: message.activity.deliverableType,
            templateId: message.activity.templateId,
            state: message.activity.state,
            submissionId: message.activity.submissionId,
            templateEvidence: message.activity.templateEvidence,
            resultSummary: message.activity.resultSummary,
            artifactUrl: message.activity.artifactUrl,
            supportingImageAvailable:
              message.activity.supportingImageAvailable
          }
        : null,
      reactions: message.reactions.map(({ code, count }) => ({ code, count }))
    }))
  };
}

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
  return NextResponse.json(serializePublicVisitorRoom(result), {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
