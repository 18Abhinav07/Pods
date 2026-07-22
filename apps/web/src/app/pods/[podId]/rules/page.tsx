import { templateContracts } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";
import { presentPodRelationship } from "../../../../lib/participant-pod-state";

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export default async function RulesPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/rules`);
  const owned = await podsRepository.getPodForOwner(session.userId, podId);
  const accepted = owned ? null : await podsRepository.getPodForAcceptedMember(session.userId, podId);
  const activeRoom = owned || accepted
    ? null
    : await podsRepository.getWaitingRoomForUser({ userId: session.userId, podId });
  const pod = owned ?? accepted ?? activeRoom?.pod;
  if (!pod?.contractData || !pod.contractHash) notFound();
  const membership = owned ? null : await podsRepository.getMembershipForUser(session.userId, podId);
  if (!owned && !membership) notFound();
  const contract = pod.contractData;
  const template = templateContracts.find((item) => item.id === contract.templateId);
  const memberPresentation = membership ? presentPodRelationship({
    podId: pod.id,
    relationship: {
      kind: "member",
      state: membership.state,
      depositIntentId: membership.depositIntentId
    }
  }) : null;
  const nextHref = owned
    ? pod.state === "enrollment_open"
      ? `/pods/${pod.id}/admin`
      : pod.state === "locked_scheduled"
        ? `/pods/${pod.id}/room`
        : `/pods/${pod.id}/admin/funding`
    : memberPresentation?.href ?? "/my-pods";
  const nextLabel = owned
    ? pod.state === "enrollment_open"
      ? "Open creator controls"
      : pod.state === "locked_scheduled"
        ? "Open Pod room"
        : "Open funding overview"
    : memberPresentation?.actionLabel ?? "View My Pods";
  return <main className="app-shell rules-shell">
    <header className="app-topbar entrance entrance-topbar"><Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link><span className="frozen-pill">Contract frozen</span></header>
    <section className="rules-hero entrance entrance-hero"><p className="eyebrow">Immutable Pod rules</p><h1>{contract.activity.name}</h1><p>{contract.activity.purpose}</p></section>
    <div className="contract-hash entrance entrance-status"><span>Contract fingerprint</span><code>{pod.contractHash}</code></div>
    <div className="rules-list entrance entrance-templates">
      <section><span>Template</span><strong>{template?.name}</strong><p>{template?.evidence}</p></section>
      <section><span>Schedule</span><strong>{contract.commitment.occurrenceCount} frozen occurrences</strong><p>{contract.activity.startDate} to {contract.activity.endDate}, {contract.activity.timeZone}</p></section>
      <section><span>Community</span><strong>{contract.community.visibility === "public" ? "Public application community" : "Private invitation community"}</strong><p>{contract.community.minParticipants} minimum, {contract.community.maxParticipants} maximum</p></section>
      <section><span>Commitment</span><strong>{nim(contract.commitment.totalLuna)} Testnet NIM upfront</strong><p>{contract.settlementMode === "full_refund_alpha" ? "Full return after roster lock. This contract cannot switch to proportional redistribution." : `${nim(contract.commitment.lunaPerOccurrence)} NIM per occurrence`}</p></section>
      <section><span>Evidence authority</span><strong>Pods team review</strong><p>Creators and participants cannot decide evidence or financial outcomes.</p></section>
      <section><span>{contract.settlementMode === "full_refund_alpha" ? "Return policy" : "Timeout protection"}</span><strong>{contract.settlementMode === "full_refund_alpha" ? "100% full-return alpha" : "24-hour hard protection"}</strong><p>{contract.settlementMode === "full_refund_alpha" ? "Activity review affects the participant record, never the return amount." : "Principal protected, no bonus, streak extended."}</p></section>
    </div>
    <Link className="primary-action full-action" href={nextHref}>{nextLabel}</Link>
  </main>;
}
