import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";

const stateCopy = {
  applied: { label: "Awaiting creator decision", detail: "No place is reserved while this application is pending." },
  accepted_unfunded: { label: "Accepted, funding required", detail: "Acceptance does not reserve capacity. Continue to the funding handoff." },
  application_rejected: { label: "Application not accepted", detail: "This decision is final for the current enrollment cycle." },
  application_expired: { label: "Application expired", detail: "The enrollment cutoff passed before this application could proceed." }
} as const;

export default async function ApplicationsPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const session = await requireSession("/applications");
  const query = await searchParams;
  const records = await podsRepository.listApplicationsForUser(session.userId);

  return (
    <main className="app-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="phase-pill">Applications</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Your applications</p>
        <h1>{query.sent === "1" ? "Application sent." : "Track every decision."}</h1>
        <p className="screen-copy">Acceptance is one gate. Funding finality and roster lock still determine the final place.</p>
      </section>
      {records.length > 0 ? (
        <section className="application-status-list">
          {records.map(({ application, pod }) => {
            const copy = stateCopy[application.state];
            const name = pod.contractData?.activity.name ?? "Pod";
            return (
              <article className="application-status-card" key={application.id}>
                <div><span>{copy.label}</span><time>{application.updatedAt.toLocaleDateString("en", { month: "short", day: "numeric" })}</time></div>
                <h2>{name}</h2>
                <p>{pod.state === "cancelled" ? "The creator cancelled this Pod before funding." : copy.detail}</p>
                {application.state === "accepted_unfunded" && pod.state !== "cancelled" ? (
                  <Link className="primary-action full-action" href={`/pods/${pod.id}/fund`}>Continue to funding</Link>
                ) : (
                  <Link className="secondary-action full-action" href={`/pods/${pod.id}`}>View public Pod</Link>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="empty-state entrance entrance-status">
          <span className="empty-index">00</span><h2>No applications yet.</h2><p>Browse public activities and apply when the cadence fits.</p>
          <Link className="primary-action full-action" href="/discover">Browse public Pods</Link>
        </section>
      )}
      <PrimaryNav active="inbox" />
    </main>
  );
}
