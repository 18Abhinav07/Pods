"use client";

import {
  ArrowLeft,
  Check,
  ChatCenteredText,
  ClipboardText,
  ClockCounterClockwise,
  DotsThree,
  Gavel,
  ShieldCheck,
  X
} from "@phosphor-icons/react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { createClientUuid } from "../lib/client-id";
import { formatZonedMoment } from "../lib/format-moment";
import type { ProofReviewView } from "../lib/proof-review-view";
import styles from "./activity-ritual/activity-ritual.module.css";
import { ProofRecordSection } from "./proof-record-section";
import { ProofVersionHistory } from "./proof-version-history";

type CreatorAction =
  | "approve"
  | "request_clarification"
  | "provisionally_reject"
  | "appeal_approve"
  | "appeal_reject"
  | "appeal_grace";

type InitialChoice = "approve" | "clarify" | "reject";
type AppealChoice = "approve" | "grace" | "reject";
type SheetView = "menu" | "history" | "record";

type ProofRecordData = {
  artifact: { label: string; href: string } | null;
  evidenceImageEndpoint: string | null;
  evidenceRows: Array<{ label: string; value: string }>;
  frozenCriterion: Array<{ label: string; value: string }>;
  templateName: string;
};

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

function EventLog({ events, styles: s }: { events: ProofReviewView["events"]; styles: typeof styles }) {
  if (events.length === 0) return <p className={s.proofSheetEmpty}>No review events yet.</p>;
  return (
    <ol className={s.proofCaseEvents}>
      {events.map((event) => (
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
  );
}

export function CreatorProofReviewLifecycle({
  endpoint,
  initial,
  proofRecord,
  timeZone,
  versionsEndpoint
}: {
  endpoint: string;
  initial: ProofReviewView;
  proofRecord?: ProofRecordData | null;
  timeZone: string;
  versionsEndpoint: string;
}) {
  const [review, setReview] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [initialChoice, setInitialChoice] = useState<InitialChoice | null>(null);
  const [appealChoice, setAppealChoice] = useState<AppealChoice | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [clarificationReason, setClarificationReason] = useState("");
  const [requestedChange, setRequestedChange] = useState("");
  const [reference, setReference] = useState("");
  const [rejectionCategory, setRejectionCategory] = useState("commitment_mismatch");
  const [rejectionReason, setRejectionReason] = useState("");
  const [unmetCriteria, setUnmetCriteria] = useState("");
  const [suggestedCorrection, setSuggestedCorrection] = useState("");
  const [appealFinalReason, setAppealFinalReason] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>("menu");
  const actionKeys = useRef(new Map<string, string>());
  const sheetTrigger = useRef<HTMLButtonElement>(null);
  const sheetDialog = useRef<HTMLElement>(null);

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

  function closeSheet() {
    setSheetOpen(false);
    setSheetView("menu");
  }

  useEffect(() => {
    if (!sheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    const triggerElement = sheetTrigger.current;
    document.body.style.overflow = "hidden";
    sheetDialog.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSheet();
        return;
      }
      if (event.key !== "Tab" || !sheetDialog.current) return;
      const focusable = Array.from(sheetDialog.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
      ));
      if (focusable.length === 0) {
        event.preventDefault();
        sheetDialog.current.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerElement?.focus();
    };
  }, [sheetOpen]);

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
      setInitialChoice(null);
      setAppealChoice(null);
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

  function confirmAppealReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void act("appeal_reject", { reason: appealFinalReason });
  }

  const reviewOpen = review.stage === "initial_review" || review.stage === "post_clarification_review";
  const deadline = formatZonedMoment(review.stageDeadlineAt, { timeZone, includeZone: true });
  const absoluteDeadline = formatZonedMoment(review.absoluteDeadlineAt, { timeZone, includeZone: true });

  const stageTitle = review.stage === "appeal_review"
    ? "Resolve the appeal"
    : review.stage === "resolved"
      ? "Review closed"
      : reviewOpen
        ? "Choose the next fair action"
        : "Waiting on the participant";

  const lastEvent = review.events.at(-1) ?? null;
  const lastEventNote = lastEvent
    ? eventText(lastEvent.payload, "reason")
      ?? eventText(lastEvent.payload, "note")
      ?? eventText(lastEvent.payload, "requestedChange")
    : null;

  const sheetTitle = sheetView === "history" ? "Review history" : sheetView === "record" ? "Proof record" : "More on this proof";

  return (
    <section className={styles.creatorProofCase} data-creator-proof-case data-stage={review.stage}>
      <header className={styles.proofCaseHeader}>
        <span className={styles.proofCaseIcon} aria-hidden="true">
          {review.stage === "resolved" ? <Check size={24} weight="bold" /> : <Gavel size={24} weight="fill" />}
        </span>
        <div>
          <small>Proof reconciliation</small>
          <h2>{stageTitle}</h2>
          <p>{review.stage === "resolved" ? `Final outcome: ${review.resolution}` : `Window closes ${deadline}`}</p>
        </div>
        <button
          aria-expanded={sheetOpen}
          aria-label="More on this proof"
          className={styles.proofCaseMenuTrigger}
          onClick={() => setSheetOpen(true)}
          ref={sheetTrigger}
          type="button"
        >
          <DotsThree aria-hidden="true" size={22} weight="bold" />
        </button>
      </header>

      {lastEvent ? (
        <div className={styles.proofCaseLatest}>
          <span>Latest &middot; {lastEvent.actor === "participant" ? "Participant" : lastEvent.actor === "creator" ? "You" : "Pods"}</span>
          <p>
            {eventLabel[lastEvent.type] ?? lastEvent.type}
            {lastEventNote ? `: ${lastEventNote}` : ""}
          </p>
        </div>
      ) : null}

      {review.stage === "awaiting_clarification" ? (
        <aside className={styles.proofCaseNotice}>
          <ChatCenteredText aria-hidden="true" size={22} />
          <p>The participant can send one clarification until {deadline}. If they do not, the case moves to the appeal decision point.</p>
        </aside>
      ) : null}
      {review.stage === "appeal_open" ? (
        <aside className={styles.proofCaseNotice}>
          <ShieldCheck aria-hidden="true" size={22} />
          <p>The participant may appeal or accept the rejection until {deadline}. Their Pod-room comments are context only and cannot change this case.</p>
        </aside>
      ) : null}

      {reviewOpen ? (
        initialChoice === null ? (
          <nav aria-label="Review decision" className={styles.creatorChoicePicker}>
            <button className={styles.creatorChoiceChip} data-tone="approve" onClick={() => setInitialChoice("approve")} type="button">
              <Check aria-hidden="true" size={20} weight="bold" />
              <span><strong>Approve</strong><small>Matches the frozen commitment</small></span>
            </button>
            {!review.clarificationUsed ? (
              <button className={styles.creatorChoiceChip} data-tone="clarify" onClick={() => setInitialChoice("clarify")} type="button">
                <ChatCenteredText aria-hidden="true" size={20} weight="bold" />
                <span><strong>Ask for clarification</strong><small>One question, before deciding</small></span>
              </button>
            ) : null}
            <button className={styles.creatorChoiceChip} data-tone="reject" onClick={() => setInitialChoice("reject")} type="button">
              <X aria-hidden="true" size={20} weight="bold" />
              <span><strong>Reject</strong><small>Opens one appeal window</small></span>
            </button>
          </nav>
        ) : (
          <div className={styles.creatorActionCard}>
            <button className={styles.creatorChoiceBack} onClick={() => setInitialChoice(null)} type="button">
              <ArrowLeft aria-hidden="true" size={15} weight="bold" />
              Change decision
            </button>

            {initialChoice === "approve" ? (
              <>
                <h3>Approve this proof</h3>
                <textarea aria-label="Private approval note" maxLength={500} placeholder="Optional private note" rows={2} value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} />
                <button className={styles.primaryAction} disabled={busy} onClick={() => void act("approve", { note: approvalNote })} type="button">Approve proof</button>
              </>
            ) : null}

            {initialChoice === "clarify" ? (
              <form onSubmit={requestClarification}>
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

            {initialChoice === "reject" ? (
              <form onSubmit={reject}>
                <h3>Propose rejection</h3>
                <p className={styles.creatorActionHint}>This opens one appeal window for the participant. It is not final yet.</p>
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
                <button className={styles.confirmReject} disabled={busy} type="submit">Send provisional rejection</button>
              </form>
            ) : null}
          </div>
        )
      ) : null}

      {review.stage === "appeal_review" ? (
        appealChoice === null ? (
          <nav aria-label="Appeal decision" className={styles.creatorChoicePicker}>
            <button className={styles.creatorChoiceChip} data-tone="approve" onClick={() => setAppealChoice("approve")} type="button">
              <Check aria-hidden="true" size={20} weight="bold" />
              <span><strong>Approve after appeal</strong><small>The appeal evidence resolves it</small></span>
            </button>
            <button className={styles.creatorChoiceChip} data-tone="grace" onClick={() => setAppealChoice("grace")} type="button">
              <ShieldCheck aria-hidden="true" size={20} weight="bold" />
              <span><strong>Return principal with grace</strong><small>No bonus, no penalty, case closes</small></span>
            </button>
            <button className={styles.creatorChoiceChip} data-tone="reject" onClick={() => setAppealChoice("reject")} type="button">
              <X aria-hidden="true" size={20} weight="bold" />
              <span><strong>Confirm rejection</strong><small>Final, the appeal did not hold up</small></span>
            </button>
          </nav>
        ) : (
          <div className={styles.creatorActionCard}>
            <button className={styles.creatorChoiceBack} onClick={() => setAppealChoice(null)} type="button">
              <ArrowLeft aria-hidden="true" size={15} weight="bold" />
              Change decision
            </button>

            {appealChoice === "approve" ? (
              <>
                <h3>Approve after appeal</h3>
                <p className={styles.creatorActionHint}>The proof is approved and the appeal evidence resolves the case.</p>
                <button className={styles.primaryAction} disabled={busy} onClick={() => void act("appeal_approve", { note: "Appeal evidence now meets the locked commitment." })} type="button">Confirm approval</button>
              </>
            ) : null}

            {appealChoice === "grace" ? (
              <>
                <h3>Return principal with grace</h3>
                <p className={styles.creatorActionHint}>Principal returns without a bonus or streak effect. The case closes as neutral.</p>
                <button className={styles.secondaryAction} disabled={busy} onClick={() => void act("appeal_grace", { note: "The available evidence does not support a reliable binary outcome, so principal returns without a bonus or streak effect." })} type="button">Confirm grace</button>
              </>
            ) : null}

            {appealChoice === "reject" ? (
              <form onSubmit={confirmAppealReject}>
                <h3>Confirm rejection</h3>
                <label htmlFor="appeal-final-reason">Final rejection reason</label>
                <textarea id="appeal-final-reason" minLength={20} maxLength={1200} required rows={4} value={appealFinalReason} onChange={(event) => setAppealFinalReason(event.target.value)} />
                <button className={styles.confirmReject} disabled={busy} type="submit">Confirm rejection</button>
              </form>
            ) : null}
          </div>
        )
      ) : null}

      {review.stage === "resolved" ? (
        <aside className={styles.proofCaseNotice}>
          <Check aria-hidden="true" size={22} />
          <p>This case is closed. The case could not remain open beyond {absoluteDeadline}.</p>
        </aside>
      ) : null}

      {error ? <p className={styles.formError} role="alert">{error}</p> : null}

      {sheetOpen ? createPortal(
        <div className={styles.proofSheetLayer}>
          <button
            aria-hidden="true"
            className={styles.proofSheetBackdrop}
            onClick={closeSheet}
            tabIndex={-1}
            type="button"
          />
          <section
            aria-label={sheetTitle}
            aria-modal="true"
            className={styles.proofSheetDialog}
            ref={sheetDialog}
            role="dialog"
            tabIndex={-1}
          >
            <header className={styles.proofSheetHeader}>
              {sheetView === "menu" ? (
                <span>
                  <small>Proof reconciliation</small>
                  <strong>{sheetTitle}</strong>
                </span>
              ) : (
                <button aria-label="Back" onClick={() => setSheetView("menu")} type="button">
                  <ArrowLeft aria-hidden="true" size={19} weight="bold" />
                </button>
              )}
              {sheetView !== "menu" ? <strong>{sheetTitle}</strong> : null}
              <button aria-label="Close" onClick={closeSheet} type="button">
                <X aria-hidden="true" size={19} weight="bold" />
              </button>
            </header>

            {sheetView === "menu" ? (
              <div className={styles.proofSheetBody}>
                <nav aria-label="Proof options" className={styles.proofSheetMenu}>
                  <button onClick={() => setSheetView("history")} type="button">
                    <i aria-hidden="true"><ClockCounterClockwise size={20} weight="bold" /></i>
                    <span>
                      <strong>Review history</strong>
                      <small>{review.events.length} {review.events.length === 1 ? "event" : "events"} &middot; immutable evidence</small>
                    </span>
                  </button>
                  {proofRecord ? (
                    <button onClick={() => setSheetView("record")} type="button">
                      <i aria-hidden="true"><ClipboardText size={20} weight="bold" /></i>
                      <span>
                        <strong>Proof record</strong>
                        <small>Locked commitment and what was submitted</small>
                      </span>
                    </button>
                  ) : null}
                </nav>
              </div>
            ) : null}

            {sheetView === "history" ? (
              <div className={styles.proofSheetBody}>
                <ProofVersionHistory endpoint={versionsEndpoint} versions={review.versions} />
                <EventLog events={review.events} styles={styles} />
              </div>
            ) : null}

            {sheetView === "record" && proofRecord ? (
              <div className={styles.proofSheetBody}>
                <ProofRecordSection
                  artifact={proofRecord.artifact}
                  evidenceImageEndpoint={proofRecord.evidenceImageEndpoint}
                  evidenceRows={proofRecord.evidenceRows}
                  frozenCriterion={proofRecord.frozenCriterion}
                  templateName={proofRecord.templateName}
                />
              </div>
            ) : null}
          </section>
        </div>,
        document.body
      ) : null}
    </section>
  );
}
