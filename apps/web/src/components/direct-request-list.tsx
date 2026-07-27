"use client";

import type { ProfileAvatar as ProfileAvatarType } from "@pods/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileAvatar } from "./profile-avatar";
import styles from "./social-flow.module.css";

type DirectRequest = {
  conversationId: string;
  introduction: string;
  sender: { handle: string; displayName: string; avatar: ProfileAvatarType };
};

export function DirectRequestList({
  initialRequests
}: {
  initialRequests: DirectRequest[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function decide(
    request: DirectRequest,
    action: "accept" | "discard" | "block"
  ) {
    if (busyId) return;
    setBusyId(request.conversationId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/conversations/${request.conversationId}/request`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action })
        }
      );
      if (!response.ok) throw new Error("Message request update failed");
      if (action === "accept") {
        router.push(`/messages/${request.conversationId}`);
        return;
      }
      setRequests((current) =>
        current.filter(({ conversationId }) => conversationId !== request.conversationId)
      );
      setNotice(action === "discard" ? "Message request discarded." : "Profile blocked.");
    } catch {
      setError("Message request could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return notice ? <p className={styles.inlineState} role="status">{notice}</p> : null;
  }

  return (
    <section className={styles.requestSection} aria-labelledby="message-request-title">
      <header className={styles.sectionHeader}>
        <div>
          <span>Message introductions</span>
          <h2 id="message-request-title">Choose who enters your space</h2>
        </div>
        <small>{requests.length}</small>
      </header>
      <div className={styles.requestList}>
        {requests.map((request) => {
          const busy = busyId === request.conversationId;
          return (
            <article className={styles.requestCard} key={request.conversationId}>
              <div className={styles.requestIdentity}>
                <ProfileAvatar
                  avatar={request.sender.avatar}
                  displayName={request.sender.displayName}
                />
                <span>
                  <strong>{request.sender.displayName}</strong>
                  <small>@{request.sender.handle}</small>
                </span>
              </div>
              <p className={styles.requestIntro}>{request.introduction}</p>
              <div className={styles.actionRow}>
                <button
                  aria-label={`Accept ${request.sender.displayName}`}
                  className={styles.primaryButton}
                  disabled={busy}
                  onClick={() => void decide(request, "accept")}
                  type="button"
                >
                  {busy ? "Updating" : "Accept"}
                </button>
                <button
                  aria-label={`Discard ${request.sender.displayName}`}
                  className={styles.secondaryButton}
                  disabled={busy}
                  onClick={() => void decide(request, "discard")}
                  type="button"
                >
                  Discard
                </button>
                <button
                  aria-label={`Block ${request.sender.displayName}`}
                  className={styles.dangerButton}
                  disabled={busy}
                  onClick={() => void decide(request, "block")}
                  type="button"
                >
                  Block
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {error ? <p className={styles.errorMessage} role="alert">{error}</p> : null}
      {notice ? <p className={styles.inlineState} role="status">{notice}</p> : null}
    </section>
  );
}
