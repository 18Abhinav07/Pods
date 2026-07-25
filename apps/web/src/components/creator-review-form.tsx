"use client";

import { Check, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import styles from "./activity-ritual/activity-ritual.module.css";

type DecisionResponse = {
  error?: string;
  submission?: {
    state?: string;
  };
};

type DecisionStatus = "idle" | "pending" | "saved";
const SAVED_NAVIGATION_DELAY_MS = 400;

export function CreatorReviewForm({
  podId,
  submissionId
}: {
  podId: string;
  submissionId: string;
}) {
  const router = useRouter();
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [status, setStatus] = useState<DecisionStatus>("idle");
  const statusRef = useRef<DecisionStatus>("idle");
  const rejectionReasonRef = useRef<HTMLTextAreaElement>(null);
  const navigationTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (rejectionOpen) rejectionReasonRef.current?.focus();
  }, [rejectionOpen]);

  useEffect(() => () => {
    if (navigationTimerRef.current !== null) {
      globalThis.clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
  }, []);

  function moveToStatus(nextStatus: DecisionStatus) {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }

  async function recordDecision(
    decision:
      | { decision: "approve"; note: string }
      | { decision: "reject"; reason: string }
  ) {
    if (statusRef.current !== "idle") return;
    moveToStatus("pending");
    setError("");
    try {
      const response = await fetch(
        `/api/pods/${podId}/admin/reviews/${submissionId}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(decision)
        }
      );
      const body = await response.json() as DecisionResponse;
      if (response.status === 409) {
        throw new Error("This proof already has a final result");
      }
      if (!response.ok || !body.submission) {
        throw new Error(body.error ?? "Review decision could not be recorded");
      }
      moveToStatus("saved");
      navigationTimerRef.current = globalThis.setTimeout(() => {
        navigationTimerRef.current = null;
        router.replace(`/pods/${podId}/admin/reviews`);
        router.refresh();
      }, SAVED_NAVIGATION_DELAY_MS);
    } catch (cause) {
      moveToStatus("idle");
      setError(
        cause instanceof Error
          ? cause.message
          : "Review decision could not be recorded"
      );
    }
  }

  function approve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void recordDecision({ decision: "approve", note: approvalNote });
  }

  function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void recordDecision({ decision: "reject", reason: rejectionReason });
  }

  return (
    <section
      aria-label="Final proof decision"
      className={styles.decisionArea}
      data-review-decision
    >
      <header className={styles.decisionHeading}>
        <span>Decision</span>
        <h2>Does the proof match the commitment?</h2>
        <p>
          Approval counts this occurrence. Rejection requires a clear private
          reason.
        </p>
      </header>
      <form className={styles.approvalForm} onSubmit={approve}>
        <label htmlFor="creator-approval-note">
          Private approval note <span>Optional</span>
        </label>
        <textarea
          aria-label="Approval note"
          disabled={status !== "idle"}
          id="creator-approval-note"
          maxLength={500}
          onChange={(event) => setApprovalNote(event.target.value)}
          placeholder="Add concise context for the participant"
          rows={3}
          value={approvalNote}
        />
        <button
          className={styles.primaryAction}
          disabled={status !== "idle"}
          type="submit"
        >
          <span>{status === "pending" ? "Saving decision" : "Approve proof"}</span>
          <span aria-hidden="true" className={styles.actionIcon}>
            <Check size={18} weight="bold" />
          </span>
        </button>
      </form>

      {!rejectionOpen ? (
        <button
          className={styles.rejectTrigger}
          disabled={status !== "idle"}
          onClick={() => setRejectionOpen(true)}
          type="button"
        >
          Reject proof
        </button>
      ) : (
        <form className={styles.rejectionPanel} onSubmit={reject}>
          <p className={styles.rejectionAnnouncement} role="status">
            Rejection reason required
          </p>
          <label htmlFor="creator-rejection-reason">Rejection reason</label>
          <textarea
            disabled={status !== "idle"}
            id="creator-rejection-reason"
            maxLength={500}
            minLength={12}
            onChange={(event) => setRejectionReason(event.target.value)}
            ref={rejectionReasonRef}
            required
            rows={4}
            value={rejectionReason}
          />
          <button
            className={styles.confirmReject}
            disabled={status !== "idle"}
            type="submit"
          >
            <X aria-hidden="true" size={18} weight="bold" />
            {status === "pending" ? "Saving decision" : "Confirm rejection"}
          </button>
        </form>
      )}

      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
      {status === "saved" ? (
        <p className={styles.decisionSaved} role="status">Decision saved</p>
      ) : null}
    </section>
  );
}
