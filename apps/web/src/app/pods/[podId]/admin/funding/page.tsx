import type { MembershipState } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CreatorFundingOverview } from "../../../../../components/creator-funding-overview";
import { podsRepository } from "../../../../../lib/server-db";
import { requireSession } from "../../../../../lib/session";

const fundingCopy = {
  applied: ["Application pending", "Waiting for creator decision"],
  accepted_unfunded: ["Funding required", "No funds credited"],
  application_rejected: ["Not accepted", "No funding requested"],
  application_expired: ["Application expired", "Cutoff closed"],
  invite_expired: ["Invitation expired", "No funding requested"],
  deposit_pending: ["Funding in progress", "Awaiting final credit"],
  funding_failed: ["Funding needs attention", "No funds credited"],
  funded_provisional: ["Commitment credited", "Waiting for roster lock"],
  roster_locked: ["Place secured", "Included in the locked roster"],
  excluded_at_cutoff: ["Not included", "Full refund required"],
  refund_pending: ["Refund in progress", "Full commitment queued for return"],
  refunded: ["Refund completed", "Full commitment returned"]
} satisfies Record<MembershipState, readonly [string, string]>;

export default async function CreatorFundingPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/admin/funding`);
  const overview = await podsRepository.getFundingOverviewForCreator({
    creatorUserId: session.userId,
    podId
  });
  if (!overview?.pod.contractData) notFound();
  const contract = overview.pod.contractData;

  return (
    <main className="app-shell admin-shell creator-funding-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href={`/pods/${podId}/admin`}><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="network-pill"><i aria-hidden="true" />Nimiq Testnet</span>
      </header>
      <CreatorFundingOverview
        podId={podId}
        name={contract.activity.name}
        podState={overview.pod.state}
        cutoffAt={overview.firstOccurrence.opensAt.toISOString()}
        minParticipants={contract.community.minParticipants}
        maxParticipants={contract.community.maxParticipants}
        confirmedParticipants={overview.confirmedParticipants}
        participants={overview.participants.map((participant) => {
          const [statusLabel, statusDetail] = fundingCopy[participant.state];
          return {
            id: participant.id,
            label: participant.label,
            admissionLabel: participant.admissionSource === "public_application"
              ? "Public application"
              : "Private invitation",
            statusLabel,
            statusDetail
          };
        })}
      />
    </main>
  );
}
