"use client";

import type { ProfileAvatar as ProfileAvatarType } from "@pods/domain";
import { useState } from "react";

import { ProfileAvatar } from "./profile-avatar";
import styles from "./social-flow.module.css";

type FriendRequest = {
  id: string;
  direction: "incoming" | "outgoing";
  profile: { handle: string; displayName: string; avatar: ProfileAvatarType };
};

export function FriendRequestList({
  initialRequests
}: {
  initialRequests: FriendRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function decide(
    request: FriendRequest,
    action: "accept" | "decline" | "cancel"
  ) {
    if (busyId) return;
    setBusyId(request.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/social/friend-requests/${request.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error("Friend request update failed");
      setRequests((current) => current.filter(({ id }) => id !== request.id));
      setNotice(
        action === "accept"
          ? `${request.profile.displayName} is now your friend.`
          : action === "decline"
            ? "Friend request declined."
            : "Friend request cancelled."
      );
    } catch {
      setError("Friend request could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return notice ? <p className={styles.inlineState} role="status">{notice}</p> : null;
  }

  return (
    <section className={styles.requestSection} aria-labelledby="friend-request-title">
      <header className={styles.sectionHeader}>
        <div>
          <span>Friend requests</span>
          <h2 id="friend-request-title">People who want to connect</h2>
        </div>
        <small>{requests.length}</small>
      </header>
      <div className={styles.requestList}>
        {requests.map((request) => {
          const busy = busyId === request.id;
          return (
            <article className={styles.requestCard} key={request.id}>
              <div className={styles.requestIdentity}>
                <ProfileAvatar
                  avatar={request.profile.avatar}
                  displayName={request.profile.displayName}
                />
                <span>
                  <strong>{request.profile.displayName}</strong>
                  <small>
                    @{request.profile.handle} ·{" "}
                    {request.direction === "incoming" ? "Wants to connect" : "Request pending"}
                  </small>
                </span>
              </div>
              <div className={styles.actionRow}>
                {request.direction === "incoming" ? (
                  <>
                    <button
                      aria-label={`Accept ${request.profile.displayName}`}
                      className={styles.primaryButton}
                      disabled={busy}
                      onClick={() => void decide(request, "accept")}
                      type="button"
                    >
                      {busy ? "Updating" : "Accept"}
                    </button>
                    <button
                      aria-label={`Decline ${request.profile.displayName}`}
                      className={styles.secondaryButton}
                      disabled={busy}
                      onClick={() => void decide(request, "decline")}
                      type="button"
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <button
                    aria-label={`Cancel request to ${request.profile.displayName}`}
                    className={styles.secondaryButton}
                    disabled={busy}
                    onClick={() => void decide(request, "cancel")}
                    type="button"
                  >
                    {busy ? "Cancelling" : "Cancel request"}
                  </button>
                )}
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
