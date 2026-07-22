"use client";

import { DotsThree, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

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

  async function follow() {
    setBusy(true);
    setError("");
    const next = !relationship.following;
    const response = await fetch("/api/social/follows", {
      method: next ? "POST" : "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle })
    });
    if (response.ok) setRelationship((current) => ({ ...current, following: next }));
    else setError("Follow action could not be completed.");
    setBusy(false);
  }

  async function requestFriend() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/social/friend-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle })
    });
    if (response.ok) {
      const payload = (await response.json()) as { friendRequest?: { id?: string; state?: string } };
      if (payload.friendRequest?.state === "accepted") {
        setRelationship((current) => ({ ...current, friend: true, request: null }));
      } else {
        setRelationship((current) => ({
          ...current,
          request: { id: payload.friendRequest?.id ?? "pending", direction: "outgoing" }
        }));
      }
    } else setError("Friend request could not be sent.");
    setBusy(false);
  }

  async function acceptFriend() {
    if (!relationship.request) return;
    setBusy(true);
    const response = await fetch(`/api/social/friend-requests/${relationship.request.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "accept" })
    });
    if (response.ok) setRelationship((current) => ({ ...current, friend: true, request: null }));
    else setError("Friend request could not be accepted.");
    setBusy(false);
  }

  async function block() {
    setBusy(true);
    const response = await fetch("/api/social/blocks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle })
    });
    if (response.ok) window.location.assign("/discover?view=people");
    else setError("Profile could not be blocked.");
    setBusy(false);
  }

  return (
    <section className="social-profile-actions" aria-label="Profile actions">
      <div>
        <button className={relationship.following ? "is-active" : ""} disabled={busy} onClick={() => void follow()} type="button">{relationship.following ? "Following" : "Follow"}</button>
        {relationship.friend ? <Link href={`/messages/new?handle=${handle}`}>Message</Link> : relationship.request?.direction === "incoming" ? <button disabled={busy} onClick={() => void acceptFriend()} type="button" aria-label="Accept friend request">Accept friend</button> : relationship.request ? <button disabled type="button">Request sent</button> : <button disabled={busy} onClick={() => void requestFriend()} type="button">Add friend</button>}
        {!relationship.friend && relationship.messageRequestsAllowed ? <Link href={`/messages/new?handle=${handle}`}>Message request</Link> : null}
        <button
          aria-expanded={moreOpen}
          aria-label={moreOpen ? "Close profile actions" : "More profile actions"}
          className="social-more-trigger"
          onClick={() => setMoreOpen((open) => !open)}
          type="button"
        >
          {moreOpen ? <X aria-hidden="true" size={19} weight="bold" /> : <DotsThree aria-hidden="true" size={23} weight="bold" />}
        </button>
        {moreOpen ? <div aria-label="Profile safety actions" className="social-profile-more" role="group">
          <button disabled={busy} onClick={() => void block()} type="button">Block profile</button>
          <Link href={`/report/${handle}`}>Report profile</Link>
        </div> : null}
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
