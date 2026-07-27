"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import styles from "./ops-flow.module.css";

export function PayoutRetryControls({ legId }: { legId: string }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const submissionLock = useRef(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    submissionLock.current = true;
    const form = new FormData(event.currentTarget);
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/ops/transfers/${legId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: String(form.get("reason") ?? "") })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Payout could not be retried");
      }
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Payout could not be retried"
      );
    } finally {
      submissionLock.current = false;
      setWorking(false);
    }
  }

  return (
    <form
      aria-busy={working}
      className={styles.embeddedForm}
      onSubmit={submit}
    >
      <div className={styles.formHeading}>
        <strong>Reconcile before replacement</strong>
        <span>A new transaction is prepared only after the latest chain state is proven.</span>
      </div>
      <label className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Audit reason</span>
        <textarea
          className={styles.textarea}
          defaultValue="A fresh chain check is required before replacement."
          disabled={working}
          maxLength={500}
          minLength={10}
          name="reason"
          required
          rows={2}
        />
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.formActions}>
        <button
          className={styles.primaryAction}
          disabled={working}
          type="submit"
        >
          {working ? "Checking chain" : "Recheck and retry"}
        </button>
      </div>
    </form>
  );
}
