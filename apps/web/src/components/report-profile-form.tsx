"use client";

import { FormEvent, useRef, useState } from "react";

import styles from "./ops-flow.module.css";

export function ReportProfileForm({ handle }: { handle: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const submissionLock = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    submissionLock.current = true;
    const data = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/social/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle,
          reason: data.get("reason"),
          details: data.get("details")
        })
      });
      if (!response.ok) {
        throw new Error("Report request failed");
      }
      setState("sent");
    } catch {
      setError("Report could not be sent. Check the details and try again.");
      setState("idle");
    } finally {
      submissionLock.current = false;
    }
  }

  if (state === "sent") {
    return (
      <section className={styles.successCard} role="status">
        <span>Report received</span>
        <h2>Thank you for protecting the room.</h2>
        <p>
          Blocking remains available separately and never changes shared Pod
          financial obligations.
        </p>
      </section>
    );
  }

  const sending = state === "sending";
  return (
    <form
      aria-busy={sending}
      className={styles.formCard}
      onSubmit={submit}
    >
      <div className={styles.formHeading}>
        <strong>Send context privately</strong>
        <span>The reported person is not notified by this form.</span>
      </div>
      <label className={styles.fieldGroup} htmlFor="report-reason">
        <span className={styles.fieldLabel}>Reason</span>
        <select
          className={styles.select}
          disabled={sending}
          id="report-reason"
          name="reason"
          required
        >
          <option value="spam">Spam</option>
          <option value="harassment">Harassment</option>
          <option value="unsafe_content">Unsafe content</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className={styles.fieldGroup} htmlFor="report-details">
        <span className={styles.fieldLabel}>What happened?</span>
        <textarea
          className={styles.textarea}
          disabled={sending}
          id="report-details"
          maxLength={1000}
          minLength={5}
          name="details"
          required
          rows={7}
        />
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.formActions}>
        <button
          className={styles.primaryAction}
          disabled={sending}
          type="submit"
        >
          {sending ? "Sending report" : "Send private report"}
        </button>
      </div>
    </form>
  );
}
