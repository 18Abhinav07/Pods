import Link from "next/link";

import { CancelPodControl } from "../../../../components/cancel-pod-control";
import { InvitationManager } from "../../../../components/invitation-manager";
import { requireEnrollmentOwner } from "../../../../lib/enrollment-guards";
import { podsRepository } from "../../../../lib/server-db";

export default async function PodAdminPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const { session, pod } = await requireEnrollmentOwner(podId, `/pods/${podId}/admin`);
  const applications = await podsRepository.listApplicationsForCreator({ creatorUserId: session.userId, podId });
  const invitations = await podsRepository.listInvitationsForCreator({ creatorUserId: session.userId, podId });
  const pending = applications.filter(({ application }) => application.state === "applied").length;
  const accepted = applications.filter(({ application }) => application.state === "accepted_unfunded").length;
  const rejected = applications.filter(({ application }) => application.state === "application_rejected").length;
  const contract = pod.contractData;
  if (!contract) return null;

  return (
    <main className="app-shell admin-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/my-pods"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="phase-pill">Creator controls</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Enrollment command center</p><h1>{contract.activity.name}</h1>
        <p className="screen-copy">Manage who enters. Frozen rules, evidence decisions, and future financial outcomes remain outside creator control.</p>
      </section>
      {pod.state === "cancelled" ? (
        <section className="neutral-empty"><span>Cancelled</span><p>This Pod is no longer accepting applications or invitations. Its frozen history remains available.</p></section>
      ) : contract.community.visibility === "public" ? (
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
            status: invitation.usedAt ? "used" : invitation.revokedAt ? "revoked" : invitation.expiresAt.getTime() <= Date.now() ? "expired" : "active"
          }))}
          podId={pod.id}
        />
      )}
      {pod.state === "enrollment_open" ? <CancelPodControl podId={pod.id} podName={contract.activity.name} /> : null}
    </main>
  );
}
