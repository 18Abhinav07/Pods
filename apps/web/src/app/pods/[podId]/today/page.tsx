import Link from "next/link";
import { notFound } from "next/navigation";

import { PodWaitingRoom } from "../../../../components/pod-waiting-room";
import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";

export default async function PodTodayPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/today`);
  const room = await podsRepository.getWaitingRoomForUser({ userId: session.userId, podId });
  if (!room?.pod.contractData) notFound();
  const contract = room.pod.contractData;

  return (
    <main className="app-shell waiting-room-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="phase-pill">Pod room</span>
      </header>
      <PodWaitingRoom
        podId={room.pod.id}
        name={contract.activity.name}
        purpose={contract.activity.purpose}
        viewerRole={room.viewerRole}
        membershipState={room.membership?.state ?? null}
        fundingStatusHref={room.deposit ? `/pods/${room.pod.id}/fund/status?intent=${room.deposit.id}` : null}
        confirmedParticipants={room.confirmedParticipants}
        minParticipants={contract.community.minParticipants}
        maxParticipants={contract.community.maxParticipants}
        cutoffAt={room.firstOccurrence.opensAt.toISOString()}
        firstOccurrenceAt={room.firstOccurrence.opensAt.toISOString()}
        firstOccurrenceDate={room.firstOccurrence.localDate}
        occurrenceCount={contract.commitment.occurrenceCount}
        weekdays={contract.activity.weekdays}
        timeZone={contract.activity.timeZone}
        nimPerOccurrence={contract.commitment.lunaPerOccurrence / 100_000}
        totalNim={contract.commitment.totalLuna / 100_000}
        refund={room.refund ? {
          state: room.refund.state,
          amountNim: room.refund.amountLuna / 100_000,
          transactionHash: room.refund.transactionHash,
          confirmedAt: room.refund.confirmedAt?.toISOString() ?? null
        } : null}
      />
    </main>
  );
}
