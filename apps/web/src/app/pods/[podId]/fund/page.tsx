import { templateContracts } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FundingCommitment } from "../../../../components/funding-commitment";
import { alphaDepositsEnabled } from "../../../../lib/alpha-access";
import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";

export default async function FundingHandoffPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/fund`);
  const pod = await podsRepository.getPodForAcceptedMember(session.userId, podId);
  if (!pod?.contractData || pod.state !== "enrollment_open") notFound();
  const contract = pod.contractData;
  const template = templateContracts.find((item) => item.id === contract.templateId);
  const depositsEnabled = alphaDepositsEnabled(process.env);

  return (
    <main className="app-shell funding-shell">
      <header className="app-topbar entrance entrance-topbar"><Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link><span className="network-pill"><i aria-hidden="true" />Nimiq Testnet</span></header>
      <section className="today-hero funding-hero entrance entrance-hero"><p className="eyebrow">Accepted, commitment required</p><h1>Back your place.</h1><p className="screen-copy">Review the complete financial contract before Nimiq Pay asks for wallet confirmation.</p></section>
      {depositsEnabled ? (
        <FundingCommitment
          activityName={contract.activity.name}
          lunaPerOccurrence={contract.commitment.lunaPerOccurrence}
          occurrenceCount={contract.commitment.occurrenceCount}
          podId={pod.id}
          templateName={template?.name ?? "Activity Pod"}
          totalLuna={contract.commitment.totalLuna}
          settlementMode={contract.settlementMode ?? "proportional"}
          publicVisitorRoom={
            contract.version === 2 &&
            contract.community.roomAudience === "public_read_only"
          }
        />
      ) : (
        <section className="neutral-empty entrance entrance-status">
          <span>NIM commitments are paused</span>
          <p>
            This closed alpha validates identity, activity, and realtime behavior without
            accepting funds. Testnet commitments open only after the refund gate passes.
          </p>
          <Link className="secondary-action full-action" href={`/pods/${pod.id}`}>
            Return to Pod
          </Link>
        </section>
      )}
    </main>
  );
}
