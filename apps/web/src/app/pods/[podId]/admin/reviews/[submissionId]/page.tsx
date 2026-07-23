import type { BuildDeliverableType, SubmissionState } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CreatorReviewForm } from "../../../../../../components/creator-review-form";
import { CreatorReviewEvidence } from "../../../../../../components/creator-review-evidence";
import { ProfileAvatar } from "../../../../../../components/profile-avatar";
import { formatZonedMoment } from "../../../../../../lib/format-moment";
import { isUuidRouteParam } from "../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../lib/server-db";
import { requireSession } from "../../../../../../lib/session";

function deliverableLabel(value: BuildDeliverableType) {
  const labels: Record<BuildDeliverableType, string> = {
    pull_request: "GitHub pull request",
    commit: "GitHub commit",
    issue: "GitHub issue",
    live_artifact: "Live artifact"
  };
  return labels[value];
}

function submissionStatusLabel(value: SubmissionState) {
  const labels: Record<SubmissionState, string> = {
    draft: "Draft",
    reviewing: "Under review",
    approved: "Approved",
    rejected: "Not verified",
    timeout_protected: "Protected after review timeout"
  };
  return labels[value];
}

export default async function CreatorReviewWorkspacePage({
  params
}: {
  params: Promise<{ podId: string; submissionId: string }>;
}) {
  const { podId, submissionId } = await params;
  const session = await requireSession(
    `/pods/${podId}/admin/reviews/${submissionId}`
  );
  if (!isUuidRouteParam(podId) || !isUuidRouteParam(submissionId)) notFound();

  const result = await podsRepository.getReviewSubmissionForCreator({
    creatorUserId: session.userId,
    podId,
    submissionId
  });
  if (!result) notFound();

  const { submission, commitment, occurrence, pod, participant } = result;
  const contract = pod.contractData;
  if (!contract) notFound();
  const timeZone = contract.activity.timeZone;
  const moment = (value: Date | null) => value
    ? formatZonedMoment(value, {
        timeZone,
        includeYear: true,
        includeZone: true
      })
    : "Not available";
  const terminal = submission.state !== "reviewing";

  return (
    <main className="app-shell admin-shell creator-review-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href={`/pods/${podId}/admin/reviews`}>
          <span className="pod-mark" aria-hidden="true" />pods
        </Link>
        <span className="phase-pill">Proof review</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Occurrence {occurrence.ordinal}</p>
        <h1>{contract.activity.name}</h1>
        <div className="creator-review-participant">
          <ProfileAvatar
            avatar={participant.avatar}
            displayName={participant.displayName}
            size="small"
          />
          <span>
            <strong>{participant.displayName}</strong>
            <small>@{participant.handle}</small>
          </span>
        </div>
      </section>

      <section className="review-contract-card">
        <div>
          <span>Locked task</span>
          <strong>{commitment.task}</strong>
        </div>
        <div>
          <span>Deliverable type</span>
          <strong>{deliverableLabel(commitment.deliverableType)}</strong>
        </div>
        <div>
          <span>Result summary</span>
          <p>{submission.resultSummary}</p>
        </div>
        <a
          className="submission-artifact-link"
          href={submission.artifactUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open public artifact <span aria-hidden="true">↗</span>
        </a>
      </section>

      {submission.evidenceObjectKey ? (
        <section className="review-evidence-card">
          <span>Creator-only evidence</span>
          <CreatorReviewEvidence
            podId={podId}
            submissionId={submissionId}
          />
        </section>
      ) : null}

      <section className="review-timing-card" aria-label="Review timing">
        <div><span>Submitted</span><strong>{moment(submission.submittedAt)}</strong></div>
        <div><span>Review target</span><strong>{moment(submission.reviewTargetAt)}</strong></div>
        <div><span>Hard deadline</span><strong>{moment(submission.reviewHardDeadlineAt)}</strong></div>
      </section>

      {terminal ? (
        <section className="creator-review-recorded">
          <span>Decision recorded</span>
          <strong>{submissionStatusLabel(submission.state)}</strong>
          <p>This proof already has one final result.</p>
        </section>
      ) : (
        <CreatorReviewForm podId={podId} submissionId={submissionId} />
      )}
    </main>
  );
}
