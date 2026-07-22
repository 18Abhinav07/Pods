import Link from "next/link";

import { ApplicationDecisionList } from "../../../../../components/application-decision-list";
import { requireEnrollmentOwner } from "../../../../../lib/enrollment-guards";
import { podsRepository } from "../../../../../lib/server-db";

export default async function AdminApplicationsPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const { session, pod } = await requireEnrollmentOwner(podId, `/pods/${podId}/admin/applications`);
  const contract = pod.contractData;
  if (!contract) return null;
  if (contract.community.visibility !== "public") {
    return <main className="app-shell"><section className="neutral-empty"><span>Not available</span><p>Private Pods use invitation acceptance, not public applications.</p><Link className="secondary-action full-action" href={`/pods/${podId}/admin`}>Return to creator controls</Link></section></main>;
  }
  const records = await podsRepository.listApplicationsForCreator({ creatorUserId: session.userId, podId });
  const pending = records.filter(({ application }) => application.state === "applied");

  return (
    <main className="app-shell">
      <header className="app-topbar entrance entrance-topbar"><Link className="wordmark" href={`/pods/${podId}/admin`}><span className="pod-mark" aria-hidden="true" />pods</Link><span className="phase-pill">Review queue</span></header>
      <section className="today-hero entrance entrance-hero"><p className="eyebrow">Creator review</p><h1>{pending.length} decision{pending.length === 1 ? "" : "s"} waiting.</h1><p className="screen-copy">Review answers against the frozen community purpose. Wallet addresses are never shown.</p></section>
      <ApplicationDecisionList
        applications={pending.map(({ application }) => ({
          id: application.id,
          applicantLabel: `Builder ${application.applicantUserId.slice(0, 6).toUpperCase()}`,
          answers: application.answers
        }))}
        podId={podId}
      />
      {records.some(({ application }) => application.state !== "applied") ? <p className="history-note">Past decisions remain visible in the command-center totals.</p> : null}
    </main>
  );
}
