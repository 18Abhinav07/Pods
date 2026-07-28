import Link from "next/link";

import { AppHeader } from "../../components/app-header";
import styles from "../../components/home-flow.module.css";
import { buildInboxEvents, buildProofReviewInboxEvents } from "../../lib/inbox-events";
import { profileForSession } from "../../lib/profile-presentation";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";

function eventMoment(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}

export default async function UpdatesPage() {
  const session = await requireSession("/updates");
  const [timeline, proofReviewNotifications] = await Promise.all([
    podsRepository.listInboxTimelineForUser(session.userId),
    podsRepository.listProofReviewNotificationsForUser(session.userId)
  ]);
  const events = [
    ...buildInboxEvents(timeline),
    ...buildProofReviewInboxEvents(proofReviewNotifications)
  ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());

  return (
    <main className={`app-shell ${styles.page}`}>
      <AppHeader profile={profileForSession(session)} title="Updates" />
      <section className={styles.historyIntro}>
        <p>Your durable record of decisions, proof reviews, and NIM movement.</p>
      </section>
      {events.length > 0 ? (
        <section className={styles.historyList} aria-label="Pod history">
          {events.map((event) => (
            <Link className={styles.historyCard} data-tone={event.tone} href={event.href} key={event.id}>
              <span className={styles.historyIcon} aria-hidden="true">{event.tone === "positive" ? "✓" : event.tone === "attention" ? "!" : "•"}</span>
              <span className={styles.historyCopy}>
                <small>{event.podName}</small>
                <strong>{event.title}</strong>
                <span>{event.detail}</span>
              </span>
              <time dateTime={event.occurredAt.toISOString()}>{eventMoment(event.occurredAt)}</time>
            </Link>
          ))}
        </section>
      ) : (
        <section className={styles.empty}>
          <h2>No updates yet.</h2>
          <p>Applications, funding, proof review, and transfers will appear here as they happen.</p>
          <Link className={styles.primaryLink} href="/discover">Discover public Pods</Link>
        </section>
      )}
    </main>
  );
}
