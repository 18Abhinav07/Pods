"use client";

import Link from "next/link";
import { useState } from "react";

import { publishPodDraft } from "../lib/wizard-client";
import styles from "./creator-flow.module.css";

export function PublishClient({ podId }: { podId: string }) {
  const [accepted, setAccepted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");

  async function publish() {
    setError("");
    setPublishing(true);
    try {
      await publishPodDraft(podId);
      setPublishing(false);
      setPublished(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pod could not be published");
      setPublishing(false);
    }
  }

  if (published) {
    return <section aria-live="polite" className={styles.publishSuccess} role="status">
      <i aria-hidden="true">✓</i>
      <span><strong>Pod published</strong><span>The schedule and financial contract are now frozen.</span></span>
      <Link className={styles.primaryAction} href={`/pods/${podId}/rules`}>Open frozen contract</Link>
    </section>;
  }

  return <div className={styles.reviewStack}>
    <label className={styles.consentPanel}>
      <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
      <i className={styles.consentCircle} aria-hidden="true">{accepted ? "✓" : ""}</i>
      <span className={styles.consentCopy}><strong>Freeze this contract</strong><span>I accept that schedule, evidence, verification, commitment, and settlement terms cannot be edited after publication.</span></span>
    </label>
    {error ? <div className={styles.error} role="alert">{error}</div> : null}
    <div aria-live="polite" className={styles.liveStatus}>{publishing ? "Publishing your Pod" : ""}</div>
    <div className={styles.actionDock}><button className={styles.primaryAction} disabled={!accepted || publishing} onClick={publish} type="button">{publishing ? "Publishing Pod" : "Publish Pod"}</button></div>
  </div>;
}
