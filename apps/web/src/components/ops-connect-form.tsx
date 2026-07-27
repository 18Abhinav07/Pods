"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import styles from "./ops-flow.module.css";

export function OpsConnectForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    submissionLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/ops/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, returnTo })
      });
      const body = (await response.json()) as { error?: string; returnTo?: string };
      if (!response.ok) throw new Error(body.error ?? "Reviewer access failed");
      router.replace(body.returnTo ?? "/ops/public-safety");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reviewer access failed");
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form
      aria-busy={submitting}
      className={styles.formCard}
      onSubmit={submit}
    >
      <div className={styles.formHeading}>
        <strong>Verify operator access</strong>
        <span>The token stays inside this secure session request.</span>
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor="ops-access-token">Pods operations access token</label>
        <input
          autoComplete="current-password"
          className={styles.input}
          disabled={submitting}
          id="ops-access-token"
          onChange={(event) => setAccessToken(event.target.value)}
          required
          type="password"
          value={accessToken}
        />
      </div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.formActions}>
        <button
          className={styles.primaryAction}
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Checking access" : "Open public safety workspace"}
        </button>
      </div>
    </form>
  );
}
