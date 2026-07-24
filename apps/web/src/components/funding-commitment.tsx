"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SettlementMode } from "@pods/domain";

import {
  createDepositIntent,
  recordDepositTransactionHint,
  recordDepositWalletAttempt
} from "../lib/funding-client";
import { sendNimCommitment } from "../lib/nimiq-wallet-client";

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

const outcomes = [
  ["Approved", "Slice returned", "Eligible", "Extends"],
  ["Timeout-protected", "Slice returned", "Not eligible", "Extends"],
  ["Rejected", "Provisionally forfeited", "Not eligible", "Breaks"],
  ["Missed", "Provisionally forfeited", "Not eligible", "Breaks"]
] as const;

export function FundingCommitment(props: {
  podId: string;
  contractHash: string;
  activityName: string;
  templateName: string;
  occurrenceCount: number;
  lunaPerOccurrence: number;
  totalLuna: number;
  settlementMode: SettlementMode;
  publicVisitorRoom?: boolean;
}) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const totalNim = nim(props.totalLuna);
  const isAlphaRefund = props.settlementMode === "full_refund_alpha";

  async function commit() {
    if (!accepted || working) return;
    setError("");
    setWorking(true);
    try {
      const intent = await createDepositIntent(props.podId, {
        contractHash: props.contractHash,
        settlementDisclosureAccepted: true
      });
      if (intent.state !== "intent_created") {
        router.push(`/pods/${props.podId}/fund/status?intent=${intent.id}`);
        router.refresh();
        return;
      }
      await recordDepositWalletAttempt(intent.id, "open");
      let transactionHash: string;
      try {
        transactionHash = await sendNimCommitment({
          recipient: intent.recipient,
          valueLuna: intent.amountLuna,
          reference: intent.reference
        });
      } catch (cause) {
        await recordDepositWalletAttempt(intent.id, "rejected").catch(() => undefined);
        throw cause;
      }
      await recordDepositTransactionHint(intent.id, transactionHash);
      router.push(`/pods/${props.podId}/fund/status?intent=${intent.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Commitment could not be started");
      setWorking(false);
    }
  }

  return (
    <div className="funding-flow">
      <section className="funding-contract-card entrance entrance-status">
        <div className="funding-contract-head">
          <div>
            <span>{props.templateName}</span>
            <h2>{props.activityName}</h2>
          </div>
          <i aria-hidden="true">NIM</i>
        </div>
        <div className="funding-total">
          <small>Total upfront commitment</small>
          <strong>{totalNim} NIM</strong>
          <p>{props.occurrenceCount} scheduled occurrences</p>
          <p>{nim(props.lunaPerOccurrence)} NIM per occurrence</p>
        </div>
        <div className="funding-risk">
          <span>{isAlphaRefund ? "Maximum temporary custody" : "Maximum amount at risk"}</span>
          <strong>{totalNim} NIM</strong>
          <p>{isAlphaRefund
            ? "The entire Testnet commitment is queued for return after roster lock. Activity outcomes cannot reduce it."
            : "Only rejected or missed occurrence slices are provisionally forfeited."}</p>
        </div>
      </section>

      {isAlphaRefund ? (
        <section className="funding-outcomes entrance entrance-templates" aria-labelledby="outcomes-title">
          <div className="section-title-row">
            <div><span>Phase 4 alpha contract</span><h2 id="outcomes-title">Full return, independent of outcome</h2></div>
          </div>
          <div className="outcome-compact alpha-return-outcomes">
            <div><span>Roster locks</span><b>Full return queued</b></div>
            <div><span>Activity review</span><b>Updates streak and record</b></div>
            <div><span>Redistribution</span><b>Disabled in this contract</b></div>
          </div>
          <p className="outcome-footnote">NIM on Testnet has no real-world value. This Pod cannot convert into a proportional or winner-funded contract after publication.</p>
        </section>
      ) : (
        <section className="funding-outcomes entrance entrance-templates" aria-labelledby="outcomes-title">
          <div className="section-title-row">
            <div><span>Financial outcomes</span><h2 id="outcomes-title">What each decision means</h2></div>
          </div>
          <div className="outcome-table-wrap">
            <table>
              <thead><tr><th>Decision</th><th>Your slice</th><th>Bonus</th><th>Streak</th></tr></thead>
              <tbody>
                {outcomes.map(([decision, slice, bonus, streak]) => (
                  <tr key={decision}>
                    <th data-label="Decision" scope="row">{decision}</th>
                    <td data-label="Your slice">{slice}</td>
                    <td data-label="Bonus">{bonus}</td>
                    <td data-label="Streak">{streak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="outcome-footnote">Provisional forfeitures are shared only among manually approved members for the same occurrence. If nobody is manually approved, each forfeited slice returns to its original owner.</p>
        </section>
      )}

      <section className="funding-disclosures entrance entrance-templates">
        {props.publicVisitorRoom ? (
          <div className="custody-disclosure visitor-funding-disclosure">
            <strong>Public visitor room</strong>
            <p>After roster lock, visitors can read the public room and explicitly public proof records. They cannot message, react, join activity, see creator-only evidence, or see financial details.</p>
          </div>
        ) : null}
        <div className="trust-disclosure">
          <span aria-hidden="true">01</span>
          <p>{isAlphaRefund
            ? "The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds."
            : "The Pod creator reviews member proofs. Approval and rejection can change how member stakes are redistributed. The creator does not fund this Pod or receive member funds. This Testnet MVP has no appeal or peer vote. Fund only if you trust the creator and accept these frozen rules."}</p>
        </div>
        <div className="trust-disclosure is-protection">
          <span aria-hidden="true">{isAlphaRefund ? "100%" : "24h"}</span>
          <p>{isAlphaRefund
            ? "Your complete Testnet commitment returns after roster lock. Review decisions affect progress only."
            : "If the creator does not review within 24 hours, your occurrence deposit is protected but is not eligible for a bonus."}</p>
        </div>
        <div className="custody-disclosure">
          <strong>Custodial testnet treasury</strong>
          <p>{isAlphaRefund
            ? "Your commitment is tracked in the participant ledger and returned by an idempotent worker after roster lock."
            : "Your full commitment is held in a shared Pods-controlled treasury and tracked in an off-chain participant ledger until roster lock and settlement."}</p>
        </div>
      </section>

      <label className="consent-row funding-consent">
        <input
          checked={accepted}
          onChange={(event) => setAccepted(event.currentTarget.checked)}
          type="checkbox"
        />
        <span>{isAlphaRefund
          ? "I accept the immutable full-return Testnet contract, creator review, custodial treasury, and maximum commitment shown above."
          : "I accept this contract hash, creator review, no-appeal rule, custodial treasury, and maximum commitment shown above."}</span>
      </label>
      {error ? <div className="inline-error funding-error" role="alert"><span>{error}</span></div> : null}
      <button
        className="primary-action full-action commit-nim-action"
        disabled={!accepted || working}
        onClick={commit}
        type="button"
      >
        {working ? "Opening Nimiq Pay" : `Commit ${totalNim} NIM`}
      </button>
      <Link className="secondary-action full-action" href={`/pods/${props.podId}/rules`}>Review frozen rules</Link>
      <Link className="quiet-link centered-link" href="/applications">Return to applications</Link>
    </div>
  );
}
