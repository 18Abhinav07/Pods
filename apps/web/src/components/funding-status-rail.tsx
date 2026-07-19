"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { DepositExceptionCode, DepositState } from "@pods/domain";

import type { ParticipantDepositIntent } from "../lib/funding-client";

const stages = [
  ["Wallet", "Wallet confirmation"],
  ["Submitted", "Transaction submitted"],
  ["Observed", "Chain observed"],
  ["Finalized", "Chain finalized"],
  ["Credited", "Ledger credited"],
  ["Secured", "Roster locked"]
] as const;

const stateIndex: Record<DepositState, number> = {
  intent_created: 0,
  wallet_approval_pending: 0,
  wallet_rejected: 0,
  transaction_submitted: 1,
  observed: 2,
  finalized: 3,
  credited_provisional: 4,
  applied_to_roster: 5,
  exception_review: 1,
  refund_pending: 4,
  refunded: 4
};

const statusCopy: Record<DepositState, { title: string; detail: string }> = {
  intent_created: {
    title: "Ready for wallet confirmation",
    detail: "The exact commitment is ready. No transaction has been requested yet."
  },
  wallet_approval_pending: {
    title: "Waiting on wallet confirmation",
    detail: "Confirm the exact NIM commitment in Nimiq Pay. No credit is assumed from this screen."
  },
  wallet_rejected: {
    title: "Wallet confirmation was declined",
    detail: "No transaction hash was recorded and no commitment was credited."
  },
  transaction_submitted: {
    title: "Transaction submitted",
    detail: "The wallet returned a hash. The independent watcher is looking for the payment."
  },
  observed: {
    title: "Payment found on Testnet",
    detail: "Recipient, value, and reference matched. The watcher is waiting for a later macro batch."
  },
  finalized: {
    title: "Payment reached finality",
    detail: "The chain proof is final. The participant ledger credit is the next worker-owned step."
  },
  credited_provisional: {
    title: "Commitment credited",
    detail: "Your full commitment is accounted for. Your place becomes secure only at roster lock."
  },
  applied_to_roster: {
    title: "Place secured",
    detail: "Funding finality and roster lock are complete. Your activity is ready."
  },
  exception_review: {
    title: "Payment needs review",
    detail: "Pods has isolated this payment from automatic credit while the mismatch is reviewed."
  },
  refund_pending: {
    title: "Refund queued",
    detail: "Your principal is owed back. The transfer worker will prepare and reconcile the refund."
  },
  refunded: {
    title: "Refund confirmed",
    detail: "The return transfer has been confirmed on Nimiq Testnet."
  }
};

const exceptionCopy: Record<DepositExceptionCode, string> = {
  transaction_not_observed: "Transaction not found yet",
  wrong_network: "Payment used the wrong network",
  reference_mismatch: "Payment reference does not match",
  reference_missing: "Payment reference is missing",
  reference_duplicate: "Payment reference was already used",
  reference_expired: "Payment arrived after the intent expired",
  amount_mismatch: "Payment amount does not match",
  recipient_mismatch: "Payment recipient does not match",
  execution_failed: "Transaction execution failed",
  finalized_after_cutoff: "Payment finalized after the cutoff",
  capacity_excluded: "Pod capacity was already filled"
};

const terminalStates = new Set<DepositState>([
  "wallet_rejected",
  "applied_to_roster",
  "exception_review",
  "refunded"
]);

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

function FundingStatusRefresh({ state }: { state: DepositState }) {
  const router = useRouter();
  useEffect(() => {
    if (terminalStates.has(state)) return;
    const timer = window.setInterval(() => router.refresh(), 5_000);
    return () => window.clearInterval(timer);
  }, [router, state]);
  return null;
}

export function FundingStatusRail({ intent }: { intent: ParticipantDepositIntent }) {
  const currentIndex = stateIndex[intent.state];
  const copy = statusCopy[intent.state];
  const isAlert = intent.state === "wallet_rejected" || intent.state === "exception_review";

  return (
    <div className="funding-status-flow">
      <FundingStatusRefresh state={intent.state} />
      <section
        className={`funding-state-card state-${intent.state}`}
        role={isAlert ? "alert" : "status"}
      >
        <div className="funding-state-orbit" aria-hidden="true"><i /><i /></div>
        <p className="eyebrow">Current financial state</p>
        <h1>{copy.title}</h1>
        <p>{copy.detail}</p>
        {intent.exceptionCode ? (
          <div className="exception-reason"><span>Reason</span><strong>{exceptionCopy[intent.exceptionCode]}</strong></div>
        ) : null}
      </section>

      <ol className="funding-stage-rail" aria-label="Funding progress">
        {stages.map(([shortLabel, accessibleLabel], index) => {
          const relation = index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
          return (
            <li aria-current={relation === "current" ? "step" : undefined} className={`is-${relation}`} key={shortLabel}>
              <span aria-hidden="true">{relation === "complete" ? "✓" : String(index + 1).padStart(2, "0")}</span>
              <div><strong>{shortLabel}</strong><small>{accessibleLabel}</small></div>
            </li>
          );
        })}
      </ol>

      <section className="funding-receipt" aria-labelledby="receipt-title">
        <div className="section-title-row"><span>Persistent receipt</span><h2 id="receipt-title">Commitment details</h2></div>
        <dl>
          <div><dt>Amount</dt><dd>{nim(intent.amountLuna)} NIM</dd></div>
          <div><dt>Network</dt><dd>Nimiq Testnet</dd></div>
          <div className="receipt-wide"><dt>Reference</dt><dd>{intent.reference}</dd></div>
          {intent.transactionHash ? <div className="receipt-wide"><dt>Transaction hash</dt><dd>{intent.transactionHash}</dd></div> : null}
          {intent.observedAt ? <div><dt>Observed</dt><dd>{new Date(intent.observedAt).toLocaleString("en")}</dd></div> : null}
          {intent.finalizedAt ? <div><dt>Finalized</dt><dd>{new Date(intent.finalizedAt).toLocaleString("en")}</dd></div> : null}
          {intent.creditedAt ? <div><dt>Credited</dt><dd>{new Date(intent.creditedAt).toLocaleString("en")}</dd></div> : null}
        </dl>
      </section>

      {intent.state === "wallet_rejected" ? <Link className="primary-action full-action" href={`/pods/${intent.podId}/fund`}>Try funding again</Link> : null}
      {intent.state === "credited_provisional" || intent.state === "applied_to_roster" ? <Link className="primary-action full-action" href={`/pods/${intent.podId}/today`}>View activity status</Link> : null}
      <Link className="secondary-action full-action" href="/applications">Back to applications</Link>
    </div>
  );
}
