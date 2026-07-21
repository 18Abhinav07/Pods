import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewApprovalForm } from "../../../../components/review-approval-form";
import { requireOpsSession } from "../../../../lib/ops-session";
import { podsRepository } from "../../../../lib/server-db";

export default async function ReviewWorkspacePage({
  params
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  await requireOpsSession(`/ops/reviews/${submissionId}`);
  const result = await podsRepository.getReviewSubmission(submissionId);
  if (!result) notFound();
  const { submission, commitment, occurrence, pod } = result;
  return (
    <main className="app-shell ops-shell review-workspace">
      <header className="app-topbar">
        <Link className="wordmark" href="/ops/reviews"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="phase-pill">Occurrence {occurrence.ordinal}</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">{pod.contractData?.activity.name}</p>
        <h1>Review visible work.</h1>
        <p className="screen-copy">Compare the locked commitment with the result and public artifact.</p>
      </section>
      <section className="review-contract-card">
        <div><span>Frozen project theme</span><strong>{String(pod.contractData?.activity.config.projectTheme ?? "")}</strong></div>
        <div><span>Locked task</span><strong>{commitment.task}</strong></div>
        <div><span>Deliverable</span><strong>{commitment.deliverableType.replaceAll("_", " ")}</strong></div>
      </section>
      <section className="review-evidence-card">
        <span>Participant result</span>
        <p>{submission.resultSummary}</p>
        <a className="secondary-action full-action" href={submission.artifactUrl} rel="noreferrer" target="_blank">Open public artifact</a>
        {submission.evidenceObjectKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Optional participant evidence" src={`/api/ops/reviews/${submission.id}/evidence`} />
        ) : <small>No optional image was included.</small>}
      </section>
      {submission.state === "reviewing" ? (
        <ReviewApprovalForm submissionId={submission.id} />
      ) : (
        <section className="pod-relationship-banner is-success"><strong>Decision recorded</strong><p>This occurrence is {submission.state} and cannot be decided again.</p></section>
      )}
    </main>
  );
}
