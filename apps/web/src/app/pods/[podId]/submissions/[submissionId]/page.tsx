import Link from "next/link";
import { notFound } from "next/navigation";

import { podsRepository } from "../../../../../lib/server-db";
import { requireSession } from "../../../../../lib/session";

function submissionPresentation(state: string) {
  if (state === "approved") {
    return {
      heading: "Work approved",
      detail: "The Pod creator approved this proof. It counts toward your progress and streak."
    };
  }
  if (state === "rejected") {
    return {
      heading: "Not verified",
      detail: "The Pod creator did not verify this proof against the locked commitment."
    };
  }
  if (state === "timeout_protected") {
    return {
      heading: "Protected after review timeout",
      detail: "The creator did not decide within 24 hours. This occurrence counts toward your progress and streak."
    };
  }
  return {
    heading: "Creator review in progress",
    detail: "The Pod creator is checking your proof against the locked commitment."
  };
}

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
  const { submission, commitment, occurrence, pod, reviewDecision } = result;
  const presentation = submissionPresentation(submission.state);
  const successful = submission.state === "approved" ||
    submission.state === "timeout_protected";
  return (
    <main className="app-shell submission-detail-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className={`phase-pill is-${submission.state}`}>{presentation.heading}</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Occurrence {occurrence.ordinal}</p>
        <h1>{presentation.heading}</h1>
        <p className="screen-copy">{pod.contractData?.activity.name}</p>
      </section>
      <section className="submission-detail-card is-editorial-submission">
        <div><span>Locked task</span><strong>{commitment.task}</strong></div>
        <div><span>Result</span><p>{submission.resultSummary}</p></div>
        <a className="submission-artifact-link" href={submission.artifactUrl} rel="noreferrer" target="_blank">Open public artifact <span aria-hidden="true">↗</span></a>
        {submission.evidenceObjectKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Your optional evidence" src={`/api/pods/${podId}/submissions/${submission.id}/evidence`} />
        ) : null}
      </section>
      <section className="review-timing-card is-review-timeline" aria-label="Review timeline">
        <div><span>Submitted</span><strong>{moment(submission.submittedAt)}</strong></div>
        <div><span>Review target</span><strong>{moment(submission.reviewTargetAt)}</strong></div>
        <div><span>Hard protection time</span><strong>{moment(submission.reviewHardDeadlineAt)}</strong></div>
      </section>
      <aside className={`pod-relationship-banner submission-protection-note is-${successful ? "success" : submission.state === "rejected" ? "attention" : "pending"}`}>
        <strong>{submission.state === "reviewing" ? "Principal remains protected while review is open" : presentation.heading}</strong>
        <p>{presentation.detail}</p>
      </aside>
      {reviewDecision?.note ? (
        <aside className="pod-relationship-banner submission-private-decision-note">
          <strong>Private decision note</strong>
          <p>{reviewDecision.note}</p>
        </aside>
      ) : null}
      <Link className="primary-action full-action" href={`/pods/${podId}/room`}>Return to Pod room</Link>
    </main>
  );
}
