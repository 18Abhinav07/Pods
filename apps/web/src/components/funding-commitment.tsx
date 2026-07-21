"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  ["Grace", "Slice returned", "Not eligible", "Preserved"],
  ["Rejected", "Provisionally forfeited", "Not eligible", "Breaks"],
  ["Missed", "Provisionally forfeited", "Not eligible", "Breaks"]
] as const;

export function FundingCommitment(props: {
  podId: string;
  activityName: string;
  templateName: string;
  occurrenceCount: number;
  lunaPerOccurrence: number;
  totalLuna: number;
}) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const totalNim = nim(props.totalLuna);

  async function commit() {
    if (!accepted || working) return;
    setError("");
    setWorking(true);
    try {
      const intent = await createDepositIntent(props.podId);
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
          <span>Maximum amount at risk</span>
          <strong>{totalNim} NIM</strong>
          <p>Only rejected or missed occurrence slices are provisionally forfeited.</p>
        </div>
      </section>

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

      <section className="funding-disclosures entrance entrance-templates">
        <div className="trust-disclosure">
          <span aria-hidden="true">01</span>
          <p>Verification is performed by the Pods team. Pod creators and participants do not vote on evidence or financial outcomes.</p>
        </div>
        <div className="trust-disclosure is-protection">
          <span aria-hidden="true">24h</span>
          <p>If Pods does not review within 24 hours, your occurrence deposit is protected but is not eligible for a bonus.</p>
        </div>
        <div className="custody-disclosure">
          <strong>Custodial testnet treasury</strong>
          <p>Your full commitment is held in a shared Pods-controlled treasury and tracked in an off-chain participant ledger until roster lock and settlement.</p>
        </div>
      </section>

      <label className="consent-row funding-consent">
        <input
          checked={accepted}
          onChange={(event) => setAccepted(event.currentTarget.checked)}
          type="checkbox"
        />
        <span>I accept the frozen terms, centralized Pods-team verification, custodial treasury, and maximum commitment shown above.</span>
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
