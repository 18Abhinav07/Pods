"use client";

import type { ProfileAvatar as ProfileAvatarType } from "@pods/domain";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileAvatar } from "./profile-avatar";

type DirectRequest = {
  conversationId: string;
  introduction: string;
  sender: { handle: string; displayName: string; avatar: ProfileAvatarType };
};

export function DirectRequestList({ initialRequests }: { initialRequests: DirectRequest[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  async function decide(request: DirectRequest, action: "accept" | "discard" | "block") {
    const response = await fetch(`/api/conversations/${request.conversationId}/request`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action })
    });
    if (!response.ok) return;
    if (action === "accept") router.push(`/messages/${request.conversationId}`);
    else setRequests((current) => current.filter(({ conversationId }) => conversationId !== request.conversationId));
  }
  if (requests.length === 0) return null;
  return <section className="direct-request-list"><header><span>Message requests</span><strong>Choose who enters your private space.</strong></header>{requests.map((request) => <article key={request.conversationId}><div><ProfileAvatar avatar={request.sender.avatar} displayName={request.sender.displayName} /><span><strong>{request.sender.displayName}</strong><small>@{request.sender.handle}</small></span></div><p>{request.introduction}</p><div><button onClick={() => void decide(request, "accept")} type="button">Accept</button><button onClick={() => void decide(request, "discard")} type="button">Discard</button><button onClick={() => void decide(request, "block")} type="button">Block</button></div></article>)}</section>;
}
