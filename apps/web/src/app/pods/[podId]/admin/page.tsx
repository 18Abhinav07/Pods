import Link from "next/link";

import { CancelPodControl } from "../../../../components/cancel-pod-control";
import { InvitationManager } from "../../../../components/invitation-manager";
import { requireEnrollmentOwner } from "../../../../lib/enrollment-guards";
import { podsRepository } from "../../../../lib/server-db";

export default async function PodAdminPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const { session, pod } = await requireEnrollmentOwner(podId, `/pods/${podId}/admin`);
  const contract = pod.contractData;
  if (!contract) return null;
  if (pod.state === "active" || pod.state === "final_review") {
    const creatorReviews = contract.verification.verifier === "creator";
    const reviewRecords = creatorReviews
      ? await podsRepository.listPendingReviewsForCreator({
          creatorUserId: session.userId,
          podId
        })
      : null;
    const pendingReviews = reviewRecords?.filter(
      ({ submission }) => submission.state === "reviewing"
    ).length ?? 0;
    return (
      <main className="app-shell admin-shell">
        <header className="app-topbar entrance entrance-topbar">
          <Link className="wordmark" href="/my-pods"><span className="pod-mark" aria-hidden="true" />pods</Link>
          <span className="phase-pill">Creator controls</span>
        </header>
        <section className="today-hero entrance entrance-hero">
          <p className="eyebrow">Creator command center</p>
          <h1>{contract.activity.name}</h1>
          <p className="screen-copy">Follow the activity, review member proofs, and keep the frozen Pod contract visible.</p>
        </section>
        <section className="active-pod-actions creator-command-actions">
          {creatorReviews ? <Link className="primary-action full-action" href={`/pods/${pod.id}/admin/reviews`}>Review {pendingReviews} proof{pendingReviews === 1 ? "" : "s"}</Link> : null}
          <Link className="secondary-action full-action" href={`/pods/${pod.id}/room`}>Open Pod room</Link>
          <Link className="secondary-action full-action" href={`/pods/${pod.id}/activity`}>View activity</Link>
          <Link className="secondary-action full-action" href={`/pods/${pod.id}/admin/funding`}>View participant funding stages</Link>
          <Link className="secondary-action full-action" href={`/pods/${pod.id}/rules`}>Review frozen rules</Link>
        </section>
      </main>
    );
  }
  if (pod.state !== "enrollment_open") {
    const stateCopy = pod.state === "locked_scheduled"
      ? {
          eyebrow: "Roster locked",
          detail: "Enrollment is complete. The Pod room is now the source of truth for the activity schedule.",
          primaryLabel: "Open Pod room",
          primaryHref: `/pods/${pod.id}/today`
        }
      : pod.state === "cutoff_evaluating"
        ? {
            eyebrow: "Roster evaluating",
            detail: "Enrollment is closed while the audited cutoff resolves funded places and returns.",
            primaryLabel: "Open funding overview",
            primaryHref: `/pods/${pod.id}/admin/funding`
          }
        : pod.state === "cancelled_refunding"
          ? {
              eyebrow: "Returns in progress",
              detail: "The Pod did not lock. Participant commitments are being returned through the transfer engine.",
              primaryLabel: "Track participant returns",
              primaryHref: `/pods/${pod.id}/admin/funding`
            }
          : {
              eyebrow: "Pod cancelled",
              detail: "Enrollment is closed and all recorded return obligations are resolved.",
              primaryLabel: "View financial history",
              primaryHref: `/pods/${pod.id}/admin/funding`
            };
    return (
      <main className="app-shell admin-shell">
        <header className="app-topbar entrance entrance-topbar">
          <Link className="wordmark" href="/my-pods"><span className="pod-mark" aria-hidden="true" />pods</Link>
          <span className="phase-pill">Creator controls</span>
        </header>
        <section className="today-hero entrance entrance-hero">
          <p className="eyebrow">{stateCopy.eyebrow}</p>
          <h1>{contract.activity.name}</h1>
          <p className="screen-copy">{stateCopy.detail}</p>
        </section>
        <Link className="primary-action full-action" href={stateCopy.primaryHref}>{stateCopy.primaryLabel}</Link>
        <Link className="secondary-action full-action" href={`/pods/${pod.id}/rules`}>Review frozen rules</Link>
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
        <p className="eyebrow">Enrollment command center</p><h1>{contract.activity.name}</h1>
        <p className="screen-copy">Manage who enters. Frozen rules, evidence decisions, and future financial outcomes remain outside creator control.</p>
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
