"use client";

import {
  CheckCircle,
  ClockCountdown,
  PencilSimple,
  ShieldCheck,
  XCircle
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { formatZonedMoment } from "../lib/format-moment";
import {
  participantSubmissionPresentation,
  proofAudiencePresentation,
  type ParticipantSubmissionStatusDto
} from "../lib/participant-submission-status";
import styles from "./activity-ritual/activity-ritual.module.css";
import { ProfileAvatar } from "./profile-avatar";

function formattedMoment(value: string | null, timeZone: string) {
  return value
    ? formatZonedMoment(value, { timeZone })
    : "Not available";
}

function isStatusDto(value: unknown): value is ParticipantSubmissionStatusDto {
  if (!value || typeof value !== "object") return false;
  const state = (value as { state?: unknown }).state;
  return (
    state === "draft" ||
    state === "reviewing" ||
    state === "approved" ||
    state === "rejected" ||
    state === "timeout_protected"
  );
}

function outcomeTitle(state: ParticipantSubmissionStatusDto["state"]) {
  if (state === "approved") return "Progress updated";
  if (state === "timeout_protected") return "Protected and counted";
  if (state === "rejected") return "This occurrence was not counted";
  if (state === "draft") return "Not submitted yet";
  return "Principal protected while review is open";
}

function ReviewTimeline({
  status,
  timeZone
}: {
  status: ParticipantSubmissionStatusDto;
  timeZone: string;
}) {
  return (
    <section
      aria-label="Review timeline"
      className={styles.reviewTimeline}
      data-review-timeline
    >
      <div>
        <span>Submitted</span>
        <strong>{formattedMoment(status.submittedAt, timeZone)}</strong>
      </div>
      <div>
        <span>Review target</span>
        <strong>{formattedMoment(status.reviewTargetAt, timeZone)}</strong>
      </div>
      <div>
        <span>Protection time</span>
        <strong>
          {formattedMoment(status.reviewHardDeadlineAt, timeZone)}
        </strong>
      </div>
    </section>
  );
}

function StateIcon({
  state
}: {
  state: ParticipantSubmissionStatusDto["state"];
}) {
  if (state === "approved") {
    return <CheckCircle aria-hidden="true" size={30} weight="fill" />;
  }
  if (state === "timeout_protected") {
    return <ShieldCheck aria-hidden="true" size={30} weight="fill" />;
  }
  if (state === "rejected") {
    return <XCircle aria-hidden="true" size={30} weight="fill" />;
  }
  if (state === "draft") {
    return <PencilSimple aria-hidden="true" size={28} weight="fill" />;
  }
  return <ClockCountdown aria-hidden="true" size={28} weight="fill" />;
}

export function ParticipantSubmissionStatus({
  endpoint,
  initial,
  occurrenceOrdinal,
  podName,
  timeZone = "UTC"
}: {
  endpoint: string;
  initial: ParticipantSubmissionStatusDto;
  occurrenceOrdinal?: number;
  podName?: string;
  timeZone?: string;
}) {
  const [status, setStatus] = useState(initial);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const inFlight = useRef(false);
  const reviewerKind = status.reviewerKind ?? "creator";
  const presentation = participantSubmissionPresentation(
    status.state,
    reviewerKind
  );
  const audience = proofAudiencePresentation(
    status.proofShareMode,
    reviewerKind
  );
  const successful =
    status.state === "approved" || status.state === "timeout_protected";

  const reconcile = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Review status could not be refreshed");
      const body = await response.json() as { status?: unknown };
      if (!isStatusDto(body.status)) {
        throw new Error("Review status response was invalid");
      }
      setStatus(body.status);
      setConnectionIssue(false);
    } catch {
      setConnectionIssue(true);
    } finally {
      inFlight.current = false;
    }
  }, [endpoint]);

  useEffect(() => {
    if (status.state !== "reviewing") return;
    const initialReconcile = window.setTimeout(() => {
      void reconcile();
    }, 0);
    const interval = window.setInterval(() => {
      void reconcile();
    }, 2_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void reconcile();
    };
    const onOnline = () => void reconcile();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      window.clearTimeout(initialReconcile);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [reconcile, status.state]);

  return (
    <section
      aria-live="polite"
      className={styles.submissionStatus}
      data-state={status.state}
      data-submission-state={status.state}
    >
      <header className={styles.statusHero}>
        <span aria-hidden="true" className={styles.statusIcon}>
          <StateIcon state={status.state} />
        </span>
        <p>
          {occurrenceOrdinal ? `Occurrence ${occurrenceOrdinal}` : presentation.eyebrow}
        </p>
        <h1>{presentation.heading}</h1>
        <span>{presentation.detail}</span>
        {podName ? <small>{podName}</small> : null}
      </header>

      <div className={styles.reviewContext}>
        <div className={styles.reviewerIdentity}>
          {reviewerKind === "creator" && status.creator ? (
            <>
              <ProfileAvatar
                avatar={status.creator.avatar}
                displayName={status.creator.displayName}
                size="small"
              />
              <div>
                <small>Pod creator</small>
                <strong>{status.creator.displayName}</strong>
                <span>@{status.creator.handle}</span>
              </div>
            </>
          ) : (
            <div>
              <small>Reviewer</small>
              <strong>
                {reviewerKind === "creator" ? "Pod creator" : "Pods Team"}
              </strong>
              <span>
                {reviewerKind === "creator"
                  ? "Profile unavailable"
                  : "Platform review"}
              </span>
            </div>
          )}
        </div>
        <div className={styles.audienceSummary}>
          <small>Proof audience</small>
          <strong>{audience.label}</strong>
          <span>{audience.detail}</span>
        </div>
      </div>

      {status.state === "reviewing" ? (
        <ReviewTimeline status={status} timeZone={timeZone} />
      ) : status.state === "draft" ? null : (
        <details className={styles.reviewHistory}>
          <summary>
            <span>Review timing</span>
            <strong>3 checkpoints</strong>
          </summary>
          <ReviewTimeline status={status} timeZone={timeZone} />
        </details>
      )}

      <aside
        className={styles.outcomeNote}
        data-tone={
          successful
            ? "success"
            : status.state === "rejected"
              ? "attention"
              : "pending"
        }
      >
        <strong>{outcomeTitle(status.state)}</strong>
      </aside>

      {status.reviewDecisionNote ? (
        <aside className={styles.decisionNote}>
          <strong>Private decision note</strong>
          <p>{status.reviewDecisionNote}</p>
        </aside>
      ) : null}

      {connectionIssue && status.state === "reviewing" ? (
        <p className={styles.reconnectNote} role="status">
          Reconnecting to {reviewerKind === "creator" ? "creator" : "Pods Team"} review
        </p>
      ) : null}
    </section>
  );
}
