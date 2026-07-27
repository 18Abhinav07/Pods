"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import styles from "./ops-flow.module.css";

export function PublicModerationControls({
  reportId
}: {
  reportId: string;
}) {
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
      const response = await fetch(
        `/api/ops/public-safety/reports/${reportId}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: String(form.get("action") ?? ""),
            reason: String(form.get("reason") ?? "")
          })
        }
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Action could not be applied");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action could not be applied");
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
        <strong>Choose a reversible visibility action</strong>
        <span>Membership, evidence decisions, deposits, refunds, and payouts stay unchanged.</span>
      </div>
      <label className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Action</span>
        <select
          className={styles.select}
          defaultValue="suppress_content"
          disabled={working}
          name="action"
        >
          <option value="suppress_content">Hide from public room</option>
          <option value="restore_content">Restore to public room</option>
          <option value="suspend_room">Suspend public room</option>
          <option value="restore_room">Restore public room</option>
          <option value="dismiss_report">Dismiss report</option>
        </select>
      </label>
      <label className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Audit reason</span>
        <textarea
          className={styles.textarea}
          defaultValue="Reviewed by Pods public safety operations."
          disabled={working}
          maxLength={1000}
          minLength={5}
          name="reason"
          required
          rows={3}
        />
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.formActions}>
        <button
          className={styles.primaryAction}
          disabled={working}
          type="submit"
        >
          {working ? "Applying action" : "Apply action"}
        </button>
      </div>
    </form>
  );
}
