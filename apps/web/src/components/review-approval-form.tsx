"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ReviewApprovalForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function approve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/ops/reviews/${submissionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Review could not be completed");
      router.replace("/ops/reviews");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review could not be completed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="review-decision-card" onSubmit={approve}>
      <label htmlFor="review-note">Review note</label>
      <textarea
        id="review-note"
        maxLength={1000}
        minLength={12}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Explain how the artifact completes the frozen task."
        required
        rows={4}
        value={note}
      />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="primary-action full-action" disabled={submitting} type="submit">
        {submitting ? "Recording decision" : "Approve occurrence"}
      </button>
    </form>
  );
}
