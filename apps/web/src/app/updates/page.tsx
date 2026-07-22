import Link from "next/link";

import { AppHeader } from "../../components/app-header";
import { buildInboxEvents } from "../../lib/inbox-events";
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
  const events = buildInboxEvents(
    await podsRepository.listInboxTimelineForUser(session.userId)
  );

  return (
    <main className="app-shell updates-shell">
      <AppHeader profile={profileForSession(session)} title="Updates" />
      <p className="route-lede entrance entrance-hero">Decisions, reviews, and money movement.</p>
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
          <span>No updates yet</span>
          <p>Applications, funding, roster decisions, proof review, and refunds will be recorded here.</p>
          <Link className="primary-action full-action" href="/discover">Discover public Pods</Link>
        </section>
      )}
    </main>
  );
}
