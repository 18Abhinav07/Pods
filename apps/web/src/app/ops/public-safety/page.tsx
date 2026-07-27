import Link from "next/link";

import styles from "../../../components/ops-flow.module.css";
import { PublicModerationControls } from "../../../components/public-moderation-controls";
import { formatZonedMoment } from "../../../lib/format-moment";
import { requireOpsSession } from "../../../lib/ops-session";
import { podsRepository } from "../../../lib/server-db";

export default async function PublicSafetyPage() {
  await requireOpsSession("/ops/public-safety");
  const [reports, actions] = await Promise.all([
    podsRepository.listPublicSafetyReports({ state: "pending" }),
    podsRepository.listPublicModerationActions({ limit: 50 })
  ]);

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link
          className={`wordmark ${styles.wordmark}`}
          href="/ops/public-safety"
        >
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
        <nav aria-label="Operations" className={styles.opsNav}>
          <Link aria-current="page" href="/ops/public-safety">Public safety</Link>
          <Link href="/ops/transfers">Transfers</Link>
        </nav>
      </header>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Public visitor operations</p>
        <h1>{reports.length} waiting.</h1>
        <p className={styles.heroCopy}>
          Public suppression is reversible and separately audited. It never
          changes Pod membership, evidence decisions, deposits, refunds, or
          payouts.
        </p>
      </section>
      {reports.length > 0 ? (
        <section
          aria-label="Pending public reports"
          className={styles.queueLayout}
        >
          {reports.map((report) => (
            <article className={styles.queueCard} key={report.id}>
              <header className={styles.cardHeader}>
                <span
                  className={styles.stateBadge}
                  data-state={report.state}
                >
                  {report.targetKind.replaceAll("_", " ")} report
                </span>
                <time
                  className={styles.cardTime}
                  dateTime={report.createdAt.toISOString()}
                >
                  {formatZonedMoment(report.createdAt, { timeZone: "UTC", includeZone: true })}
                </time>
              </header>
              <div className={styles.cardLead}>
                <h2>{report.reason.replaceAll("_", " ")}</h2>
                <p>{report.details}</p>
              </div>
              <dl className={styles.detailList}>
                <div><dt>Pod ID</dt><dd>{report.podId}</dd></div>
                <div><dt>Target ID</dt><dd>{report.targetId}</dd></div>
              </dl>
              <PublicModerationControls reportId={report.id} />
            </article>
          ))}
        </section>
      ) : (
        <section className={styles.emptyCard}>
          <strong>Queue clear</strong>
          <p>No public visitor reports require an operation.</p>
        </section>
      )}
      <section>
        <div className={styles.sectionHeading}>
          <span>Append-only audit</span>
          <h2>Recent operations</h2>
        </div>
        {actions.length > 0 ? (
          <div className={styles.historyList}>
            {actions.map((action) => (
              <article className={styles.historyCard} key={action.id}>
                <strong>{action.action.replaceAll("_", " ")}</strong>
                <span>{action.reason}</span>
                <small>
                  {action.actor} ·{" "}
                  {formatZonedMoment(action.createdAt, {
                    timeZone: "UTC",
                    includeZone: true
                  })}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <section className={styles.emptyCard}>
            <strong>No recorded actions</strong>
            <p>Completed public visibility operations will appear here.</p>
          </section>
        )}
      </section>
    </main>
  );
}
