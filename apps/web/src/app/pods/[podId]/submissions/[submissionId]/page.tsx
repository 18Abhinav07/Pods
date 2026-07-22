import Link from "next/link";
import { notFound } from "next/navigation";

import { podsRepository } from "../../../../../lib/server-db";
import { requireSession } from "../../../../../lib/session";

function moment(value: Date | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}

export default async function ParticipantSubmissionPage({
  params
}: {
  params: Promise<{ podId: string; submissionId: string }>;
}) {
  const { podId, submissionId } = await params;
  const session = await requireSession(`/pods/${podId}/submissions/${submissionId}`);
  const result = await podsRepository.getSubmissionForOwner({
    userId: session.userId,
    submissionId
  });
  if (!result || result.pod.id !== podId) notFound();
  const { submission, commitment, occurrence, pod } = result;
  return (
    <main className="app-shell submission-detail-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className={`phase-pill is-${submission.state}`}>{submission.state}</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Occurrence {occurrence.ordinal}</p>
        <h1>{submission.state === "approved" ? "Work approved." : "Review in progress."}</h1>
        <p className="screen-copy">{pod.contractData?.activity.name}</p>
      </section>
      <section className="submission-detail-card">
        <div><span>Locked task</span><strong>{commitment.task}</strong></div>
        <div><span>Result</span><p>{submission.resultSummary}</p></div>
        <a className="secondary-action full-action" href={submission.artifactUrl} rel="noreferrer" target="_blank">Open public artifact</a>
        {submission.evidenceObjectKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Your optional evidence" src={`/api/pods/${podId}/submissions/${submission.id}/evidence`} />
        ) : null}
      </section>
      <section className="review-timing-card">
        <div><span>Submitted</span><strong>{moment(submission.submittedAt)}</strong></div>
        <div><span>Review target</span><strong>{moment(submission.reviewTargetAt)}</strong></div>
        <div><span>Hard protection time</span><strong>{moment(submission.reviewHardDeadlineAt)}</strong></div>
      </section>
      <aside className={`pod-relationship-banner is-${submission.state === "approved" ? "success" : "pending"}`}>
        <strong>{submission.state === "approved" ? "Bonus-eligible occurrence" : "Principal remains protected while review is open"}</strong>
        <p>{submission.state === "approved" ? "A Pods reviewer manually approved the evidence against your frozen task." : "The 12-hour response time is a target. The exact hard deadline remains visible above."}</p>
      </aside>
      <Link className="primary-action full-action" href={`/pods/${podId}/today`}>Return to Pod room</Link>
    </main>
  );
}
