"use client";

import { CaretDown, Check, Clock, WarningCircle } from "@phosphor-icons/react";
import type { TransferLegState } from "@pods/domain";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { formatZonedMoment } from "../lib/format-moment";
import styles from "./financial-flow.module.css";

export type ParticipantRefund = {
  state: TransferLegState;
  amountNim: number;
  transactionHash: string | null;
  confirmedAt: string | null;
  reason?: string;
};

const copy = {
  queued: ["Refund queued", "Your full commitment is reserved for return."],
  prepared: ["Refund prepared", "The signed transfer is safely persisted before broadcast."],
  broadcast: ["Refund submitted", "The transfer is on Nimiq Testnet and awaiting finality."],
  unknown: ["Refund confirmation delayed", "Pods is checking the transaction hash before any retry."],
  retryable_failed: ["Refund needs operator retry", "The failed transfer is stopped for a safe operator retry."],
  mismatched: ["Refund under review", "The returned transaction does not match the prepared transfer."],
  late: ["Refund under review", "The transfer needs an operator timing review."],
  confirmed: ["Refund confirmed", "Your full commitment has been returned."],
  manual_review: ["Refund under review", "Pods operations is resolving this transfer safely."]
} satisfies Record<TransferLegState, readonly [string, string]>;

const currentStage = {
  queued: 0,
  prepared: 1,
  broadcast: 3,
  unknown: 3,
  retryable_failed: 3,
  mismatched: 3,
  late: 3,
  confirmed: 4,
  manual_review: 3
} satisfies Record<TransferLegState, number>;

const attentionStates: TransferLegState[] = [
  "retryable_failed",
  "mismatched",
  "late",
  "manual_review"
];

function nim(value: number) {
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(value)} NIM`;
}

export function RefundStatusRail({ refund }: { refund: ParticipantRefund }) {
  const router = useRouter();
  const [title, detail] = copy[refund.state];
  const stage = currentStage[refund.state];
  const attention = attentionStates.includes(refund.state);
  const completedThroughCurrent = refund.state === "confirmed";

  useEffect(() => {
    if (refund.state === "confirmed" || attention) return;
    const timer = window.setInterval(() => router.refresh(), 5_000);
    return () => window.clearInterval(timer);
  }, [attention, refund.state, router]);

  return (
    <section
      aria-labelledby="refund-title"
      className={styles.refundFlow}
      data-refund-rail=""
    >
      <div
        className={`${styles.refundHero} ${attention ? styles.refundAttention : ""} ${refund.state === "confirmed" ? styles.refundSuccess : ""}`}
        role={attention ? "alert" : "status"}
      >
        <div className={styles.refundHeroTop}>
          <div className={styles.nimMedallion} data-size="small">
            <Image alt="" aria-hidden="true" height={72} src="/media/nimiq-signet.svg" width={72} />
          </div>
          <span>{nim(refund.amountNim)}</span>
        </div>
        <span className={styles.eyebrow}>Full principal return</span>
        <h2 id="refund-title">{title}</h2>
        <p>{detail}</p>
        {refund.reason ? <div className={styles.refundReason}>{refund.reason}</div> : null}
        {attention ? (
          <div className={styles.refundSafety}>
            <WarningCircle aria-hidden="true" />
            <span>No second transfer is sent until this transaction is reconciled.</span>
          </div>
        ) : null}
      </div>
      <ol aria-label="Refund progress" className={styles.refundRail}>
        {["Queued", "Prepared", "Submitted", "Confirming", "Confirmed"].map((label, index) => {
          const relation = index < stage || (completedThroughCurrent && index === stage)
            ? "complete"
            : index === stage
              ? "current"
              : "upcoming";
          return (
            <li
              aria-current={relation === "current" ? "step" : undefined}
              className={`${styles.refundStep} is-${relation}`}
              data-state={relation}
              key={label}
            >
              <span aria-hidden="true">
                {relation === "complete" ? <><Check weight="bold" /><i className={styles.textCheck}>✓</i></> : relation === "current" ? <Clock weight="bold" /> : index + 1}
              </span>
              <strong>{label}</strong>
            </li>
          );
        })}
      </ol>
      <details className={styles.receipt} open={refund.state === "confirmed" || attention}>
        <summary>
          <span><small>Return receipt</small><strong>Transaction details</strong></span>
          <CaretDown aria-hidden="true" />
        </summary>
        <dl>
          <div><dt>Return amount</dt><dd>{nim(refund.amountNim)}</dd></div>
          {refund.transactionHash ? (
            <div className={styles.receiptWide}><dt>Transaction hash</dt><dd>{refund.transactionHash}</dd></div>
          ) : null}
          {refund.confirmedAt ? (
            <div className={styles.receiptWide}><dt>Confirmed</dt><dd>{formatZonedMoment(refund.confirmedAt, { timeZone: "UTC", includeYear: true, includeZone: true })}</dd></div>
          ) : null}
        </dl>
      </details>
    </section>
  );
}
