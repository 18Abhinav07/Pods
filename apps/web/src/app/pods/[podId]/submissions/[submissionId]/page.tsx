import { templateContracts } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "../../../../../components/activity-ritual/activity-ritual.module.css";
import { PodActionHeader } from "../../../../../components/activity-ritual/pod-action-header";
import { RitualIcon } from "../../../../../components/activity-ritual/ritual-icon";
import { ParticipantSubmissionStatus } from "../../../../../components/participant-submission-status";
import { ProofRecordSection } from "../../../../../components/proof-record-section";
import { ProofReviewThread } from "../../../../../components/proof-review-thread";
import {
  participantSubmissionStatusDto
} from "../../../../../lib/participant-submission-status";
import { proofReviewView } from "../../../../../lib/proof-review-view";
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
  const proofReview = contract.version === 3
    ? await podsRepository.getProofReviewForParticipant({
        userId: session.userId,
        podId,
        submissionId
      })
    : null;
  let recoveryMode: "linked" | "next_occurrence" | "unavailable" =
    contract.templateId === "build" || contract.templateId === "create"
      ? "unavailable"
      : "next_occurrence";
  if (
    proofReview?.proofCase.stage === "resolved" &&
    proofReview.proofCase.resolution === "rejected" &&
    (contract.templateId === "build" || contract.templateId === "create")
  ) {
    const now = await podsRepository.getEffectiveTime(new Date());
    const recoveryOccurrence = await podsRepository.findRecoveryOccurrence({
      userId: session.userId,
      podId,
      submissionId,
      now
    });
    recoveryMode = recoveryOccurrence ? "linked" : "unavailable";
  }
  const status = participantSubmissionStatusDto({
    submission,
    reviewDecision,
    creator,
    reviewerKind,
    proofCaseStage: proofReview?.proofCase.stage ?? null
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
        {proofReview ? (
          <ProofReviewThread
            endpoint={`/api/pods/${podId}/submissions/${submissionId}/review`}
            initial={proofReviewView(proofReview)}
            podId={podId}
            proofRecord={{
              artifact: evidence.artifact,
              evidenceImageEndpoint: submission.evidenceObjectKey
                ? `/api/pods/${podId}/submissions/${submission.id}/evidence`
                : null,
              evidenceRows: evidence.evidenceRows,
              frozenCriterion: evidence.frozenCriterion,
              templateName: evidence.templateName
            }}
            recoveryMode={recoveryMode}
            reviewerName={creator?.displayName ?? null}
            submissionId={submissionId}
            timeZone={contract.activity.timeZone}
          />
        ) : (
          <section
            aria-labelledby="submission-record-title"
            className={styles.proofRecord}
            data-submission-record
          >
            <ProofRecordSection
              artifact={evidence.artifact}
              evidenceImageEndpoint={submission.evidenceObjectKey
                ? `/api/pods/${podId}/submissions/${submission.id}/evidence`
                : null}
              evidenceRows={evidence.evidenceRows}
              frozenCriterion={evidence.frozenCriterion}
              headingId="submission-record-title"
              templateName={evidence.templateName}
            />
          </section>
        )}
        <Link className={styles.roomReturn} href={`/pods/${podId}/room`}>
          <RitualIcon name="room" size={20} />
          Return to Pod room
        </Link>
      </div>
    </main>
  );
}
