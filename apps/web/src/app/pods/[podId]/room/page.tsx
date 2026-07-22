import { notFound } from "next/navigation";

import { PodOccurrenceStrip } from "../../../../components/pod-occurrence-strip";
import { PodRoom, type RoomMessage } from "../../../../components/pod-room";
import { PodRoomHeader } from "../../../../components/pod-room-header";
import { presentRoomActivitySchedule } from "../../../../lib/room-activity-presentation";
import { podsRepository } from "../../../../lib/server-db";
import { adaptiveThemeForTemplate, mediaForTemplate } from "../../../../lib/template-presentation";
import { requireSession } from "../../../../lib/session";

export default async function PodRoomPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/room`);
  let loaded: Awaited<ReturnType<typeof loadPodRoom>>;
  try {
    loaded = await loadPodRoom(session.userId, podId);
  } catch {
    notFound();
  }
  const { conversation, effectiveNow, initial, media, messages, proofAction, theme, waitingRoom } = loaded;
  const contract = waitingRoom.pod.contractData;
  if (!contract) notFound();
  return (
    <main className={`app-shell pod-room-shell theme-${theme}`}>
      <PodRoomHeader isCreator={waitingRoom.viewerRole === "creator"} memberCount={waitingRoom.confirmedParticipants} name={contract.activity.name} podId={podId} thumbnail={media.hero} />
      <PodOccurrenceStrip
        initialNow={effectiveNow}
        progressLabel={proofAction.progressLabel}
        stateLabel={proofAction.stateLabel}
        targetAt={proofAction.targetAt}
        targetLabel={proofAction.targetLabel}
      />
      <PodRoom
        conversationId={conversation.id}
        initialLastSequence={initial.conversation.lastSequence}
        initialMessages={messages}
        isCreator={waitingRoom.viewerRole === "creator"}
        podId={podId}
        proofAction={proofAction}
        roomState={initial.conversation.roomState}
        viewer={{
          avatar: session.profile.avatar,
          displayName: session.profile.displayName,
          handle: session.profile.handle
        }}
      />
    </main>
  );
}

async function loadPodRoom(userId: string, podId: string) {
  const waitingRoom = await podsRepository.getWaitingRoomForUser({ userId, podId });
  if (!waitingRoom?.pod.contractData) throw new Error("Pod room not found");
  const conversation = await podsRepository.ensurePodConversation({ podId, userId });
  const initial = await podsRepository.listConversationMessages({
    conversationId: conversation.id,
    userId,
    afterSequence: 0,
    limit: 100
  });
  const now = await podsRepository.getEffectiveTime(new Date());
  const schedule = waitingRoom.viewerRole === "participant"
    ? await podsRepository.listActivityScheduleForMember({ userId, podId })
    : null;
  const proofAction = schedule && schedule.length > 0
    ? presentRoomActivitySchedule({ podId, now, rows: schedule })
    : {
        mode: "browse" as const,
        href: `/pods/${podId}/activity`,
        label: "View proofs",
        stateLabel: "Activity live",
        progressLabel: `${waitingRoom.pod.contractData.commitment.occurrenceCount} scheduled occurrences`,
        targetAt: null,
        targetLabel: null
      };
  return {
    waitingRoom,
    conversation,
    initial,
    theme: adaptiveThemeForTemplate(waitingRoom.pod.templateId),
    media: mediaForTemplate(waitingRoom.pod.templateId, podId),
    proofAction,
    effectiveNow: now.toISOString(),
    messages: initial.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString()
    })) as RoomMessage[]
  };
}
