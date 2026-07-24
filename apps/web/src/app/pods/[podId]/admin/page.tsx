import Link from "next/link";
import type { PodState } from "@pods/domain";

import { CancelPodControl } from "../../../../components/cancel-pod-control";
import { InvitationManager } from "../../../../components/invitation-manager";
import { presentCreatorPodState } from "../../../../lib/creator-pod-state";
import { requireEnrollmentOwner } from "../../../../lib/enrollment-guards";
import { podsRepository } from "../../../../lib/server-db";

export default async function PodAdminPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const { session, pod } = await requireEnrollmentOwner(podId, `/pods/${podId}/admin`);
  const contract = pod.contractData;
  if (!contract) return null;
  const verifierAuthority = await podsRepository.getVerifierAuthorityForPod(pod.id);
  const effectiveVerifier =
    verifierAuthority?.effectiveVerifier ?? contract.verification.verifier;
  const creatorReviews =
    effectiveVerifier === "creator" &&
    (pod.state === "active" || pod.state === "final_review");
  const reviewRecords = creatorReviews
    ? await podsRepository.listPendingReviewsForCreator({
        creatorUserId: session.userId,
        podId
      })
    : null;
  const pendingReviews = reviewRecords?.filter(
    ({ submission }) => submission.state === "reviewing"
  ).length ?? 0;
  const statePresentation = presentCreatorPodState({
    podId: pod.id,
    state: pod.state as PodState,
    verifier: effectiveVerifier,
    pendingReviewCount: pendingReviews,
    ...(contract.settlementMode
      ? { settlementMode: contract.settlementMode }
      : {})
  });

  if (pod.state !== "enrollment_open") {
    return (
      <main className="app-shell admin-shell">
        <header className="app-topbar entrance entrance-topbar">
          <Link className="wordmark" href="/my-pods"><span className="pod-mark" aria-hidden="true" />pods</Link>
          <span className="phase-pill">Creator controls</span>
        </header>
        <section className="today-hero entrance entrance-hero">
          <p className="eyebrow">{statePresentation.admin.eyebrow}</p>
          <h1>{contract.activity.name}</h1>
          <p className="screen-copy">{statePresentation.admin.detail}</p>
        </section>
        <section className="active-pod-actions creator-command-actions">
          {statePresentation.admin.actions.map((action) => (
            <Link
              className={`${action.emphasis === "primary" ? "primary" : "secondary"}-action full-action`}
              href={action.href}
              key={action.kind}
            >
              {action.label}
            </Link>
          ))}
        </section>
      </main>
    );
  }
  const applications = await podsRepository.listApplicationsForCreator({ creatorUserId: session.userId, podId });
  const invitations = await podsRepository.listInvitationsForCreator({ creatorUserId: session.userId, podId });
  const friends = contract.community.visibility === "private"
    ? await podsRepository.listFriends(session.userId)
    : [];
  const pending = applications.filter(({ application }) => application.state === "applied").length;
  const accepted = applications.filter(({ application }) => application.state === "accepted_unfunded").length;
  const rejected = applications.filter(({ application }) => application.state === "application_rejected").length;
  const renderedAt = new Date().getTime();

  return (
    <main className="app-shell admin-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/my-pods"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className="phase-pill">Creator controls</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">{statePresentation.admin.eyebrow}</p><h1>{contract.activity.name}</h1>
        <p className="screen-copy">{statePresentation.admin.detail}</p>
      </section>
      <Link className="secondary-action full-action admin-funding-link" href={`/pods/${pod.id}/admin/funding`}>View participant funding stages</Link>
      {contract.community.visibility === "public" ? (
        <>
          <section className="admin-metrics">
            <div><span>Pending</span><strong>{pending}</strong></div><div><span>Accepted</span><strong>{accepted}</strong></div><div><span>Not accepted</span><strong>{rejected}</strong></div>
          </section>
          <Link className="primary-action full-action" href={`/pods/${pod.id}/admin/applications`}>{pending > 0 ? `Review ${pending} application${pending === 1 ? "" : "s"}` : "View application history"}</Link>
          <aside className="share-recruit"><strong>Share and recruit</strong><p>Your public preview is ready. Applicants can review the exact contract before answering.</p><Link href={`/pods/${pod.id}`}>Open public preview</Link></aside>
        </>
      ) : (
        <InvitationManager
          initial={invitations.map((invitation) => ({
            id: invitation.id,
            expiresAt: invitation.expiresAt.toISOString(),
            status: invitation.usedAt ? "used" : invitation.revokedAt ? "revoked" : invitation.expiresAt.getTime() <= renderedAt ? "expired" : "active"
          }))}
          friends={friends.map(({ handle, displayName }) => ({ handle, displayName }))}
          podId={pod.id}
        />
      )}
      <CancelPodControl podId={pod.id} podName={contract.activity.name} />
    </main>
  );
}
