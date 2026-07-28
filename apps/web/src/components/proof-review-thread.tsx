"use client";

import { ArrowClockwise, CheckCircle, ChatCircleDots, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { createClientUuid } from "../lib/client-id";
import { formatZonedMoment } from "../lib/format-moment";
import type { ProofReviewView } from "../lib/proof-review-view";
import styles from "./activity-ritual/activity-ritual.module.css";
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

function text(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function ActionError({ value }: { value: string }) {
  return value ? <p className={styles.formError} role="alert">{value}</p> : null;
}

export function ProofReviewThread({
  endpoint,
  initial,
  podId,
  recoveryMode,
  submissionId,
  timeZone
}: {
  endpoint: string;
  initial: ProofReviewView;
  podId: string;
  recoveryMode: "linked" | "next_occurrence" | "unavailable";
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
  const actionKeys = useRef(new Map<string, string>());

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
      </header>

      <ProofVersionHistory endpoint={endpoint} versions={review.versions} />

      <ol className={styles.proofCaseEvents}>
        {review.events.map((event) => (
          <li key={event.sequence}>
            <span>{event.actor === "creator" ? "Creator" : event.actor === "participant" ? "You" : "Pods"}</span>
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

      {review.stage === "awaiting_clarification" ? (
        <form className={styles.proofCaseAction} onSubmit={respond}>
          <label htmlFor="clarification-note">Explain what changed</label>
          <textarea id="clarification-note" minLength={20} maxLength={1200} required rows={4} value={clarification} onChange={(event) => setClarification(event.target.value)} />
          <label htmlFor="clarification-artifact">Updated HTTPS artifact <span>Optional</span></label>
          <input id="clarification-artifact" inputMode="url" type="url" value={artifactUrl} onChange={(event) => setArtifactUrl(event.target.value)} />
          <label htmlFor="clarification-image">Replacement image <span>Optional and private</span></label>
          <input accept="image/jpeg,image/png,image/heic,image/avif,image/webp" id="clarification-image" type="file" onChange={(event) => setClarificationImage(event.target.files?.[0] ?? null)} />
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
            <label htmlFor="appeal-image">Supporting image <span>Optional and private</span></label>
            <input accept="image/jpeg,image/png,image/heic,image/avif,image/webp" id="appeal-image" type="file" onChange={(event) => setAppealImage(event.target.files?.[0] ?? null)} />
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
    </section>
  );
}
