import { buildPublishedContract, templateContracts } from "@pods/domain";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CreatorShell } from "../../../../components/creator-shell";
import { PublishClient } from "../../../../components/publish-client";
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
  const result = buildPublishedContract({ templateId: pod.templateId, activity, community, commitment });
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
    <section className="contract-money"><span>Commitment</span><strong>{nim(contract.commitment.totalLuna)} Testnet NIM upfront</strong><p>Full return after roster lock. No proportional redistribution in this immutable contract.</p></section>
    <section><span>Verification</span><strong>Pods team</strong><p>Review outcomes update progress and streaks. They do not change the Phase 4 alpha return.</p></section>
    <PublishClient podId={pod.id} />
  </div></CreatorShell>;
}
