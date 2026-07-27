import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import styles from "../../../../../components/financial-flow.module.css";
import { FundingStatusRail } from "../../../../../components/funding-status-rail";
import { participantDepositIntent } from "../../../../../lib/funding-server";
import { podsRepository } from "../../../../../lib/server-db";
import { requireSession } from "../../../../../lib/session";

export default async function FundingStatusPage({
  params,
  searchParams
}: {
  params: Promise<{ podId: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const { podId } = await params;
  const { intent: intentId } = await searchParams;
  const session = await requireSession(`/pods/${podId}/fund/status${intentId ? `?intent=${encodeURIComponent(intentId)}` : ""}`);
  if (!intentId) notFound();
  const storedIntent = await podsRepository.getDepositIntentForUser(session.userId, intentId);
  if (!storedIntent || storedIntent.podId !== podId) notFound();
  if (storedIntent.state === "refund_pending" || storedIntent.state === "refunded") {
    redirect(`/pods/${podId}/today`);
  }

  return (
    <main className={`app-shell funding-status-shell ${styles.financialPage}`}>
      <header className={styles.financialTopbar}>
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className={styles.networkChip}><i aria-hidden="true" />Testnet</span>
      </header>
      <section className={styles.financialIntro}>
        <p>Funding tracker</p>
        <h2>Your commitment persists here.</h2>
        <span>Pods independently reconciles your wallet transaction with the chain.</span>
      </section>
      <FundingStatusRail intent={participantDepositIntent(storedIntent)} />
    </main>
  );
}
