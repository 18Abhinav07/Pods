import { templateContracts } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "../../../../../components/activity-ritual/activity-ritual.module.css";
import { PodActionHeader } from "../../../../../components/activity-ritual/pod-action-header";
import { RitualIcon } from "../../../../../components/activity-ritual/ritual-icon";
import { ParticipantSubmissionStatus } from "../../../../../components/participant-submission-status";
import {
  participantSubmissionStatusDto
} from "../../../../../lib/participant-submission-status";
import { podsRepository } from "../../../../../lib/server-db";
import { requireSession } from "../../../../../lib/session";
import { presentTemplateEvidence } from "../../../../../lib/template-evidence-presentation";

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
  const contract = pod.contractData;
  if (!contract) notFound();
  const verifierAuthority =
    await podsRepository.getVerifierAuthorityForPod(pod.id);
  const reviewerKind =
    verifierAuthority?.effectiveVerifier ??
    contract.verification.verifier;
  const creatorProfile = reviewerKind === "creator"
    ? await podsRepository.getProfileForUser(pod.creatorUserId)
    : null;
  const creator = creatorProfile
    ? {
        handle: creatorProfile.handle,
        displayName: creatorProfile.displayName,
        avatar: creatorProfile.avatar
      }
    : null;
  const status = participantSubmissionStatusDto({
    submission,
    reviewDecision,
    creator,
    reviewerKind
  });
  const evidence = presentTemplateEvidence({
    templateId: contract.templateId,
    frozenConfig: contract.activity.config,
    commitment,
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
      <div className={styles.submissionDetail} data-submission-detail>
        <ParticipantSubmissionStatus
          endpoint={`/api/pods/${podId}/submissions/${submissionId}`}
          initial={status}
          occurrenceOrdinal={occurrence.ordinal}
          podName={contract.activity.name}
          timeZone={contract.activity.timeZone}
        />
        <section
          aria-labelledby="submission-record-title"
          className={styles.proofRecord}
          data-submission-record
        >
          <header className={styles.proofRecordHeader}>
            <span>{evidence.templateName}</span>
            <h2 id="submission-record-title">Proof record</h2>
          </header>
          <section className={styles.recordGroup}>
            <header>
              <span>Locked commitment</span>
              <strong>What you promised</strong>
            </header>
            {evidence.frozenCriterion.map((row) => (
              <div key={`criterion-${row.label}`}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </section>
          <section className={styles.recordGroup}>
            <header>
              <span>Completed work</span>
              <strong>What you submitted</strong>
            </header>
            {evidence.evidenceRows.map((row) => (
              <div key={`evidence-${row.label}`}>
                <span>{row.label}</span>
                <p>{row.value}</p>
              </div>
            ))}
          </section>
          {evidence.artifact ? (
            <a
              aria-label={evidence.artifact.label}
              className={styles.artifactAction}
              data-artifact-action
              href={evidence.artifact.href}
              rel="noreferrer"
              target="_blank"
            >
              <span>
                <small>Public artifact</small>
                <strong>{evidence.artifact.label}</strong>
              </span>
              <RitualIcon name="external" size={19} />
            </a>
          ) : null}
          {submission.evidenceObjectKey ? (
            <figure className={styles.evidenceFigure}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Your optional evidence" src={`/api/pods/${podId}/submissions/${submission.id}/evidence`} />
              <figcaption>Evidence shared with your reviewer</figcaption>
            </figure>
          ) : null}
        </section>
        <Link className={styles.roomReturn} href={`/pods/${podId}/room`}>
          <RitualIcon name="room" size={20} />
          Return to Pod room
        </Link>
      </div>
    </main>
  );
}
