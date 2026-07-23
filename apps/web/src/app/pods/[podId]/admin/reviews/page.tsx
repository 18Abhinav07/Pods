import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileAvatar } from "../../../../../components/profile-avatar";
import { formatZonedMoment } from "../../../../../lib/format-moment";
import { isUuidRouteParam } from "../../../../../lib/route-params";
import { podsRepository } from "../../../../../lib/server-db";
import { requireSession } from "../../../../../lib/session";

function reviewMoment(value: Date | null) {
  return value
    ? formatZonedMoment(value, { timeZone: "UTC" })
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
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Proofs waiting</p>
        <h1>{pending.length} proof{pending.length === 1 ? "" : "s"} to review.</h1>
        <p className="screen-copy">
          Compare each result with the member&apos;s locked commitment.
        </p>
      </section>

      {pending.length > 0 ? (
        <section className="review-queue creator-review-queue" aria-label="Pending proofs">
          {pending.map(({ submission, occurrence, participant }) => (
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
                <small>Occurrence {occurrence.ordinal}</small>
                <strong>{participant.displayName}</strong>
                <em>@{participant.handle}</em>
                <span>Submitted {reviewMoment(submission.submittedAt)}</span>
              </span>
              <time dateTime={submission.reviewTargetAt?.toISOString()}>
                Target {reviewMoment(submission.reviewTargetAt)}
              </time>
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
