"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Invitation = {
  invitationId: string;
  podId: string;
  activityName: string;
  purpose: string;
  totalLuna: number;
  occurrenceCount: number;
};

export function TargetedInvitationList({ initialInvitations }: { initialInvitations: Invitation[] }) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  async function accept(invitation: Invitation) {
    const response = await fetch(`/api/invitations/${invitation.invitationId}/accept`, { method: "POST" });
    if (!response.ok) return;
    setInvitations((current) => current.filter(({ invitationId }) => invitationId !== invitation.invitationId));
    router.push(`/pods/${invitation.podId}/fund`);
  }
  if (invitations.length === 0) return null;
  return <section className="targeted-invitation-list"><header><span>Private Pod invitations</span><strong>A friend invited you into a committed room.</strong></header>{invitations.map((invitation) => <article key={invitation.invitationId}><span>{invitation.occurrenceCount} occurrences · {invitation.totalLuna / 100_000} NIM upfront</span><h3>{invitation.activityName}</h3><p>{invitation.purpose}</p><button onClick={() => void accept(invitation)} type="button">Review and fund</button></article>)}</section>;
}
