import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileAvatar } from "../../../../../components/profile-avatar";
import { formatZonedMoment } from "../../../../../lib/format-moment";
import { isUuidRouteParam } from "../../../../../lib/route-params";
import { podsRepository } from "../../../../../lib/server-db";
import { requireSession } from "../../../../../lib/session";

function reviewMoment(value: Date | null, timeZone: string) {
  return value
    ? formatZonedMoment(value, { timeZone, includeZone: true })
    : "Not available";
}

export default async function CreatorReviewQueuePage({
  params
}: {
  params: Promise<{ podId: string }>;
}) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/admin/reviews`);
  if (!isUuidRouteParam(podId)) notFound();

  const records = await podsRepository.listPendingReviewsForCreator({
    creatorUserId: session.userId,
    podId
  });
  if (!records) notFound();
  const pending = records.filter(
    ({ submission }) => submission.state === "reviewing"
  );

  return (
    <main className="app-shell admin-shell creator-review-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href={`/pods/${podId}/admin`}>
          <span className="pod-mark" aria-hidden="true" />pods
        </Link>
        <span className="phase-pill">Proof review</span>
      </header>
      <section className="creator-review-queue-hero entrance entrance-hero">
        <span className="creator-review-count">{pending.length}</span>
        <div>
          <p className="eyebrow">Proofs waiting</p>
          <h1>
            {pending.length === 1
              ? "One decision waiting."
              : `${pending.length} decisions waiting.`}
          </h1>
          <p>Compare the submitted work with its locked commitment.</p>
        </div>
      </section>

      {pending.length > 0 ? (
        <section className="review-queue creator-review-queue" aria-label="Pending proofs">
          {pending.map(({ submission, occurrence, participant, timeZone }) => (
            <Link
              aria-label={`Review ${participant.displayName} proof`}
              className="review-queue-row creator-review-queue-row"
              href={`/pods/${podId}/admin/reviews/${submission.id}`}
              key={submission.id}
            >
              <ProfileAvatar
                avatar={participant.avatar}
                displayName={participant.displayName}
                size="small"
              />
              <span className="creator-review-queue-copy">
                <strong>{participant.displayName}</strong>
                <small>@{participant.handle} · Occurrence {occurrence.ordinal}</small>
                <span>
                  Submitted {reviewMoment(submission.submittedAt, timeZone)}
                </span>
              </span>
              <span className="creator-review-row-action" aria-hidden="true">
                Review
              </span>
            </Link>
          ))}
        </section>
      ) : (
        <section className="neutral-empty creator-review-empty">
          <span>No proofs are waiting.</span>
          <p>New member proofs will appear here automatically.</p>
        </section>
      )}
    </main>
  );
}
