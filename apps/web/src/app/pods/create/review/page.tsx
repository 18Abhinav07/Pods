import { buildPublishedContract, templateContracts } from "@pods/domain";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CreatorShell } from "../../../../components/creator-shell";
import { PublishClient } from "../../../../components/publish-client";
import { alphaFundingPolicy } from "../../../../lib/alpha-access";
import { requireDraftOwner } from "../../../../lib/creator-guard";

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export default async function ReviewStepPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const { draft } = await searchParams;
  const { pod } = await requireDraftOwner(draft, "/pods/create/review");
  const { activity, community, commitment } = pod.draftData;
  if (!activity) redirect(`/pods/create/activity?draft=${pod.id}`);
  if (!community) redirect(`/pods/create/community?draft=${pod.id}`);
  if (!commitment) redirect(`/pods/create/commitment?draft=${pod.id}`);
  let fundingPolicy: ReturnType<typeof alphaFundingPolicy>;
  try {
    fundingPolicy = alphaFundingPolicy(process.env);
  } catch {
    return (
      <CreatorShell
        activeStep={4}
        eyebrow="Review paused"
        title="Publishing is paused."
        copy="Your draft is saved. No contract has been published or changed."
      >
        <Link className="secondary-action full-action" href="/my-pods">
          Return to My Pods
        </Link>
      </CreatorShell>
    );
  }
  const result = buildPublishedContract(
    { templateId: pod.templateId, activity, community, commitment },
    fundingPolicy
  );
  if (!result.success) {
    return <CreatorShell activeStep={4} eyebrow="Review paused" title="One section still needs attention." copy="The server could not freeze this contract yet."><div className="review-errors">{result.errors.map((error) => <p key={error}>{error}</p>)}<Link className="secondary-action full-action" href={`/pods/create/activity?draft=${pod.id}`}>Return to activity</Link></div></CreatorShell>;
  }
  const contract = result.contract;
  const template = templateContracts.find((item) => item.id === contract.templateId);
  return <CreatorShell activeStep={4} eyebrow="Step 5 of 5" title="Read the contract before it freezes." copy="Publishing materializes the schedule and removes every creator edit path."><div className="contract-review">
    <section><span>Template</span><strong>{template?.name}</strong><p>{contract.evidenceMode === "repeating_criterion" ? "One measurable criterion repeats" : "A new task locks for every occurrence"}</p></section>
    <section><span>Activity</span><strong>{contract.activity.name}</strong><p>{contract.activity.purpose}</p></section>
    <section><span>Schedule</span><strong>{contract.commitment.occurrenceCount} occurrences</strong><p>{contract.activity.startDate} to {contract.activity.endDate} in {contract.activity.timeZone}</p></section>
    <section><span>Community</span><strong>{contract.community.visibility === "public" ? "Public, application-based" : "Private, invitation-only"}</strong><p>{contract.community.minParticipants} to {contract.community.maxParticipants} participants</p></section>
    {contract.version === 2 ? <section><span>Visitor room</span><strong>{contract.community.roomAudience === "public_read_only" ? "Public, read only" : "Members only"}</strong><p>{contract.community.roomAudience === "public_read_only" ? "After roster lock, visitors can read public room and proof records without activity or financial access." : "Only the creator and locked roster can enter the room."}</p></section> : null}
    <section className="contract-money"><span>Commitment</span><strong>{nim(contract.commitment.totalLuna)} Testnet NIM upfront</strong><p>{contract.settlementMode === "proportional" ? "Approved work protects its slice and can earn from rejected or missed slices for the same occurrence." : "Full return after roster lock. No proportional redistribution in this immutable contract."}</p></section>
    <section><span>Verification</span><strong>Creator review</strong><p>The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds.</p></section>
    {contract.settlementMode === "proportional" ? <section className="contract-trust"><span>Testnet trust boundary</span><strong>No appeal or peer vote</strong><p>The Pod creator reviews member proofs. Approval and rejection can change how member stakes are redistributed. The creator does not fund this Pod or receive member funds. This Testnet MVP has no appeal or peer vote. Fund only if you trust the creator and accept these frozen rules.</p></section> : null}
    <PublishClient podId={pod.id} />
  </div></CreatorShell>;
}
