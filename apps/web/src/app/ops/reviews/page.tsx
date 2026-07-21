import Link from "next/link";

import { requireOpsSession } from "../../../lib/ops-session";
import { podsRepository } from "../../../lib/server-db";

function moment(value: Date | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}

export default async function ReviewQueuePage() {
  await requireOpsSession("/ops/reviews");
  const queue = await podsRepository.listPendingReviews();
  return (
    <main className="app-shell ops-shell">
      <header className="app-topbar">
        <Link className="wordmark" href="/ops/reviews"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="phase-pill">Reviewer queue</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Centralized verification</p>
        <h1>{queue.length} waiting.</h1>
        <p className="screen-copy">Review the frozen task against the public artifact. This is human judgment, not cryptographic proof.</p>
      </section>
      {queue.length > 0 ? (
        <section className="review-queue" aria-label="Pending evidence reviews">
          {queue.map(({ submission, commitment, occurrence, pod }, index) => (
            <Link className="review-queue-row" href={`/ops/reviews/${submission.id}`} key={submission.id}>
              <span className="review-queue-index">{String(index + 1).padStart(2, "0")}</span>
              <span><small>{pod.contractData?.activity.name ?? "Build and Ship"}</small><strong>{commitment.task}</strong><em>Occurrence {occurrence.ordinal}</em></span>
              <time dateTime={submission.reviewTargetAt?.toISOString()}>{moment(submission.reviewTargetAt)}</time>
            </Link>
          ))}
        </section>
      ) : (
        <section className="neutral-empty"><span>Queue clear</span><p>No Build and Ship submissions are waiting for a first decision.</p></section>
      )}
    </main>
  );
}
