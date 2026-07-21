"use client";

import type { TransferLegState } from "@pods/domain";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { formatZonedMoment } from "../lib/format-moment";

export type ParticipantRefund = {
  state: TransferLegState;
  amountNim: number;
  transactionHash: string | null;
  confirmedAt: string | null;
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
  broadcast: 2,
  unknown: 2,
  retryable_failed: 2,
  mismatched: 2,
  late: 2,
  confirmed: 3,
  manual_review: 2
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
    <section className={`refund-rail state-${refund.state}`} aria-labelledby="refund-title">
      <div className="refund-state" role={attention ? "alert" : "status"}>
        <span>Full principal return</span>
        <h2 id="refund-title">{title}</h2>
        <p>{detail}</p>
      </div>
      <ol aria-label="Refund progress">
        {["Queued", "Prepared", "Submitted", "Confirmed"].map((label, index) => {
          const relation = index < stage || (completedThroughCurrent && index === stage)
            ? "complete"
            : index === stage
              ? "current"
              : "upcoming";
          return (
            <li className={`is-${relation}`} key={label}>
              <span>{relation === "complete" ? "✓" : String(index + 1).padStart(2, "0")}</span>
              <strong>{label}</strong>
            </li>
          );
        })}
      </ol>
      <dl>
        <div><dt>Return amount</dt><dd>{nim(refund.amountNim)}</dd></div>
        {refund.transactionHash ? (
          <div className="refund-hash"><dt>Transaction hash</dt><dd>{refund.transactionHash}</dd></div>
        ) : null}
        {refund.confirmedAt ? (
          <div><dt>Confirmed</dt><dd>{formatZonedMoment(refund.confirmedAt, { timeZone: "UTC", includeYear: true, includeZone: true })}</dd></div>
        ) : null}
      </dl>
    </section>
  );
}
