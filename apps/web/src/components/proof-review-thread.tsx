"use client";

import {
  ArrowClockwise,
  ArrowLeft,
  CheckCircle,
  ChatCircleDots,
  ClipboardText,
  ClockCounterClockwise,
  DotsThree,
  Paperclip,
  ShieldCheck,
  WarningCircle,
  X
} from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { createClientUuid } from "../lib/client-id";
import { formatZonedMoment } from "../lib/format-moment";
import type { ProofReviewView } from "../lib/proof-review-view";
import styles from "./activity-ritual/activity-ritual.module.css";
import { ProofRecordSection } from "./proof-record-section";
import { ProofVersionHistory } from "./proof-version-history";

const eventLabels: Record<string, string> = {
  approve: "Proof approved",
  request_clarification: "Creator requested clarification",
  respond_clarification: "Clarification sent",
  provisionally_reject: "Creator proposed rejection",
  open_appeal: "Appeal opened",
  accept_rejection: "Rejection accepted",
  appeal_approve: "Appeal approved",
  appeal_reject: "Appeal rejected",
  appeal_grace: "Appeal closed with grace",
  review_timeout: "Review protection applied",
  clarification_timeout: "Clarification window closed",
  appeal_window_timeout: "Appeal window closed",
  appeal_review_timeout: "Appeal resolved with grace",
  absolute_timeout: "Review cap reached"
};

type ProofRecordData = {
  artifact: { label: string; href: string } | null;
  evidenceImageEndpoint: string | null;
  evidenceRows: Array<{ label: string; value: string }>;
  frozenCriterion: Array<{ label: string; value: string }>;
  templateName: string;
};

type SheetView = "menu" | "history" | "record";

