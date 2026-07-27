import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import styles from "../../../../components/financial-flow.module.css";
import { PodWaitingRoom } from "../../../../components/pod-waiting-room";
import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";

export default async function PodTodayPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/today`);
  const room = await podsRepository.getWaitingRoomForUser({ userId: session.userId, podId });
  if (!room?.pod.contractData) notFound();
  const contract = room.pod.contractData;
  const settlementViewer =
    room.viewerRole === "creator" ||
    room.membership?.state === "roster_locked" ||
    room.membership?.state === "active";
  if (settlementViewer && room.pod.state === "active") {
    redirect(`/pods/${podId}/room`);
  }
  if (
    settlementViewer &&
    (
      room.pod.state === "final_review" ||
      room.pod.state === "completed"
    )
  ) {
    redirect(
      contract.settlementMode === "proportional"
        ? `/pods/${podId}/settlement`
        : `/pods/${podId}/room`
    );
  }

  return (
    <main className={`app-shell waiting-room-shell ${styles.financialPage}`}>
      <header className={styles.financialTopbar}>
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className={styles.routeLabel}>Pod status</span>
      </header>
      <PodWaitingRoom
        podId={room.pod.id}
        name={contract.activity.name}
        purpose={contract.activity.purpose}
        viewerRole={room.viewerRole}
        membershipState={room.membership?.state ?? null}
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
        settlementMode={contract.settlementMode ?? "proportional"}
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
