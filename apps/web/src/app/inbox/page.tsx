import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";
import { buildInboxEvents } from "../../lib/inbox-events";
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

export default async function InboxPage() {
  const session = await requireSession("/inbox");
  const events = buildInboxEvents(
    await podsRepository.listInboxTimelineForUser(session.userId)
  );

  return (
    <main className="app-shell inbox-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="phase-pill">History</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Inbox</p>
        <h1>Your Pod history.</h1>
        <p className="screen-copy">A chronological record of decisions and money movement. Today remains the place for your next action.</p>
      </section>
      {events.length > 0 ? (
        <section className="inbox-timeline" aria-label="Pod history">
          {events.map((event, index) => (
            <Link className={`inbox-event is-${event.tone}`} href={event.href} key={event.id}>
              <span className="inbox-event-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="inbox-event-copy">
                <small>{event.podName}</small>
                <strong>{event.title}</strong>
                <span>{event.detail}</span>
              </span>
              <time dateTime={event.occurredAt.toISOString()}>{eventMoment(event.occurredAt)}</time>
            </Link>
          ))}
        </section>
      ) : (
        <section className="neutral-empty entrance entrance-status">
          <span>No history yet</span>
          <p>Applications, funding, roster decisions, and refunds will be recorded here.</p>
          <Link className="primary-action full-action" href="/discover">Discover public Pods</Link>
        </section>
      )}
      <PrimaryNav active="inbox" />
    </main>
  );
}