function text(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function ActionError({ value }: { value: string }) {
  return value ? <p className={styles.formError} role="alert">{value}</p> : null;
}

function FileField({
  file,
  hint,
  id,
  label,
  onChange
}: {
  file: File | null;
  hint: string;
  id: string;
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className={styles.proofFileField}>
      <span>{label} <small>{hint}</small></span>
      <label htmlFor={id}>
        <Paperclip aria-hidden="true" size={16} />
        <span>{file ? file.name : "Attach image"}</span>
      </label>
      {file ? (
        <button
          className={styles.proofFileClear}
          onClick={() => onChange(null)}
          type="button"
        >
          <X aria-hidden="true" size={13} weight="bold" />
          Remove attachment
        </button>
      ) : null}
      <input
        accept="image/jpeg,image/png,image/heic,image/avif,image/webp"
        className="proof-file-input"
        id={id}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        type="file"
      />
    </div>
  );
}

export function ProofReviewThread({
  endpoint,
  initial,
  podId,
  proofRecord,
  recoveryMode,
  reviewerName,
  submissionId,
  timeZone
}: {
  endpoint: string;
  initial: ProofReviewView;
  podId: string;
  proofRecord?: ProofRecordData | null;
  recoveryMode: "linked" | "next_occurrence" | "unavailable";
  reviewerName?: string | null;
  submissionId: string;
  timeZone: string;
}) {
  const [review, setReview] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clarification, setClarification] = useState("");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [clarificationImage, setClarificationImage] = useState<File | null>(null);
  const [appeal, setAppeal] = useState("");
  const [appealArtifactUrl, setAppealArtifactUrl] = useState("");
  const [appealImage, setAppealImage] = useState<File | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>("menu");
  const actionKeys = useRef(new Map<string, string>());
  const sheetTrigger = useRef<HTMLButtonElement>(null);
  const sheetDialog = useRef<HTMLElement>(null);

  const reconcile = useCallback(async () => {
    const response = await fetch(endpoint, { cache: "no-store" });
    const body = await response.json() as { review?: ProofReviewView };
    if (response.ok && body.review) setReview(body.review);
  }, [endpoint]);

  useEffect(() => {
    if (review.stage === "resolved") return;
    const timer = window.setInterval(() => void reconcile(), 3_000);
    const visible = () => {
      if (document.visibilityState === "visible") void reconcile();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [reconcile, review.stage]);

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

  async function act(
    action: string,
    payload: Record<string, unknown> = {},
    evidenceImage: File | null = null
  ) {
    if (busy) return;
    const idempotencyKey = actionKeys.current.get(action) ?? createClientUuid();
    actionKeys.current.set(action, idempotencyKey);
    setBusy(true);
    setError("");
    try {
      const response = evidenceImage
        ? await fetch(endpoint, {
            method: "POST",
            body: (() => {
              const form = new FormData();
              form.set("action", action);
              form.set("idempotencyKey", idempotencyKey);
              for (const [key, value] of Object.entries(payload)) {
                if (typeof value === "string" && value) form.set(key, value);
              }
              form.set("image", evidenceImage);
              return form;
            })()
          })
        : await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, idempotencyKey, ...payload })
          });
      const body = await response.json() as { review?: ProofReviewView; error?: string };
      if (!response.ok || !body.review) {
        throw new Error(body.error ?? "Proof review could not be updated");
      }
      actionKeys.current.delete(action);
      setReview(body.review);
      if (action === "respond_clarification") setClarificationImage(null);
      if (action === "open_appeal") setAppealImage(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Proof review could not be updated");
    } finally {
      setBusy(false);
    }
  }

  function respond(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void act("respond_clarification", {
      note: clarification,
      artifactUrl: artifactUrl.trim() || null
    }, clarificationImage);
  }

  function appealRejection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void act("open_appeal", {
      reason: appeal,
      artifactUrl: appealArtifactUrl.trim() || null
    }, appealImage);
  }

  const stageDeadline = formatZonedMoment(review.stageDeadlineAt, {
    timeZone,
    includeZone: true
  });
  const deadlineLabel = review.stage === "resolved"
    ? "Review closed"
    : review.stage === "awaiting_clarification" || review.stage === "appeal_open"
      ? `Respond by ${stageDeadline}`
      : review.stage === "appeal_review"
        ? `Appeal decision due ${stageDeadline}`
        : `Creator decision due ${stageDeadline}`;

  const lastEvent = review.events.at(-1) ?? null;
  const lastEventActorLabel = lastEvent
    ? lastEvent.actor === "creator"
      ? (reviewerName ?? "Creator")
      : lastEvent.actor === "participant"
        ? "You"
        : "Pods"
    : null;
  const lastEventNote = lastEvent
    ? text(lastEvent.payload, "reason")
      ?? text(lastEvent.payload, "note")
      ?? text(lastEvent.payload, "requestedChange")
    : null;

  const sheetTitle = sheetView === "history" ? "Review history" : sheetView === "record" ? "Proof record" : "More on this proof";

  return (
    <section className={styles.proofCase} data-proof-case data-stage={review.stage}>
      <header className={styles.proofCaseHeader}>
        <span className={styles.proofCaseIcon} aria-hidden="true">
          {review.stage === "resolved" ? <CheckCircle size={24} weight="fill" /> : <ChatCircleDots size={24} weight="fill" />}
        </span>
        <div>
          <small>Private review thread</small>
          <h2>{review.stage === "appeal_open" ? "Your decision point" : review.stage === "appeal_review" ? "Appeal under review" : review.stage === "awaiting_clarification" ? "Clarification needed" : review.stage === "resolved" ? "Review resolved" : "Review in progress"}</h2>
          <p>{deadlineLabel}</p>
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
          <span>Latest &middot; {lastEventActorLabel}</span>
          <p>
            {eventLabels[lastEvent.type] ?? lastEvent.type}
            {lastEventNote ? `: ${lastEventNote}` : ""}
          </p>
        </div>
      ) : null}

      {review.stage !== "awaiting_clarification" &&
      review.stage !== "appeal_open" &&
      review.stage !== "appeal_review" &&
      review.stage !== "resolved" ? (
        <aside className={styles.proofCaseNotice}>
          <ChatCircleDots aria-hidden="true" size={22} />
          <p>Your creator is reviewing this proof. You will be notified here as soon as there is an update.</p>
        </aside>
      ) : null}

      {review.stage === "awaiting_clarification" ? (
        <form className={styles.proofCaseAction} onSubmit={respond}>
          <label htmlFor="clarification-note">Explain what changed</label>
          <textarea id="clarification-note" minLength={20} maxLength={1200} required rows={4} value={clarification} onChange={(event) => setClarification(event.target.value)} />
          <label htmlFor="clarification-artifact">Updated HTTPS artifact <span>Optional</span></label>
          <input id="clarification-artifact" inputMode="url" type="url" value={artifactUrl} onChange={(event) => setArtifactUrl(event.target.value)} />
          <FileField
            file={clarificationImage}
            hint="Optional and private"
            id="clarification-image"
            label="Replacement image"
            onChange={setClarificationImage}
          />
          <button className={styles.primaryAction} disabled={busy} type="submit">Send clarification</button>
        </form>
      ) : null}

      {review.stage === "appeal_open" ? (
        <div className={styles.appealChoice}>
          <div className={styles.appealDisclosure}>
            <WarningCircle aria-hidden="true" size={22} />
            <p>The same Pod creator reconsiders your proof on Testnet. A different reviewer is not guaranteed.</p>
          </div>
          <form className={styles.proofCaseAction} onSubmit={appealRejection}>
            <label htmlFor="appeal-reason">Why should this decision change?</label>
            <textarea id="appeal-reason" minLength={20} maxLength={1200} required rows={4} value={appeal} onChange={(event) => setAppeal(event.target.value)} />
            <label htmlFor="appeal-artifact">Supporting HTTPS artifact <span>Optional</span></label>
            <input id="appeal-artifact" inputMode="url" type="url" value={appealArtifactUrl} onChange={(event) => setAppealArtifactUrl(event.target.value)} />
            <FileField
              file={appealImage}
              hint="Optional and private"
              id="appeal-image"
              label="Supporting image"
              onChange={setAppealImage}
            />
            <button className={styles.primaryAction} disabled={busy} type="submit">Submit one appeal</button>
          </form>
          <button className={styles.secondaryAction} disabled={busy} onClick={() => void act("accept_rejection")} type="button">Accept rejection</button>
        </div>
      ) : null}

      {review.stage === "appeal_review" ? (
        <aside className={styles.proofCaseNotice}>
          <ArrowClockwise aria-hidden="true" size={22} />
          <p>Your appeal is frozen. If the creator does not resolve it by the deadline, grace returns your principal without a bonus or streak effect.</p>
        </aside>
      ) : null}

      {(review.stage === "appeal_open" || review.stage === "appeal_review" || (review.stage === "resolved" && review.resolution === "rejected")) ? (
        <aside className={styles.proofCaseShare}>
          <div><strong>Want perspective from your Pod?</strong><p>Share the rejection reason and unmet criteria with locked members. Their replies are advisory and cannot change the final creator decision.</p></div>
          {review.sharedWithPodAt ? <span>Shared with Pod</span> : <button className={styles.secondaryAction} disabled={busy} onClick={() => void act("share_with_pod")} type="button">Share review context</button>}
        </aside>
      ) : null}

      {review.stage === "resolved" && review.resolution === "rejected" ? (
        <aside className={styles.proofCaseRecovery}>
          <ShieldCheck aria-hidden="true" size={22} />
          {recoveryMode === "linked" ? (
            <>
              <div><strong>Continue with corrected work</strong><p>This result stays immutable. Start a linked recovery commitment in a later occurrence.</p></div>
              <Link href={`/pods/${podId}/submissions/${submissionId}/recover`}>Start recovery</Link>
            </>
          ) : recoveryMode === "next_occurrence" ? (
            <>
              <div><strong>Continue at the next occurrence</strong><p>This result stays immutable. Your next scheduled occurrence is a fresh chance to submit valid proof.</p></div>
              <Link href="/today">View next activity</Link>
            </>
          ) : (
            <>
              <div><strong>No later recovery slot is available</strong><p>This result stays immutable. Return to the Pod room to discuss next steps with the creator.</p></div>
              <Link href={`/pods/${podId}/room`}>Return to Pod room</Link>
            </>
          )}
        </aside>
      ) : null}

      <ActionError value={error} />

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
                  <small>Private review thread</small>
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
                        <small>What you promised and submitted</small>
                      </span>
                    </button>
                  ) : null}
                </nav>
              </div>
            ) : null}

            {sheetView === "history" ? (
              <div className={styles.proofSheetBody}>
                <ProofVersionHistory endpoint={endpoint} versions={review.versions} />
                {review.events.length > 0 ? (
                  <ol className={styles.proofCaseEvents}>
                    {review.events.map((event) => (
                      <li key={event.sequence}>
                        <span>{event.actor === "creator" ? (reviewerName ?? "Creator") : event.actor === "participant" ? "You" : "Pods"}</span>
                        <strong>{eventLabels[event.type] ?? event.type}</strong>
                        {text(event.payload, "reason") ? <p>{text(event.payload, "reason")}</p> : null}
                        {text(event.payload, "requestedChange") ? <p><b>Requested change</b>{text(event.payload, "requestedChange")}</p> : null}
                        {text(event.payload, "reference") ? <p><b>Reference</b>{text(event.payload, "reference")}</p> : null}
                        {text(event.payload, "category") ? <p><b>Reason type</b>{text(event.payload, "category")?.replaceAll("_", " ")}</p> : null}
                        {Array.isArray(event.payload.unmetCriteria) ? (
                          <ul>{event.payload.unmetCriteria.map((criterion) => <li key={String(criterion)}>{String(criterion)}</li>)}</ul>
                        ) : null}
                        {text(event.payload, "suggestedCorrection") ? <p><b>Suggested correction</b>{text(event.payload, "suggestedCorrection")}</p> : null}
                        {text(event.payload, "note") ? <p>{text(event.payload, "note")}</p> : null}
                        {text(event.payload, "artifactUrl") ? (
                          <a href={text(event.payload, "artifactUrl") ?? undefined} rel="noreferrer" target="_blank">Open supporting artifact</a>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={styles.proofSheetEmpty}>No review events yet.</p>
                )}
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
