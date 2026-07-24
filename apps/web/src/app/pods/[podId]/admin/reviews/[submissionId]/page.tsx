import type { SubmissionState } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CreatorReviewForm } from "../../../../../../components/creator-review-form";
import { CreatorReviewEvidence } from "../../../../../../components/creator-review-evidence";
import { ProfileAvatar } from "../../../../../../components/profile-avatar";
import { formatZonedMoment } from "../../../../../../lib/format-moment";
import { isUuidRouteParam } from "../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../lib/server-db";
import { requireSession } from "../../../../../../lib/session";
import { presentTemplateEvidence } from "../../../../../../lib/template-evidence-presentation";

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

  const {
    submission,
    commitment,
    occurrence,
    pod,
    participant,
    reviewDecision
  } = result;
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
  const evidence = presentTemplateEvidence({
    templateId: contract.templateId,
    frozenConfig: contract.activity.config,
    commitment: {
      task: commitment.task,
      deliverableType: commitment.deliverableType
    },
    templateEvidence: submission.templateEvidence,
    legacySubmission: {
      resultSummary: submission.resultSummary,
      artifactUrl: submission.artifactUrl
    }
  });

  return (
    <main className="app-shell admin-shell creator-review-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href={`/pods/${podId}/admin/reviews`}>
          <span className="pod-mark" aria-hidden="true" />pods
        </Link>
        <span className="phase-pill">Proof review</span>
      </header>
      <section className="creator-review-hero entrance entrance-hero">
        <div>
          <p className="eyebrow">Occurrence {occurrence.ordinal}</p>
          <h1>{contract.activity.name}</h1>
        </div>
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

      <section className="creator-review-workspace">
        <section className="review-workspace-section">
          <header>
            <span>{evidence.templateName} · Frozen Pod rule</span>
            <h2>Locked commitment</h2>
          </header>
          <div className="review-workspace-rows">
            {evidence.frozenCriterion.map((item) => (
              <div key={`criterion-${item.label}`}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="review-workspace-section">
          <header>
            <span>Participant report</span>
            <h2>Submitted proof</h2>
          </header>
          <div className="review-workspace-rows">
            {evidence.evidenceRows.map((item) => (
              <div key={`evidence-${item.label}`}>
                <span>{item.label}</span>
                <p>{item.value}</p>
              </div>
            ))}
            <div>
              <span>Image evidence</span>
              <strong>
                {submission.evidenceObjectKey
                  ? "Attached for creator review"
                  : evidence.imageRequired
                    ? "Required image unavailable"
                    : "Optional for this activity"}
              </strong>
            </div>
          </div>
          {evidence.artifact ? (
            <a
              aria-label={evidence.artifact.label}
              className="artifact-action submission-artifact-link"
              href={evidence.artifact.href}
              rel="noreferrer"
              target="_blank"
            >
              <span>
                <small>Public link</small>
                <strong>{evidence.artifact.label}</strong>
              </span>
              <i aria-hidden="true">↗</i>
            </a>
          ) : null}
        </section>

        {submission.evidenceObjectKey ? (
          <figure className="review-evidence-figure">
            <figcaption>
              <span>Creator-only evidence</span>
              <small>Private to this decision</small>
            </figcaption>
            <CreatorReviewEvidence
              podId={podId}
              submissionId={submissionId}
            />
          </figure>
        ) : null}
      </section>

      <details className="review-timing-disclosure">
        <summary>
          <span>Review timing</span>
          <strong>3 checkpoints</strong>
        </summary>
        <section className="review-timing-card" aria-label="Review timing">
          <div><span>Submitted</span><strong>{moment(submission.submittedAt)}</strong></div>
          <div><span>Review target</span><strong>{moment(submission.reviewTargetAt)}</strong></div>
          <div><span>Hard deadline</span><strong>{moment(submission.reviewHardDeadlineAt)}</strong></div>
        </section>
      </details>

      {terminal ? (
        <section className="creator-review-recorded">
          <span>Decision recorded</span>
          <strong>{submissionStatusLabel(submission.state)}</strong>
          <p>This proof already has one final result.</p>
          {reviewDecision?.note ? (
            <aside>
              <strong>Private decision note</strong>
              <p>{reviewDecision.note}</p>
            </aside>
          ) : null}
        </section>
      ) : (
        <CreatorReviewForm podId={podId} submissionId={submissionId} />
      )}
    </main>
  );
}
