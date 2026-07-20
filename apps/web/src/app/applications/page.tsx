import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";
import { presentPodRelationship } from "../../lib/participant-pod-state";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";

export default async function ApplicationsPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const session = await requireSession("/applications");
  const query = await searchParams;
  const [records, memberships] = await Promise.all([
    podsRepository.listApplicationsForUser(session.userId),
    podsRepository.listMembershipsForUser(session.userId)
  ]);
  const membershipByApplication = new Map(
    memberships.flatMap(({ membership }) =>
      membership.applicationId ? [[membership.applicationId, membership] as const] : []
    )
  );

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
            const membership = membershipByApplication.get(application.id);
            const presentation = presentPodRelationship({
              podId: pod.id,
              relationship: {
                kind: "member",
                state: membership?.state ?? application.state,
                depositIntentId: membership?.depositIntentId ?? null
              }
            });
            const name = pod.contractData?.activity.name ?? "Pod";
            const cancelled = pod.state === "cancelled";
            return (
              <article className="application-status-card" key={application.id}>
                <div><span>{cancelled ? "Pod cancelled" : presentation.statusLabel}</span><time>{application.updatedAt.toLocaleDateString("en", { month: "short", day: "numeric" })}</time></div>
                <h2>{name}</h2>
                <p>{cancelled ? "The creator cancelled this Pod before funding." : presentation.statusDetail}</p>
                <Link
                  className={cancelled ? "secondary-action full-action" : "primary-action full-action"}
                  href={cancelled ? "/my-pods" : presentation.href}
                >
                  {cancelled ? "View My Pods" : presentation.actionLabel}
                </Link>
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
