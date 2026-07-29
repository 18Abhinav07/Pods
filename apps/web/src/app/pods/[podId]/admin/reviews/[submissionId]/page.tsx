import type { SubmissionState } from "@pods/domain";
import { templateContracts } from "@pods/domain";
import { notFound } from "next/navigation";

import styles from "../../../../../../components/activity-ritual/activity-ritual.module.css";
import { ArtifactLinkCard } from "../../../../../../components/artifact-link-card";
import { PodActionHeader } from "../../../../../../components/activity-ritual/pod-action-header";
import { CreatorReviewForm } from "../../../../../../components/creator-review-form";
import { CreatorProofReviewLifecycle } from "../../../../../../components/creator-proof-review-lifecycle";
import { CreatorReviewEvidence } from "../../../../../../components/creator-review-evidence";
import { ProfileAvatar } from "../../../../../../components/profile-avatar";
import { formatZonedMoment } from "../../../../../../lib/format-moment";
import { isUuidRouteParam } from "../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../lib/server-db";
import { proofReviewView } from "../../../../../../lib/proof-review-view";
import { requireSession } from "../../../../../../lib/session";
import { presentTemplateEvidence } from "../../../../../../lib/template-evidence-presentation";

function submissionStatusLabel(value: SubmissionState) {
  const labels: Record<SubmissionState, string> = {
    draft: "Draft",
    reviewing: "Under review",
    approved: "Approved",
    rejected: "Not verified",
    timeout_protected: "Protected after review timeout",
    grace: "Principal returned with grace"
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
  const proofReview = contract.version === 3
    ? await podsRepository.getProofReviewForCreator({
        creatorUserId: session.userId,
        podId,
        submissionId
      })
    : null;
  if (contract.version === 3 && !proofReview) notFound();
  const timeZone = contract.activity.timeZone;
  const moment = (value: Date | null) => value
    ? formatZonedMoment(value, {
        timeZone,
        includeYear: true,
        includeZone: true
      })
    : "Not available";
  const terminal = proofReview
    ? proofReview.proofCase.stage === "resolved"
    : submission.state !== "reviewing";
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
  const templateLabel =
    templateContracts.find((template) => template.id === contract.templateId)
      ?.name ?? "Activity";

  return (
    <main className={styles.ritualShell}>
      <PodActionHeader
        occurrenceNumber={occurrence.ordinal}
        podId={podId}
        podName={contract.activity.name}
        templateLabel={templateLabel}
      />
      <div className={styles.reviewScroll}>
        <section
          className={styles.reviewParticipant}
          data-review-participant
        >
          <ProfileAvatar
            avatar={participant.avatar}
            displayName={participant.displayName}
            size="small"
          />
          <span>
            <strong>{participant.displayName}</strong>
            <small>@{participant.handle}</small>
          </span>
        </section>

        {!proofReview ? (
          <section
            className={styles.reviewWorkspace}
            data-review-workspace
          >
            <section className={styles.reviewSection}>
              <header>
                <span>{evidence.templateName} · Frozen Pod rule</span>
                <h1>Locked commitment</h1>
              </header>
              <div className={styles.reviewRows}>
                {evidence.frozenCriterion.map((item) => (
                  <div key={`criterion-${item.label}`}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.reviewSection}>
              <header>
                <span>Participant result</span>
                <h2>Submitted proof</h2>
              </header>
              <div className={styles.reviewRows}>
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
                <ArtifactLinkCard
                  artifactAction
                  context="Public artifact"
                  href={evidence.artifact.href}
                  label={evidence.artifact.label}
                />
              ) : null}
            </section>

            {submission.evidenceObjectKey ? (
              <figure className={styles.reviewEvidenceFigure}>
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
        ) : null}

        {!proofReview ? (
          <details className={styles.reviewHistory}>
            <summary>
              <span>Review timing</span>
              <strong>3 checkpoints</strong>
            </summary>
            <section className={styles.reviewTimeline} aria-label="Review timing">
              <div><span>Submitted</span><strong>{moment(submission.submittedAt)}</strong></div>
              <div><span>Review target</span><strong>{moment(submission.reviewTargetAt)}</strong></div>
              <div><span>Hard deadline</span><strong>{moment(submission.reviewHardDeadlineAt)}</strong></div>
            </section>
          </details>
        ) : null}

        {proofReview ? (
          <CreatorProofReviewLifecycle
            endpoint={`/api/pods/${podId}/admin/reviews/${submissionId}/decision`}
            initial={proofReviewView(proofReview)}
            proofRecord={{
              artifact: evidence.artifact,
              evidenceImageEndpoint: submission.evidenceObjectKey
                ? `/api/pods/${podId}/admin/reviews/${submissionId}/evidence`
                : null,
              evidenceRows: evidence.evidenceRows,
              frozenCriterion: evidence.frozenCriterion,
              templateName: evidence.templateName
            }}
            timeZone={timeZone}
            versionsEndpoint={`/api/pods/${podId}/submissions/${submissionId}/review`}
          />
        ) : terminal ? (
          <section className={styles.recordedDecision}>
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
      </div>
    </main>
  );
}
