"use client";

import { Check, ChatCenteredText, ShieldCheck, X } from "@phosphor-icons/react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { createClientUuid } from "../lib/client-id";
import { formatZonedMoment } from "../lib/format-moment";
import type { ProofReviewView } from "../lib/proof-review-view";
import styles from "./activity-ritual/activity-ritual.module.css";
import { ProofVersionHistory } from "./proof-version-history";

type CreatorAction =
  | "approve"
  | "request_clarification"
  | "provisionally_reject"
  | "appeal_approve"
  | "appeal_reject"
  | "appeal_grace";

const eventLabel: Record<string, string> = {
  request_clarification: "Clarification requested",
  respond_clarification: "Participant responded",
  provisionally_reject: "Provisional rejection sent",
  open_appeal: "Participant appealed",
  approve: "Proof approved",
  appeal_approve: "Appeal approved",
  appeal_reject: "Appeal rejected",
  appeal_grace: "Grace applied",
  accept_rejection: "Participant accepted rejection",
  review_timeout: "Review protection applied",
  clarification_timeout: "Clarification window closed",
  appeal_window_timeout: "Appeal window closed",
  appeal_review_timeout: "Appeal timed out to grace",
  absolute_timeout: "Absolute review cap reached"
};

function eventText(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function CreatorProofReviewLifecycle({
  endpoint,
  initial,
  timeZone
}: {
  endpoint: string;
  initial: ProofReviewView;
  timeZone: string;
}) {
  const [review, setReview] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [clarificationReason, setClarificationReason] = useState("");
  const [requestedChange, setRequestedChange] = useState("");
  const [reference, setReference] = useState("");
  const [rejectionCategory, setRejectionCategory] = useState("commitment_mismatch");
  const [rejectionReason, setRejectionReason] = useState("");
  const [unmetCriteria, setUnmetCriteria] = useState("");
  const [suggestedCorrection, setSuggestedCorrection] = useState("");
  const actionKeys = useRef(new Map<string, string>());

  const refresh = useCallback(async () => {
    const response = await fetch(endpoint, { cache: "no-store" });
    const body = await response.json() as { review?: ProofReviewView };
    if (response.ok && body.review) setReview(body.review);
  }, [endpoint]);

  useEffect(() => {
    if (review.stage === "resolved") return;
    const timer = window.setInterval(() => void refresh(), 3_000);
    return () => window.clearInterval(timer);
  }, [refresh, review.stage]);

  async function act(action: CreatorAction, payload: Record<string, unknown>) {
    if (busy) return;
    const idempotencyKey = actionKeys.current.get(action) ?? createClientUuid();
    actionKeys.current.set(action, idempotencyKey);
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, idempotencyKey, ...payload })
      });
      const body = await response.json() as { review?: ProofReviewView; error?: string };
      if (!response.ok || !body.review) throw new Error(body.error ?? "Review action failed");
      actionKeys.current.delete(action);
      setReview(body.review);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review action failed");
    } finally {
      setBusy(false);
    }
  }

  function requestClarification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void act("request_clarification", {
      reason: clarificationReason,
      requestedChange,
      reference
    });
  }

  function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void act("provisionally_reject", {
      category: rejectionCategory,
      reason: rejectionReason,
      unmetCriteria: unmetCriteria.split("\n").map((value) => value.trim()).filter(Boolean),
      suggestedCorrection
    });
  }

  const reviewOpen = review.stage === "initial_review" || review.stage === "post_clarification_review";
  const deadline = formatZonedMoment(review.stageDeadlineAt, { timeZone, includeZone: true });

  return (
    <section className={styles.creatorProofCase} data-creator-proof-case data-stage={review.stage}>
      <header className={styles.decisionHeading}>
        <span>Proof reconciliation</span>
        <h2>{review.stage === "appeal_review" ? "Resolve the appeal" : review.stage === "resolved" ? "Review closed" : reviewOpen ? "Choose the next fair action" : "Waiting on the participant"}</h2>
        <p>{review.stage === "resolved" ? `Final outcome: ${review.resolution}` : `Current window closes ${deadline}. The case cannot remain open beyond ${formatZonedMoment(review.absoluteDeadlineAt, { timeZone, includeZone: true })}.`}</p>
      </header>

      <ProofVersionHistory endpoint={endpoint} versions={review.versions} />

      {review.events.length > 0 ? (
        <details className={styles.proofCaseHistory} open>
          <summary>Review thread</summary>
          <ol>
            {review.events.map((event) => (
              <li key={event.sequence}>
                <span>{event.actor === "participant" ? "Participant" : event.actor === "creator" ? "You" : "Pods"}</span>
                <strong>{eventLabel[event.type] ?? event.type}</strong>
                {eventText(event.payload, "reason") ? <p>{eventText(event.payload, "reason")}</p> : null}
                {eventText(event.payload, "requestedChange") ? <p><b>Requested change</b>{eventText(event.payload, "requestedChange")}</p> : null}
                {eventText(event.payload, "reference") ? <p><b>Reference</b>{eventText(event.payload, "reference")}</p> : null}
                {eventText(event.payload, "category") ? <p><b>Reason type</b>{eventText(event.payload, "category")?.replaceAll("_", " ")}</p> : null}
                {Array.isArray(event.payload.unmetCriteria) ? (
                  <ul>{event.payload.unmetCriteria.map((criterion) => <li key={String(criterion)}>{String(criterion)}</li>)}</ul>
                ) : null}
                {eventText(event.payload, "suggestedCorrection") ? <p><b>Suggested correction</b>{eventText(event.payload, "suggestedCorrection")}</p> : null}
                {eventText(event.payload, "note") ? <p>{eventText(event.payload, "note")}</p> : null}
                {eventText(event.payload, "artifactUrl") ? (
                  <a href={eventText(event.payload, "artifactUrl") ?? undefined} rel="noreferrer" target="_blank">Open supporting artifact</a>
                ) : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      {reviewOpen ? (
        <div className={styles.creatorReviewActions}>
          <section className={styles.creatorActionCard}>
            <Check aria-hidden="true" size={22} />
            <h3>Approve</h3>
            <p>The proof matches the frozen commitment.</p>
            <textarea aria-label="Private approval note" maxLength={500} placeholder="Optional private note" rows={2} value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} />
            <button className={styles.primaryAction} disabled={busy} onClick={() => void act("approve", { note: approvalNote })} type="button">Approve proof</button>
          </section>

          {!review.clarificationUsed ? (
            <form className={styles.creatorActionCard} onSubmit={requestClarification}>
              <ChatCenteredText aria-hidden="true" size={22} />
              <h3>Ask once for clarification</h3>
              <label htmlFor="clarification-reason">Why it is needed</label>
              <textarea id="clarification-reason" minLength={20} maxLength={1200} required rows={3} value={clarificationReason} onChange={(event) => setClarificationReason(event.target.value)} />
              <label htmlFor="requested-change">Exact change requested</label>
              <textarea id="requested-change" minLength={20} maxLength={1200} required rows={3} value={requestedChange} onChange={(event) => setRequestedChange(event.target.value)} />
              <label htmlFor="clarification-reference">Criterion or reference <span>Optional</span></label>
              <input id="clarification-reference" maxLength={500} value={reference} onChange={(event) => setReference(event.target.value)} />
              <button className={styles.secondaryAction} disabled={busy} type="submit">Request clarification</button>
            </form>
          ) : null}

          <form className={styles.creatorActionCard} onSubmit={reject}>
            <X aria-hidden="true" size={22} />
            <h3>Propose rejection</h3>
            <p>This opens one appeal window for the participant. It is not final yet.</p>
            <label htmlFor="rejection-category">Reason category</label>
            <select id="rejection-category" value={rejectionCategory} onChange={(event) => setRejectionCategory(event.target.value)}>
              <option value="evidence_missing">Evidence missing</option>
              <option value="commitment_mismatch">Commitment mismatch</option>
              <option value="artifact_unverifiable">Artifact cannot be verified</option>
              <option value="insufficient_detail">Insufficient detail</option>
              <option value="other">Other</option>
            </select>
            <label htmlFor="rejection-reason">Detailed reason</label>
            <textarea id="rejection-reason" minLength={20} maxLength={1200} required rows={4} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
            <label htmlFor="unmet-criteria">Unmet criteria <span>One per line</span></label>
            <textarea id="unmet-criteria" minLength={3} maxLength={1200} required rows={3} value={unmetCriteria} onChange={(event) => setUnmetCriteria(event.target.value)} />
            <label htmlFor="suggested-correction">Suggested correction <span>Optional</span></label>
            <textarea id="suggested-correction" maxLength={1200} rows={3} value={suggestedCorrection} onChange={(event) => setSuggestedCorrection(event.target.value)} />
            <button className={styles.rejectTrigger} disabled={busy} type="submit">Send provisional rejection</button>
          </form>
        </div>
      ) : null}

      {review.stage === "awaiting_clarification" ? <aside className={styles.proofCaseNotice}><ChatCenteredText size={22} /><p>The participant can send one clarification until {deadline}. If they do not, the case moves to the appeal decision point.</p></aside> : null}
      {review.stage === "appeal_open" ? <aside className={styles.proofCaseNotice}><ShieldCheck size={22} /><p>The participant may appeal or accept the rejection until {deadline}. Their Pod-room comments are context only and cannot change this case.</p></aside> : null}

      {review.stage === "appeal_review" ? (
        <div className={styles.appealResolutionActions}>
          <button className={styles.primaryAction} disabled={busy} onClick={() => void act("appeal_approve", { note: "Appeal evidence now meets the locked commitment." })} type="button">Approve after appeal</button>
          <button className={styles.secondaryAction} disabled={busy} onClick={() => void act("appeal_grace", { note: "The available evidence does not support a reliable binary outcome, so principal returns without a bonus or streak effect." })} type="button">Return principal with grace</button>
          <form onSubmit={(event) => { event.preventDefault(); void act("appeal_reject", { reason: rejectionReason }); }}>
            <label htmlFor="appeal-final-reason">Final rejection reason</label>
            <textarea id="appeal-final-reason" minLength={20} maxLength={1200} required rows={4} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
            <button className={styles.rejectTrigger} disabled={busy} type="submit">Confirm rejection</button>
          </form>
        </div>
      ) : null}

      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
    </section>
  );
}
