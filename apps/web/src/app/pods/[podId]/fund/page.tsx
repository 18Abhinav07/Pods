import { templateContracts } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "../../../../components/financial-flow.module.css";
import { FundingCommitment } from "../../../../components/funding-commitment";
import { alphaDepositsEnabled } from "../../../../lib/alpha-access";
import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";

export default async function FundingHandoffPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/fund`);
  const pod = await podsRepository.getPodForAcceptedMember(session.userId, podId);
  if (!pod?.contractData || !pod.contractHash) notFound();
  const contract = pod.contractData;
  const template = templateContracts.find((item) => item.id === contract.templateId);
  const depositsEnabled = alphaDepositsEnabled(process.env);
  const fundingClosed = pod.state !== "enrollment_open";
  const membership = fundingClosed
    ? await podsRepository.getMembershipForUser(session.userId, pod.id)
    : null;
  const closedStateHref = membership?.depositIntentId
    ? `/pods/${pod.id}/fund/status?intent=${membership.depositIntentId}`
    : "/my-pods";
  const closedStateLabel = membership?.depositIntentId
    ? "Open funding tracker"
    : "View My Pods";

  return (
    <main className={`app-shell funding-shell ${styles.financialPage}`}>
      <header className={styles.financialTopbar}>
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className={styles.networkChip}><i aria-hidden="true" />Testnet</span>
      </header>
      <section className={styles.financialIntro}>
        <p>{fundingClosed ? "Enrollment closed" : "Accepted, commitment required"}</p>
        <h1>{fundingClosed ? "Funding window closed." : "Back your place."}</h1>
        <span>{fundingClosed
          ? "The Pod reached its published cutoff, so a new commitment cannot begin."
          : "Review the frozen amount and return terms before opening Nimiq Pay."}</span>
      </section>
      {fundingClosed ? (
        <section className={styles.unavailableState} role="status">
          <span>Cutoff reached</span>
          <h2>No new commitment can begin</h2>
          <p>No new wallet request will be opened from this screen. Review the persistent tracker for an existing payment, or return to My Pods for your final state.</p>
          <Link className={styles.secondaryLink} href={closedStateHref}>{closedStateLabel}</Link>
        </section>
      ) : depositsEnabled ? (
        <FundingCommitment
          activityName={contract.activity.name}
          contractHash={pod.contractHash}
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
        <section className={styles.unavailableState} role="status">
          <span>Funding unavailable</span>
          <h2>NIM commitments are paused</h2>
          <p>
            This closed alpha validates identity, activity, and realtime behavior without
            accepting funds. Testnet commitments open only after the refund gate passes.
          </p>
          <Link className={styles.secondaryLink} href={`/pods/${pod.id}`}>Return to Pod</Link>
        </section>
      )}
    </main>
  );
}
