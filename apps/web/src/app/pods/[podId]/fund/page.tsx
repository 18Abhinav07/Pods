import { templateContracts } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export default async function FundingHandoffPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/fund`);
  const pod = await podsRepository.getPodForAcceptedMember(session.userId, podId);
  if (!pod?.contractData || pod.state !== "enrollment_open") notFound();
  const contract = pod.contractData;
  const template = templateContracts.find((item) => item.id === contract.templateId);

  return (
    <main className="app-shell funding-boundary-shell">
      <header className="app-topbar entrance entrance-topbar"><Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><span className="phase-pill">Phase 3 boundary</span></header>
      <section className="today-hero entrance entrance-hero"><p className="eyebrow">Accepted, funding required</p><h1>Your place is not secured yet.</h1><p className="screen-copy">You have passed the enrollment decision. Funding finality and roster lock are the remaining gates.</p></section>
      <section className="funding-commitment-card entrance entrance-status">
        <span>{template?.name}</span><h2>{contract.activity.name}</h2>
        <div><small>Maximum upfront commitment</small><strong>{nim(contract.commitment.totalLuna)} NIM</strong></div>
        <p>{contract.commitment.occurrenceCount} slices at {nim(contract.commitment.lunaPerOccurrence)} NIM each.</p>
      </section>
      <aside className="phase-boundary-note"><strong>No NIM is being requested in Phase 2.</strong><p>The wallet transaction, chain finality rail, capacity cutoff, and refund handling activate only after this phone-tested enrollment phase is approved.</p></aside>
      <Link className="secondary-action full-action" href={`/pods/${pod.id}/rules`}>Review frozen rules</Link>
      <Link className="quiet-link centered-link" href="/applications">Return to applications</Link>
    </main>
  );
}
