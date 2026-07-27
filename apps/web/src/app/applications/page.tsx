import Link from "next/link";
import type { PodState } from "@pods/domain";

import styles from "../../components/acquisition-flow.module.css";
import { PrimaryNav } from "../../components/primary-nav";
import { presentPodRelationship } from "../../lib/participant-pod-state";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";

export default async function ApplicationsPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string; pod?: string }>;
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
  const visibleRecords = query.pod
    ? records.filter(({ pod }) => pod.id === query.pod)
    : records;

  return (
    <main className={`app-shell ${styles.shell}`}>
      <header className={`app-topbar ${styles.topbar}`}>
        <Link className={`wordmark ${styles.wordmark}`} href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className={styles.routeLabel}>Applications</span>
      </header>
      <section className={styles.intro}>
        <p className={styles.routeLabel}>Your applications</p>
        <h1>{query.sent === "1" ? "Sent and ready to track." : "Know exactly what comes next."}</h1>
        <p className="screen-copy">Acceptance is one gate. Funding finality and roster lock still determine the final place.</p>
      </section>
      {visibleRecords.length > 0 ? (
        <section className={styles.statusList} aria-label="Application status">
          {visibleRecords.map(({ application, pod }) => {
            const membership = membershipByApplication.get(application.id);
            const presentation = presentPodRelationship({
              podId: pod.id,
              podState: pod.state as Exclude<PodState, "draft">,
              ...(pod.contractData?.settlementMode
                ? { settlementMode: pod.contractData.settlementMode }
                : {}),
              relationship: {
                kind: "member",
                state: membership?.state ?? application.state,
                depositIntentId: membership?.depositIntentId ?? null
              }
            });
            const name = pod.contractData?.activity.name ?? "Pod";
            return (
              <article className={`application-status-card ${styles.statusCard}`} key={application.id}>
                <div className={styles.statusMeta}>
                  <span className={styles.stateLabel}>{presentation.statusLabel}</span>
                  <time
                    className={styles.updatedAt}
                    dateTime={application.updatedAt.toISOString()}
                  >
                    Updated {application.updatedAt.toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC"
                    })}
                  </time>
                </div>
                <h2>{name}</h2>
                <p className={styles.statusDetail}>{presentation.statusDetail}</p>
                <Link
                  className={styles.primaryAction}
                  href={presentation.href}
                >
                  {presentation.actionLabel}
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <h2>No applications yet.</h2><p>Browse public activities and apply when the cadence fits.</p>
          <Link className={styles.primaryAction} href="/discover">Browse public Pods</Link>
        </section>
      )}
      {query.pod ? <Link className={styles.quietAction} href="/applications">View all applications</Link> : null}
      <PrimaryNav active="messages" />
    </main>
  );
}
