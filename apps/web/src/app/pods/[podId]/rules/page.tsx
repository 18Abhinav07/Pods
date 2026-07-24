import { templateContracts, type PodState } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";
import { presentCreatorPodState, presentPodRelationship } from "../../../../lib/participant-pod-state";

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
  const verifierAuthority =
    await podsRepository.getVerifierAuthorityForPod(pod.id);
  const effectiveVerifier =
    verifierAuthority?.effectiveVerifier ?? contract.verification.verifier;
  const template = templateContracts.find((item) => item.id === contract.templateId);
  const memberPresentation = membership ? presentPodRelationship({
    podId: pod.id,
    podState: pod.state as Exclude<PodState, "draft">,
    settlementMode: pod.contractData.settlementMode,
    relationship: {
      kind: "member",
      state: membership.state,
      depositIntentId: membership.depositIntentId
    }
  }) : null;
  const creatorPresentation = owned
    ? presentCreatorPodState({
        podId: pod.id,
        state: pod.state as Exclude<PodState, "draft">,
        verifier: effectiveVerifier,
        settlementMode: pod.contractData.settlementMode
      })
    : null;
  const nextHref = owned
    ? creatorPresentation?.href ?? "/my-pods"
    : memberPresentation?.href ?? "/my-pods";
  const nextLabel = owned
    ? creatorPresentation?.actionLabel ?? "View My Pods"
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
      {verifierAuthority?.source === "testnet_override" ? (
        <>
          <section><span>Frozen evidence authority</span><strong>Pods Team review</strong><p>The frozen contract fingerprint remains unchanged.</p></section>
          <section><span>Testnet operational amendment</span><strong>Creator review active</strong><p>The Pod creator now reviews member proofs. The creator remains outside membership and financial records. This audited amendment does not change the frozen contract hash or return policy.</p></section>
        </>
      ) : (
        <section><span>Evidence authority</span><strong>{effectiveVerifier === "creator" ? "Creator review" : "Pods Team review"}</strong><p>{effectiveVerifier === "creator" ? contract.settlementMode === "full_refund_alpha" ? "The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds." : "The Pod creator reviews member proofs. Approval and rejection can change how member stakes are redistributed. The creator does not fund this Pod or receive member funds. This Testnet MVP has no appeal or peer vote. Fund only if you trust the creator and accept these frozen rules." : "The Pods Team reviews member proofs under this legacy frozen contract."}</p></section>
      )}
      <section><span>{contract.settlementMode === "full_refund_alpha" ? "Return policy" : "Timeout protection"}</span><strong>{contract.settlementMode === "full_refund_alpha" ? "100% full-return alpha" : "24-hour hard protection"}</strong><p>{contract.settlementMode === "full_refund_alpha" ? "Activity review affects the participant record, never the return amount." : "Principal protected, no bonus, streak extended."}</p></section>
    </div>
    <Link className="primary-action full-action" href={nextHref}>{nextLabel}</Link>
  </main>;
}
