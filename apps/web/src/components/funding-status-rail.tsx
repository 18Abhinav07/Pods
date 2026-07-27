"use client";

import { ArrowRight, CaretDown, Check, Clock, WarningCircle } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { DepositExceptionCode, DepositState } from "@pods/domain";

import type { ParticipantDepositIntent } from "../lib/funding-client";
import { formatZonedMoment } from "../lib/format-moment";
import styles from "./financial-flow.module.css";

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

function currentStageIndex(intent: ParticipantDepositIntent) {
  if (intent.state !== "exception_review") return stateIndex[intent.state];
  if (intent.creditedAt) return 4;
  if (intent.finalizedAt) return 3;
  if (intent.observedAt) return 2;
  if (intent.transactionHash) return 1;
  return 0;
}

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
  const currentIndex = currentStageIndex(intent);
  const copy = statusCopy[intent.state];
  const isAlert = intent.state === "wallet_rejected" || intent.state === "exception_review";
  const completedThroughCurrent = intent.state === "applied_to_roster";
  const podDestination = intent.state === "credited_provisional"
    ? { label: "View Pod status", href: `/pods/${intent.podId}/today` }
    : intent.state === "applied_to_roster"
      ? { label: "Open Pod", href: `/pods/${intent.podId}/room` }
      : intent.state === "refund_pending"
        ? { label: "Track refund", href: `/pods/${intent.podId}/today` }
        : intent.state === "refunded"
          ? { label: "View refund receipt", href: `/pods/${intent.podId}/today` }
          : null;
  const financialHistoryComplete = [
    "credited_provisional",
    "applied_to_roster",
    "refund_pending",
    "refunded"
  ].includes(intent.state);

  return (
    <div className={styles.statusFlow}>
      <FundingStatusRefresh state={intent.state} />
      <section
        className={`${styles.statusHero} ${isAlert ? styles.statusAttention : ""} ${intent.state === "applied_to_roster" ? styles.statusSuccess : ""}`}
        role={isAlert ? "alert" : "status"}
      >
        <div className={styles.statusHeroTop}>
          <div className={styles.nimMedallion} data-size="small">
            <Image alt="NIM token" height={72} src="/media/nimiq-signet.svg" width={72} />
          </div>
          <span>{nim(intent.amountLuna)} NIM</span>
        </div>
        <div className={styles.statusMessage}>
          <span className={styles.eyebrow}>Current financial state</span>
          <h1>{copy.title}</h1>
          <p>{copy.detail}</p>
        </div>
        {intent.exceptionCode ? (
          <div className={styles.exceptionReason}>
            <WarningCircle aria-hidden="true" weight="regular" />
            <span><small>Reason</small><strong>{exceptionCopy[intent.exceptionCode]}</strong></span>
          </div>
        ) : null}
      </section>

      <ol
        aria-label="Funding progress"
        className={styles.compactRail}
        data-compact-financial-rail=""
      >
        {stages.map(([shortLabel, accessibleLabel], index) => {
          const relation = index < currentIndex || (completedThroughCurrent && index === currentIndex)
            ? "complete"
            : index === currentIndex
              ? "current"
              : "upcoming";
          return (
            <li
              aria-current={relation === "current" ? "step" : undefined}
              aria-label={`${shortLabel}: ${accessibleLabel}`}
              className={`${styles.compactStep} is-${relation}`}
              data-state={relation}
              key={shortLabel}
            >
              <span aria-hidden="true">
                {relation === "complete" ? <><Check weight="bold" /><i className={styles.textCheck}>✓</i></> : relation === "current" ? <Clock weight="bold" /> : index + 1}
              </span>
              <strong>{shortLabel}</strong>
              <small>{accessibleLabel}</small>
            </li>
          );
        })}
      </ol>

      <details className={styles.receipt} open={isAlert || undefined}>
        <summary>
          <span><small>Persistent receipt</small><strong id="receipt-title">Commitment details</strong></span>
          <CaretDown aria-hidden="true" />
        </summary>
        <dl aria-labelledby="receipt-title">
          <div><dt>Amount</dt><dd>{nim(intent.amountLuna)} NIM</dd></div>
          <div><dt>Network</dt><dd>Nimiq Testnet</dd></div>
          <div className={styles.receiptWide}><dt>Reference</dt><dd>{intent.reference}</dd></div>
          {intent.transactionHash ? <div className={styles.receiptWide}><dt>Transaction hash</dt><dd>{intent.transactionHash}</dd></div> : null}
          {intent.observedAt ? <div><dt>Observed</dt><dd>{formatZonedMoment(intent.observedAt, { timeZone: "UTC", includeYear: true, includeZone: true })}</dd></div> : null}
          {intent.finalizedAt ? <div><dt>Finalized</dt><dd>{formatZonedMoment(intent.finalizedAt, { timeZone: "UTC", includeYear: true, includeZone: true })}</dd></div> : null}
          {intent.creditedAt ? <div><dt>Credited</dt><dd>{formatZonedMoment(intent.creditedAt, { timeZone: "UTC", includeYear: true, includeZone: true })}</dd></div> : null}
        </dl>
      </details>

      <div className={styles.statusActions}>
        {intent.state === "wallet_rejected" ? (
          <Link className={styles.primaryAction} href={`/pods/${intent.podId}/fund`}>
            <span>Try funding again</span><i aria-hidden="true"><ArrowRight weight="bold" /></i>
          </Link>
        ) : null}
        {podDestination ? (
          <Link className={styles.primaryAction} href={podDestination.href}>
            <span>{podDestination.label}</span><i aria-hidden="true"><ArrowRight weight="bold" /></i>
          </Link>
        ) : null}
        <Link className={styles.secondaryLink} href={financialHistoryComplete ? "/my-pods" : `/applications?pod=${intent.podId}`}>
          {financialHistoryComplete ? "View My Pods" : "Back to applications"}
        </Link>
      </div>
    </div>
  );
}
