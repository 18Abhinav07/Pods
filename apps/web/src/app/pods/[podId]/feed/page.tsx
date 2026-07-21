import Link from "next/link";
import { notFound } from "next/navigation";

import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";

export default async function PodFeedPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/feed`);
  const feed = await podsRepository.listApprovedFeedForPod({ userId: session.userId, podId });
  if (!feed) notFound();
  return (
    <main className="app-shell pod-feed-shell">
      <header className="app-topbar"><Link className="wordmark" href={`/pods/${podId}/today`}><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><span className="phase-pill">Pod feed</span></header>
      <section className="today-hero"><p className="eyebrow">Approved progress</p><h1>Work the group can trust.</h1><p className="screen-copy">Only sanitized achievement summaries appear here. Raw evidence and wallet data stay private.</p></section>
      {feed.length > 0 ? (
        <section className="achievement-feed">
          {feed.map(({ submission, commitment, occurrence }) => (
            <article className="achievement-card" key={submission.id}>
              <span>Occurrence {occurrence.ordinal} · manually approved</span>
              <h2>{commitment.task}</h2>
              <p>{submission.resultSummary}</p>
              <a href={submission.artifactUrl} rel="noreferrer" target="_blank">View public artifact</a>
            </article>
          ))}
        </section>
      ) : <section className="neutral-empty"><span>No approved work yet</span><p>Achievements appear after Pods team review.</p></section>}
    </main>
  );
}
