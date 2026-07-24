import Link from "next/link";
import { notFound } from "next/navigation";

import { ParticipantSubmissionStatus } from "../../../../../components/participant-submission-status";
import {
  participantSubmissionPresentation,
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
  const presentation = participantSubmissionPresentation(
    submission.state,
    reviewerKind
  );
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
  return (
    <main className="app-shell submission-detail-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className={`phase-pill is-${submission.state}`}>{presentation.heading}</span>
      </header>
      <ParticipantSubmissionStatus
        endpoint={`/api/pods/${podId}/submissions/${submissionId}`}
        initial={status}
        occurrenceOrdinal={occurrence.ordinal}
        podName={contract.activity.name}
        timeZone={contract.activity.timeZone}
      />
      <section className="submission-detail-card is-editorial-submission">
        <header><span>{evidence.templateName}</span><strong>Your submitted proof</strong></header>
        {evidence.frozenCriterion.map((row) => (
          <div key={`criterion-${row.label}`}><span>{row.label}</span><strong>{row.value}</strong></div>
        ))}
        {evidence.evidenceRows.map((row) => (
          <div key={`evidence-${row.label}`}><span>{row.label}</span><p>{row.value}</p></div>
        ))}
        {evidence.artifact ? (
          <a className="submission-artifact-link" href={evidence.artifact.href} rel="noreferrer" target="_blank">
            {evidence.artifact.label} <span aria-hidden="true">↗</span>
          </a>
        ) : null}
        {submission.evidenceObjectKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Your optional evidence" src={`/api/pods/${podId}/submissions/${submission.id}/evidence`} />
        ) : null}
      </section>
      <Link className="primary-action full-action" href={`/pods/${podId}/room`}>Return to Pod room</Link>
    </main>
  );
}
