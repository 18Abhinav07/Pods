"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { acceptPrivateInvitation } from "../lib/invitation-client";

export function InvitationAcceptance({ token, connected }: { token: string; connected: boolean }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!connected) {
    return <Link className="primary-action full-action" href={`/connect?returnTo=${encodeURIComponent(`/invite#${token}`)}`}>Connect wallet to continue</Link>;
  }

  async function accept() {
    setBusy(true);
    setError("");
    try {
      const membership = await acceptPrivateInvitation(token);
      router.push(`/pods/${membership.podId}/fund`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This invitation is unavailable");
      setBusy(false);
    }
  }

  return (
    <div className="invite-acceptance">
      <label className="consent-row"><input checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" /><span>I accept this frozen contract and understand that my place is not secured until funding finality and roster lock.</span></label>
      {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
      <button className="primary-action full-action" disabled={!accepted || busy} onClick={accept} type="button">{busy ? "Accepting invitation" : "Accept private invitation"}</button>
    </div>
  );
}
