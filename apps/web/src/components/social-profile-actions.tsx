"use client";

import { DotsThree, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./social-flow.module.css";

type Relationship = {
  following: boolean;
  friend: boolean;
  request: { id: string; direction: "incoming" | "outgoing" } | null;
};

export function SocialProfileActions({
  handle,
  initial
}: {
  handle: string;
  initial: Relationship & { messageRequestsAllowed?: boolean };
}) {
  const [relationship, setRelationship] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreTrigger = useRef<HTMLButtonElement>(null);
  const tray = useRef<HTMLElement>(null);

  function closeTray() {
    setMoreOpen(false);
  }

  useEffect(() => {
    if (!moreOpen) return;
    const priorOverflow = document.body.style.overflow;
    const trigger = moreTrigger.current;
    document.body.style.overflow = "hidden";
    const firstFocusable = tray.current?.querySelector<HTMLElement>(
      "button:not([disabled]), a[href]"
    );
    firstFocusable?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTray();
        return;
      }
      if (event.key !== "Tab" || !tray.current) return;
      const focusable = Array.from(
        tray.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
        )
      );
      if (focusable.length === 0) {
        event.preventDefault();
        tray.current.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = priorOverflow;
      trigger?.focus();
    };
  }, [moreOpen]);

  async function follow() {
    if (busy) return;
    setBusy(true);
    setError("");
    const next = !relationship.following;
    try {
      const response = await fetch("/api/social/follows", {
        method: next ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle })
      });
      if (!response.ok) throw new Error("Follow action failed");
      setRelationship((current) => ({ ...current, following: next }));
    } catch {
      setError("Follow action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function requestFriend() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/social/friend-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle })
      });
      if (!response.ok) throw new Error("Friend request failed");
      const payload = (await response.json()) as {
        friendRequest?: { id?: string; state?: string };
      };
      if (payload.friendRequest?.state === "accepted") {
        setRelationship((current) => ({ ...current, friend: true, request: null }));
      } else {
        setRelationship((current) => ({
          ...current,
          request: {
            id: payload.friendRequest?.id ?? "pending",
            direction: "outgoing"
          }
        }));
      }
    } catch {
      setError("Friend request could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function respondToFriend(action: "accept" | "decline" | "cancel") {
    if (!relationship.request || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/social/friend-requests/${relationship.request.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action })
        }
      );
      if (!response.ok) throw new Error("Friend request response failed");
      setRelationship((current) => ({
        ...current,
        friend: action === "accept",
        request: null
      }));
    } catch {
      setError("Friend request could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function block() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/social/blocks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle })
      });
      if (!response.ok) throw new Error("Block failed");
      closeTray();
      window.location.assign("/people/search");
    } catch {
      setError("Profile could not be blocked.");
      setBusy(false);
    }
  }

  return (
    <section aria-label="Profile actions">
      <div className={styles.profileActions}>
        <button
          className={relationship.following ? styles.secondaryButton : styles.primaryButton}
          disabled={busy}
          onClick={() => void follow()}
          type="button"
        >
          {relationship.following ? "Following" : "Follow"}
        </button>
        {relationship.friend ? (
          <Link className={styles.secondaryButton} href={`/messages/new?handle=${handle}`}>
            Message
          </Link>
        ) : relationship.request?.direction === "incoming" ? (
          <>
            <button
              aria-label="Accept friend request"
              className={styles.primaryButton}
              disabled={busy}
              onClick={() => void respondToFriend("accept")}
              type="button"
            >
              Accept
            </button>
            <button
              aria-label="Decline friend request"
              className={styles.secondaryButton}
              disabled={busy}
              onClick={() => void respondToFriend("decline")}
              type="button"
            >
              Decline
            </button>
          </>
        ) : relationship.request ? (
          <button
            className={styles.secondaryButton}
            disabled={busy}
            onClick={() => void respondToFriend("cancel")}
            type="button"
          >
            {busy ? "Cancelling" : "Cancel request"}
          </button>
        ) : (
          <button
            className={styles.secondaryButton}
            disabled={busy}
            onClick={() => void requestFriend()}
            type="button"
          >
            Add friend
          </button>
        )}
        {!relationship.friend &&
        !relationship.request &&
        relationship.messageRequestsAllowed ? (
          <Link
            className={styles.secondaryButton}
            href={`/messages/new?handle=${handle}`}
          >
            Message request
          </Link>
        ) : null}
        <button
          aria-expanded={moreOpen}
          aria-label={moreOpen ? "Close profile actions" : "More profile actions"}
          className={`${styles.secondaryButton} ${styles.moreButton}`}
          onClick={() => setMoreOpen((open) => !open)}
          ref={moreTrigger}
          type="button"
        >
          {moreOpen ? (
            <X aria-hidden="true" size={19} weight="bold" />
          ) : (
            <DotsThree aria-hidden="true" size={23} weight="bold" />
          )}
        </button>
      </div>
      {error ? <p className={styles.errorMessage} role="alert">{error}</p> : null}

      {moreOpen ? (
        <div className={styles.safetyOverlay}>
          <button
            aria-label="Close profile safety actions"
            className={styles.safetyBackdrop}
            onClick={closeTray}
            type="button"
          />
          <section
            aria-label="Profile safety actions"
            aria-modal="true"
            className={styles.safetyTray}
            ref={tray}
            role="dialog"
            tabIndex={-1}
          >
            <header className={styles.trayHeader}>
              <strong>Profile safety</strong>
              <button
                aria-label="Close profile safety actions"
                className={styles.trayClose}
                onClick={closeTray}
                type="button"
              >
                <X aria-hidden="true" size={20} weight="bold" />
              </button>
            </header>
            <div
              aria-label="Profile safety actions"
              className={styles.trayActions}
              role="group"
            >
              <button disabled={busy} onClick={() => void block()} type="button">
                {busy ? "Blocking profile" : "Block profile"}
              </button>
              <Link href={`/report/${handle}`}>Report profile</Link>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
