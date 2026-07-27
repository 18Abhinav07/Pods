"use client";

import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  Check,
  ShieldCheck
} from "@phosphor-icons/react";
import Image from "next/image";
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
import styles from "./financial-flow.module.css";

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accepted, setAccepted] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [errorStage, setErrorStage] = useState<"setup" | "wallet">("wallet");
  const totalNim = nim(props.totalLuna);
  const isAlphaRefund = props.settlementMode === "full_refund_alpha";

  async function commit() {
    if (!accepted || working) return;
    let walletHandoffStarted = false;
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
        walletHandoffStarted = true;
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
      setErrorStage(walletHandoffStarted ? "wallet" : "setup");
      setError(cause instanceof Error ? cause.message : "Commitment could not be started");
      setWorking(false);
    }
  }

  return (
    <div className={styles.commitmentFlow} data-funding-step={step}>
      <nav aria-label="Funding steps" className={styles.fundingProgress}>
        <span>Step {step} of 3</span>
        <ol>
          {["Commitment", "Protection", "Wallet"].map((label, index) => {
            const ordinal = index + 1;
            const state = ordinal < step
              ? "complete"
              : ordinal === step
                ? "current"
                : "upcoming";
            return (
              <li
                aria-current={state === "current" ? "step" : undefined}
                data-state={state}
                key={label}
              >
                <i aria-hidden="true" />
                <small>{label}</small>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 1 ? (
        <section className={styles.commitmentHero}>
          <div className={styles.commitmentIdentity}>
            <div className={styles.nimMedallion}>
              <Image alt="NIM token" height={72} src="/media/nimiq-signet.svg" width={72} />
            </div>
            <div>
              <span className={styles.eyebrow}>{props.templateName}</span>
              <h2>{props.activityName}</h2>
            </div>
          </div>
          <div className={styles.commitmentAmount}>
            <small>Total commitment</small>
            <strong>{totalNim}<span>NIM</span></strong>
            <p>{isAlphaRefund ? "Returned after roster lock" : "Held until activity settlement"}</p>
          </div>
          <div className={styles.commitmentEquation} aria-label="Upfront commitment equation">
            <span>{props.occurrenceCount} × {nim(props.lunaPerOccurrence)} NIM</span>
            <i aria-hidden="true">=</i>
            <strong>{totalNim} NIM upfront</strong>
          </div>
          <div className={styles.riskSummary}>
            <span>
              <small>{isAlphaRefund ? "Maximum temporary custody" : "Maximum amount at risk"}</small>
              <strong>{totalNim} NIM</strong>
            </span>
            <p>{isAlphaRefund
              ? "The full Testnet commitment returns after roster lock."
              : "Only rejected or missed occurrence slices can be provisionally forfeited."}</p>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className={styles.protectionStep}>
          <header>
            <span className={styles.stepKicker}>Before money moves</span>
            <h2>Know what protects your commitment.</h2>
            <p>The frozen terms below cannot change after you fund.</p>
          </header>
          <div className={styles.commitmentFacts}>
            <p><strong>{props.occurrenceCount} scheduled occurrences</strong><span>Frozen when this Pod was published</span></p>
            <p><strong>{nim(props.lunaPerOccurrence)} NIM per occurrence</strong><span>{isAlphaRefund ? "Progress slice" : "Maximum provisional forfeiture"}</span></p>
          </div>
          <div className={styles.protectionHighlights}>
            <div>
              <ShieldCheck aria-hidden="true" weight="regular" />
              <span>
                <strong>{isAlphaRefund ? "Full return after roster lock" : "24 hour review protection"}</strong>
                <small>{isAlphaRefund
                  ? "Activity decisions change progress, not this Testnet return."
                  : "An unreviewed occurrence is protected and cannot fund a bonus."}</small>
              </span>
            </div>
            <div>
              <Check aria-hidden="true" weight="bold" />
              <span>
                <strong>Creator-reviewed proof</strong>
                <small>The Pod creator reviews evidence and never receives member funds.</small>
              </span>
            </div>
          </div>

          <details className={styles.mechanics}>
            <summary>
              <span><ShieldCheck aria-hidden="true" weight="regular" />How the financial contract works</span>
              <CaretDown aria-hidden="true" />
            </summary>
            <div className={styles.mechanicsBody}>
              {isAlphaRefund ? (
                <section aria-labelledby="outcomes-title">
                  <span className={styles.eyebrow}>Phase 4 alpha contract</span>
                  <h2 id="outcomes-title">Full return, independent of outcome</h2>
                  <div className={styles.outcomeCards}>
                    <div><span>Roster locks</span><b>Full return queued</b></div>
                    <div><span>Activity review</span><b>Updates streak and record</b></div>
                    <div><span>Redistribution</span><b>Disabled in this contract</b></div>
                  </div>
                  <p className={styles.mechanicsNote}>NIM on Testnet has no real-world value. This Pod cannot convert into a proportional or winner-funded contract after publication.</p>
                </section>
              ) : (
                <section aria-labelledby="outcomes-title">
                  <span className={styles.eyebrow}>Financial outcomes</span>
                  <h2 id="outcomes-title">What each decision means</h2>
                  <div className={styles.outcomeCards}>
                    {outcomes.map(([decision, slice, bonus, streak]) => (
                      <div key={decision}>
                        <b>{decision}</b>
                        <span>{slice}</span>
                        <small>{bonus} bonus · {streak} streak</small>
                      </div>
                    ))}
                  </div>
                  <p className={styles.mechanicsNote}>Provisional forfeitures are shared only among manually approved members for the same occurrence. If nobody is manually approved, each forfeited slice returns to its original owner.</p>
                </section>
              )}

              <div className={styles.disclosureStack}>
                {props.publicVisitorRoom ? (
                  <div>
                    <strong>Public visitor room</strong>
                    <p>After roster lock, visitors can read the public room and explicitly public proof records. They cannot message, react, join activity, see creator-only evidence, or see financial details.</p>
                  </div>
                ) : null}
                <div>
                  <strong>Creator review</strong>
                  <p>{isAlphaRefund
                    ? "The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds."
                    : "The Pod creator reviews member proofs. Approval and rejection can change how member stakes are redistributed. The creator does not fund this Pod or receive member funds. This Testnet MVP has no appeal or peer vote. Fund only if you trust the creator and accept these frozen rules."}</p>
                </div>
                <div>
                  <strong>{isAlphaRefund ? "Complete return" : "24 hour protection"}</strong>
                  <p>{isAlphaRefund
                    ? "Your complete Testnet commitment returns after roster lock. Review decisions affect progress only."
                    : "If the creator does not review within 24 hours, your occurrence deposit is protected but is not eligible for a bonus."}</p>
                </div>
                <div>
                  <strong>Custodial testnet treasury</strong>
                  <p>{isAlphaRefund
                    ? "Your commitment is tracked in the participant ledger and returned by an idempotent worker after roster lock."
                    : "Your full commitment is held in a shared Pods-controlled treasury and tracked in an off-chain participant ledger until roster lock and settlement."}</p>
                </div>
              </div>
            </div>
          </details>
        </section>
      ) : null}

      {step === 3 ? (
        <section className={styles.walletStep}>
          <header>
            <div className={styles.nimMedallion} data-size="small">
              <Image alt="" height={72} src="/media/nimiq-signet.svg" width={72} />
            </div>
            <span>
              <small>Wallet handoff</small>
              <strong>{totalNim} NIM</strong>
              <p>One approval in Nimiq Pay. Pods credits only finalized chain evidence.</p>
            </span>
          </header>
          <label className={styles.consent}>
            <input
              checked={accepted}
              onChange={(event) => setAccepted(event.currentTarget.checked)}
              type="checkbox"
            />
            <i aria-hidden="true"><Check weight="bold" /></i>
            <span>
              <strong>I understand this frozen contract</strong>
              <small>{isAlphaRefund
                ? "I accept the immutable full-return Testnet contract, creator review, custodial treasury, and maximum commitment shown above."
                : "I accept this contract hash, creator review, no-appeal rule, custodial treasury, and maximum commitment shown above."}</small>
            </span>
          </label>
          {error ? (
            <div className={`${styles.financialError} funding-error`} role="alert">
              <strong>{errorStage === "wallet" ? "Wallet handoff paused" : "Funding unavailable"}</strong>
              <span>{error}</span>
              <small>{errorStage === "wallet"
                ? "Keep this screen open and try again when Nimiq Pay is available."
                : "Your wallet was not opened or charged. Refresh this screen after funding is restored."}</small>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className={styles.actionDock} data-financial-action-dock>
        {step === 1 ? (
          <button
            className={styles.primaryAction}
            onClick={() => setStep(2)}
            type="button"
          >
            <span>Review protection</span>
            <i aria-hidden="true"><ArrowRight weight="bold" /></i>
          </button>
        ) : null}
        {step === 2 ? (
          <div className={styles.stepActions}>
            <button
              aria-label="Back to commitment"
              className={styles.backAction}
              onClick={() => setStep(1)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" weight="bold" />
            </button>
            <button
              className={styles.primaryAction}
              onClick={() => setStep(3)}
              type="button"
            >
              <span>Continue to wallet</span>
              <i aria-hidden="true"><ArrowRight weight="bold" /></i>
            </button>
          </div>
        ) : null}
        {step === 3 ? (
          <>
            <div className={styles.stepActions}>
              <button
                aria-label="Back to protection"
                className={styles.backAction}
                onClick={() => setStep(2)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" weight="bold" />
              </button>
              <button
                className={styles.primaryAction}
                disabled={!accepted || working}
                onClick={commit}
                type="button"
              >
                <span>{working ? "Opening Nimiq Pay" : `Commit ${totalNim} NIM`}</span>
                <i aria-hidden="true"><ArrowRight weight="bold" /></i>
              </button>
            </div>
            <div className={styles.actionLinks}>
              <Link href={`/pods/${props.podId}/rules`}>Review frozen rules</Link>
              <Link href="/applications">Return to applications</Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
