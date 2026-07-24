"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatZonedMoment } from "../lib/format-moment";
import {
  participantSubmissionPresentation,
  proofAudiencePresentation,
  type ParticipantSubmissionStatusDto
} from "../lib/participant-submission-status";
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
  const presentation = participantSubmissionPresentation(status.state);
  const audience = proofAudiencePresentation(status.proofShareMode);
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
      className={`participant-submission-status is-${status.state}`}
    >
      <header className="participant-status-hero">
        <p className="eyebrow">
          {occurrenceOrdinal ? `Occurrence ${occurrenceOrdinal}` : presentation.eyebrow}
        </p>
        <h1>{presentation.heading}</h1>
        {podName ? <p>{podName}</p> : null}
      </header>

      <div className="participant-review-context">
        <div className="participant-reviewer">
          {status.creator ? (
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
              <strong>Pod creator</strong>
              <span>Profile unavailable</span>
            </div>
          )}
        </div>
        <div className="participant-proof-audience">
          <small>Proof audience</small>
          <strong>{audience.label}</strong>
          <span>{audience.detail}</span>
        </div>
      </div>

      <section
        aria-label="Review timeline"
        className="review-timing-card is-review-timeline"
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

      <aside
        className={`submission-protection-note is-${
          successful
            ? "success"
            : status.state === "rejected"
              ? "attention"
              : "pending"
        }`}
      >
        <strong>
          {status.state === "reviewing"
            ? "Principal remains protected while review is open"
            : presentation.heading}
        </strong>
        <p>{presentation.detail}</p>
      </aside>

      {status.reviewDecisionNote ? (
        <aside className="submission-private-decision-note">
          <strong>Private decision note</strong>
          <p>{status.reviewDecisionNote}</p>
        </aside>
      ) : null}

      {connectionIssue && status.state === "reviewing" ? (
        <p className="submission-reconnect-note" role="status">
          Reconnecting to creator review
        </p>
      ) : null}
    </section>
  );
}
