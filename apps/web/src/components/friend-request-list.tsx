"use client";

import type { ProfileAvatar as ProfileAvatarType } from "@pods/domain";
import { useState } from "react";

import { ProfileAvatar } from "./profile-avatar";

type FriendRequest = {
  id: string;
  direction: "incoming" | "outgoing";
  profile: { handle: string; displayName: string; avatar: ProfileAvatarType };
};

export function FriendRequestList({ initialRequests }: { initialRequests: FriendRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  async function decide(request: FriendRequest, action: "accept" | "decline" | "cancel") {
    const response = await fetch(`/api/social/friend-requests/${request.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action })
    });
    if (response.ok) setRequests((current) => current.filter(({ id }) => id !== request.id));
  }
  if (requests.length === 0) return null;
  return <section className="friend-request-list">{requests.map((request) => <article key={request.id}><ProfileAvatar avatar={request.profile.avatar} displayName={request.profile.displayName} /><div><strong>{request.profile.displayName}</strong><span>@{request.profile.handle} · {request.direction}</span></div><div>{request.direction === "incoming" ? <><button onClick={() => void decide(request, "accept")} type="button">Accept</button><button onClick={() => void decide(request, "decline")} type="button">Decline</button></> : <button onClick={() => void decide(request, "cancel")} type="button">Cancel</button>}</div></article>)}</section>;
}
