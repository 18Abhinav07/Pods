import { notFound, redirect } from "next/navigation";

import { PodOccurrenceStrip } from "../../../../components/pod-occurrence-strip";
import { PodRoom, type RoomMessage } from "../../../../components/pod-room";
import { PodRoomHeader } from "../../../../components/pod-room-header";
import {
  PublicVisitorRoom,
  type PublicVisitorRoomData
} from "../../../../components/public-visitor-room";
import { publicVisitorRoomsEnabled } from "../../../../lib/alpha-access";
import { publicPodPageSession } from "../../../../lib/alpha-access-server";
import { presentRoomActivitySchedule } from "../../../../lib/room-activity-presentation";
import { isUuidRouteParam } from "../../../../lib/route-params";
import { podsRepository } from "../../../../lib/server-db";
import { adaptiveThemeForTemplate, mediaForTemplate } from "../../../../lib/template-presentation";

export default async function PodRoomPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  if (!isUuidRouteParam(podId)) notFound();
  const session = await publicPodPageSession();
  const authenticatedRoom = session
    ? await loadAuthenticatedPodRoom(session.userId, podId).catch(() => null)
    : null;
  if (authenticatedRoom) {
    const {
      conversation,
      effectiveNow,
      initial,
      media,
      memberProfile,
      messages,
      proofAction,
      theme,
      waitingRoom
    } = authenticatedRoom;
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
          initialChangeCursor={initial.conversation.changeCursor}
          initialLastSequence={initial.conversation.lastSequence}
          initialMessages={messages}
          isCreator={waitingRoom.viewerRole === "creator"}
          podId={podId}
          proofAction={proofAction}
          roomState={initial.conversation.roomState}
          viewer={{
            avatar: memberProfile.avatar,
            displayName: memberProfile.displayName,
            handle: memberProfile.handle
          }}
        />
      </main>
    );
  }

  const surface = await podsRepository.getPublicPodSurface(podId, new Date());
  if (!surface) notFound();
  if (surface.stage === "open") redirect(`/pods/${podId}`);
  if (
    !surface.visitorRoomAvailable ||
    !publicVisitorRoomsEnabled(process.env)
  ) {
    notFound();
  }
  const initial = await podsRepository.getPublicVisitorRoom({
    podId,
    afterSequence: 0,
    limit: 100
  });
  if (!initial) notFound();
  const serializable = {
    ...initial,
    messages: initial.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString()
    }))
  } as PublicVisitorRoomData;
  return (
    <PublicVisitorRoom
      canReport={Boolean(session)}
      initial={serializable}
      name={initial.pod.name}
      reportingEnabled={process.env.PODS_MODERATION_ENABLED === "true"}
    />
  );
}

async function loadAuthenticatedPodRoom(userId: string, podId: string) {
  const memberProfile = await podsRepository.getProfileForUser(userId);
  if (!memberProfile) throw new Error("Member profile not found");
  return {
    ...(await loadPodRoom(userId, podId)),
    memberProfile
  };
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
    ? presentRoomActivitySchedule({
        podId,
        now,
        rows: schedule,
        evidenceMode: waitingRoom.pod.contractData.evidenceMode
      })
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

export const metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true
  }
};
