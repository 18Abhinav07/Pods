import { templateContracts } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TemplateSymbol } from "../../../components/template-symbol";
import { podsRepository } from "../../../lib/server-db";

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export default async function PublicPodPage({
  params
}: {
  params: Promise<{ podId: string }>;
}) {
  const { podId } = await params;
  const pod = await podsRepository.getPublicPod(podId, new Date());
  if (!pod?.contractData || pod.contractData.community.visibility !== "public") notFound();
  const contract = pod.contractData;
  const template = templateContracts.find((item) => item.id === contract.templateId);

  return (
    <main className="app-shell public-preview-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/discover"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="phase-pill">Public Pod</span>
      </header>
      <section className="public-preview-hero entrance entrance-hero">
        <TemplateSymbol templateId={contract.templateId} />
        <p className="eyebrow">{template?.name}</p>
        <h1>{contract.activity.name}</h1>
        <p>{contract.activity.purpose}</p>
      </section>
      <section className="public-preview-ledger entrance entrance-status">
        <div><span>Schedule</span><strong>{contract.commitment.occurrenceCount} occurrences</strong><small>{contract.activity.startDate} to {contract.activity.endDate}</small></div>
        <div><span>Upfront commitment</span><strong>{nim(contract.commitment.totalLuna)} NIM</strong><small>{nim(contract.commitment.lunaPerOccurrence)} NIM per occurrence</small></div>
        <div><span>Community</span><strong>{contract.community.minParticipants} to {contract.community.maxParticipants} people</strong><small>Creator reviews applications</small></div>
        <div><span>Evidence authority</span><strong>Pods team review</strong><small>Not peer-voted or creator-controlled</small></div>
      </section>
      <aside className="reservation-disclosure entrance entrance-templates">
        <strong>Application before commitment</strong>
        <p>Applying does not reserve a place. A place is secured only after acceptance, funding finality, and roster lock.</p>
      </aside>
      <Link className="primary-action full-action" href={`/pods/${pod.id}/apply`}>Apply to join</Link>
    </main>
  );
}
