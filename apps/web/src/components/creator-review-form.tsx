"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type DecisionResponse = {
  error?: string;
  submission?: {
    state?: string;
  };
};

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function recordDecision(
    decision:
      | { decision: "approve"; note: string }
      | { decision: "reject"; reason: string }
  ) {
    setPending(true);
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
      setSaved(true);
      router.replace(`/pods/${podId}/admin/reviews`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Review decision could not be recorded"
      );
    } finally {
      setPending(false);
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
    <section className="creator-review-decision" aria-label="Final proof decision">
      <form className="review-decision-card" onSubmit={approve}>
        <label htmlFor="creator-approval-note">Approval note</label>
        <textarea
          disabled={pending}
          id="creator-approval-note"
          maxLength={500}
          onChange={(event) => setApprovalNote(event.target.value)}
          placeholder="Optional note for the participant"
          rows={3}
          value={approvalNote}
        />
        <button
          className="primary-action full-action"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving decision" : "Approve proof"}
        </button>
      </form>

      {!rejectionOpen ? (
        <button
          className="secondary-action full-action creator-reject-trigger"
          disabled={pending}
          onClick={() => setRejectionOpen(true)}
          type="button"
        >
          Reject proof
        </button>
      ) : (
        <form className="creator-rejection-panel" onSubmit={reject}>
          <label htmlFor="creator-rejection-reason">Rejection reason</label>
          <textarea
            disabled={pending}
            id="creator-rejection-reason"
            maxLength={500}
            minLength={12}
            onChange={(event) => setRejectionReason(event.target.value)}
            required
            rows={4}
            value={rejectionReason}
          />
          <button
            className="secondary-action full-action is-destructive"
            disabled={pending}
            type="submit"
          >
            {pending ? "Saving decision" : "Confirm rejection"}
          </button>
        </form>
      )}

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {saved ? <p className="decision-saved" role="status">Decision saved</p> : null}
    </section>
  );
}
