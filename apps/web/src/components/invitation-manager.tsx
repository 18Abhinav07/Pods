"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createPrivateInvitation, revokePrivateInvitation } from "../lib/invitation-client";

export type InvitationListItem = {
  id: string;
  expiresAt: string;
  status: "active" | "used" | "revoked" | "expired";
};

export function InvitationManager({ podId, initial }: { podId: string; initial: InvitationListItem[] }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [invitations, setInvitations] = useState(initial);
  const [newLink, setNewLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await createPrivateInvitation(podId);
      const link = `${window.location.origin}/invite/${result.token}`;
      setNewLink(link);
      setInvitations((current) => [{ id: result.invitation.id, expiresAt: result.invitation.expiresAt, status: "active" }, ...current]);
      setMessage("New single-use link ready. It will not be shown again after you leave this screen.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation could not be created");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!newLink) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Private Pods invitation", text: "Join my private activity Pod.", url: newLink });
        setMessage("Invitation shared.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(newLink);
        setMessage("Invitation copied.");
      } else {
        setMessage("Use the link field below to copy or share it.");
      }
    } catch {
      setMessage("The link is still available below.");
    }
  }

  async function revoke(id: string) {
    setError("");
    try {
      await revokePrivateInvitation(podId, id);
      setInvitations((current) => current.map((item) => item.id === id ? { ...item, status: "revoked" } : item));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation could not be revoked");
    }
  }

  return (
    <section className="invitation-manager">
      <div className="invitation-manager-head"><div><span>Private entry</span><h2>Single-use invitations</h2></div><button className="primary-action" disabled={busy} onClick={create} type="button">{busy ? "Creating" : "Create link"}</button></div>
      <p>Each opaque link admits one connected wallet, expires automatically, and can be revoked before use.</p>
      <AnimatePresence initial={false}>
        {newLink ? (
          <motion.div animate={{ opacity: 1, y: 0 }} className="new-invite-link" initial={reduceMotion ? false : { opacity: 0, y: 8 }}>
            <label><span>New link, shown once</span><input onFocus={(event) => event.currentTarget.select()} readOnly value={newLink} /></label>
            <button onClick={share} type="button">Share or copy</button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {message ? <p className="inline-success" role="status">{message}</p> : null}
      {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
      <div className="invitation-list">
        {invitations.map((invitation) => (
          <article key={invitation.id}><div><strong>{invitation.status === "active" ? "Ready to use" : invitation.status}</strong><small>Expires {new Date(invitation.expiresAt).toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></div>{invitation.status === "active" ? <button onClick={() => revoke(invitation.id)} type="button">Revoke</button> : null}</article>
        ))}
        {invitations.length === 0 ? <div className="neutral-empty compact-empty"><span>No links yet</span><p>Create one when you are ready to invite a participant.</p></div> : null}
      </div>
    </section>
  );
}
