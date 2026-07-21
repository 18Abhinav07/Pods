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
  if (room.pod.state === "active") {
    const now = await podsRepository.getEffectiveTime(new Date());
    const activities = room.viewerRole === "participant"
      ? await podsRepository.listCurrentActivitiesForUser({ userId: session.userId, now })
      : [];
    const current = activities.find(({ pod }) => pod.id === podId);
    const nextLabel = current
      ? !current.commitment
        ? "Lock occurrence task"
        : !current.submission || current.submission.state === "draft"
          ? "Complete evidence"
          : current.submission.state === "reviewing"
            ? "View review status"
            : "View approved work"
      : "No participant action";
    return (
      <main className="app-shell active-pod-shell">
        <header className="app-topbar entrance entrance-topbar">
          <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
          <span className="phase-pill">Activity live</span>
        </header>
        <section className="today-hero entrance entrance-hero">
          <p className="eyebrow">{room.viewerRole === "creator" ? "Creator room" : "Your Pod"}</p>
          <h1>{contract.activity.name}</h1>
          <p className="screen-copy">{contract.activity.purpose}</p>
        </section>
        <section className="active-pod-metrics">
          <div><span>Roster</span><strong>{room.confirmedParticipants} active</strong></div>
          <div><span>Schedule</span><strong>{contract.commitment.occurrenceCount} occurrences</strong></div>
          <div><span>Verification</span><strong>Pods team</strong></div>
        </section>
        {current ? (
          <Link className="active-occurrence-card" href={`/pods/${podId}/activity/${current.occurrence.id}`}>
            <span>Occurrence {current.occurrence.ordinal}</span>
            <strong>{nextLabel}</strong>
            <small>Closes {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(current.occurrence.closesAt)}</small>
          </Link>
        ) : (
          <section className="pod-relationship-banner is-secured"><strong>{room.viewerRole === "creator" ? "Participants are building" : "No open occurrence"}</strong><p>{room.viewerRole === "creator" ? "Follow sanitized, manually approved progress in the Pod feed." : "The next frozen occurrence will appear here when its window opens."}</p></section>
        )}
        <div className="active-pod-actions">
          <Link className="primary-action full-action" href={`/pods/${podId}/feed`}>Open Pod feed</Link>
          <Link className="secondary-action full-action" href={`/pods/${podId}/rules`}>Review frozen rules</Link>
        </div>
      </main>
    );
  }

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
