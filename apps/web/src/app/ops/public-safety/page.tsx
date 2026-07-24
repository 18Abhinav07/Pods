import Link from "next/link";

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
    <main className="app-shell ops-shell public-safety-shell">
      <header className="app-topbar">
        <Link className="wordmark" href="/ops/public-safety">
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
        <nav aria-label="Operations">
          <Link aria-current="page" href="/ops/public-safety">Public safety</Link>
          <Link href="/ops/transfers">Transfers</Link>
        </nav>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Public visitor operations</p>
        <h1>{reports.length} waiting.</h1>
        <p className="screen-copy">Public suppression is reversible and separately audited. It never changes Pod membership, evidence decisions, deposits, refunds, or payouts.</p>
      </section>
      {reports.length > 0 ? (
        <section className="public-safety-queue" aria-label="Pending public reports">
          {reports.map((report) => (
            <article key={report.id}>
              <header>
                <span>{report.targetKind.replaceAll("_", " ")}</span>
                <time dateTime={report.createdAt.toISOString()}>
                  {formatZonedMoment(report.createdAt, { timeZone: "UTC", includeZone: true })}
                </time>
              </header>
              <h2>{report.reason.replaceAll("_", " ")}</h2>
              <p>{report.details}</p>
              <dl>
                <div><dt>Pod</dt><dd>{report.podId}</dd></div>
                <div><dt>Target</dt><dd>{report.targetId}</dd></div>
              </dl>
              <PublicModerationControls reportId={report.id} />
            </article>
          ))}
        </section>
      ) : (
        <section className="neutral-empty">
          <span>Queue clear</span>
          <p>No public visitor reports require an operation.</p>
        </section>
      )}
      <section className="public-moderation-history">
        <div className="section-title-row">
          <div><span>Append-only audit</span><h2>Recent operations</h2></div>
        </div>
        {actions.length > 0 ? actions.map((action) => (
          <article key={action.id}>
            <strong>{action.action.replaceAll("_", " ")}</strong>
            <span>{action.reason}</span>
            <small>{action.actor} · {formatZonedMoment(action.createdAt, { timeZone: "UTC", includeZone: true })}</small>
          </article>
        )) : <p>No public moderation actions have been recorded.</p>}
      </section>
    </main>
  );
}
