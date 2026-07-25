import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "../../../../../components/activity-ritual/activity-ritual.module.css";
import { RitualIcon } from "../../../../../components/activity-ritual/ritual-icon";
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
    <main className={styles.ritualShell}>
      <header className={styles.reviewQueueHeader}>
        <Link
          aria-label="Back to creator controls"
          className={styles.iconAction}
          href={`/pods/${podId}/admin`}
        >
          <RitualIcon name="back" size={22} />
        </Link>
        <div>
          <h1>Proof review</h1>
          <p>Creator workspace</p>
        </div>
        <span aria-hidden="true" />
      </header>
      <div className={styles.reviewScroll}>
        <section className={styles.reviewQueueHero}>
          <span>{pending.length}</span>
          <div>
            <p>Proofs waiting</p>
            <h2>
              {pending.length === 1
                ? "One decision waiting."
                : `${pending.length} decisions waiting.`}
            </h2>
            <small>Compare each result with its locked commitment.</small>
          </div>
        </section>

        {pending.length > 0 ? (
          <section className={styles.reviewQueue} aria-label="Pending proofs">
            {pending.map(({ submission, occurrence, participant, timeZone }) => (
              <Link
                aria-label={`Review ${participant.displayName} proof`}
                href={`/pods/${podId}/admin/reviews/${submission.id}`}
                key={submission.id}
              >
                <ProfileAvatar
                  avatar={participant.avatar}
                  displayName={participant.displayName}
                  size="small"
                />
                <span>
                  <strong>{participant.displayName}</strong>
                  <small>@{participant.handle} · Occurrence {occurrence.ordinal}</small>
                  <span>
                    Submitted {reviewMoment(submission.submittedAt, timeZone)}
                  </span>
                </span>
                <span className={styles.reviewRowAction}>
                  Review
                  <RitualIcon name="forward" size={17} />
                </span>
              </Link>
            ))}
          </section>
        ) : (
          <section className={styles.reviewEmpty}>
            <span>No proofs are waiting.</span>
            <p>New member proofs will appear here automatically.</p>
          </section>
        )}
      </div>
    </main>
  );
}
