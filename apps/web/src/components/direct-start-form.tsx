"use client";

import { Check } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import styles from "./social-flow.module.css";

export function DirectStartForm({
  handle,
  friend
}: {
  handle: string;
  friend: boolean;
}) {
  const router = useRouter();
  const [introduction, setIntroduction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !introduction.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle, introduction })
      });
      const payload = (await response.json()) as {
        error?: string;
        conversation?: { id: string };
        visibleState?: "active" | "pending";
      };
      if (!response.ok || !payload.conversation) {
        throw new Error(payload.error ?? "Conversation could not be opened");
      }
      if (payload.visibleState === "active") {
        router.replace(`/messages/${payload.conversation.id}`);
        return;
      }
      setRequestSent(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Conversation could not be opened"
      );
    } finally {
      setBusy(false);
    }
  }

  if (requestSent) {
    return (
      <section className={styles.sentState} aria-live="polite">
        <span className={styles.sentMark} aria-hidden="true">
          <Check size={36} weight="bold" />
        </span>
        <span className={styles.directKicker}>Introduction delivered</span>
        <h1>Request sent</h1>
        <p>
          @{handle} can accept, discard, or block the introduction. You will not
          be told if they discard it.
        </p>
        <div className={styles.sentActions}>
          <Link className={styles.primaryButton} href="/messages">
            Messages
          </Link>
          <Link className={styles.secondaryButton} href={`/u/${handle}`}>
            Profile
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form className={styles.directForm} onSubmit={submit}>
      <span className={styles.directVisual} aria-hidden="true" />
      <span className={styles.directKicker}>
        {friend ? "Private message" : "One introduction"}
      </span>
      <h1>{friend ? `Message @${handle}` : `Introduce yourself to @${handle}`}</h1>
      <p>
        {friend
          ? "Your first note opens a private conversation."
          : "They see your profile, shared Pod context, and this note before deciding."}
      </p>
      <div className={styles.field}>
        <label htmlFor="direct-introduction">
          {friend ? "First message" : "Introduction"}
        </label>
        <textarea
          id="direct-introduction"
          maxLength={500}
          minLength={1}
          onChange={(event) => setIntroduction(event.target.value)}
          placeholder={
            friend ? "Share something useful" : "Why would you like to connect?"
          }
          required
          rows={5}
          value={introduction}
        />
        <small>
          {introduction.length}/500 · Links and media unlock after acceptance
        </small>
      </div>
      {error ? <p className={styles.errorMessage} role="alert">{error}</p> : null}
      <button
        aria-busy={busy}
        className={`${styles.primaryButton} ${styles.wideButton}`}
        disabled={busy || !introduction.trim()}
        type="submit"
      >
        {busy ? "Sending request" : friend ? "Send message" : "Send request"}
      </button>
    </form>
  );
}
