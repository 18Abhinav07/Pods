"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./social-flow.module.css";

type Invitation = {
  invitationId: string;
  podId: string;
  activityName: string;
  purpose: string;
  totalLuna: number;
  occurrenceCount: number;
};

export function TargetedInvitationList({
  initialInvitations
}: {
  initialInvitations: Invitation[];
}) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function accept(invitation: Invitation) {
    if (busyId) return;
    setBusyId(invitation.invitationId);
    setError("");
    try {
      const response = await fetch(
        `/api/invitations/${invitation.invitationId}/accept`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Invitation acceptance failed");
      setInvitations((current) =>
        current.filter(({ invitationId }) => invitationId !== invitation.invitationId)
      );
      router.push(`/pods/${invitation.podId}/fund`);
    } catch {
      setError("Invitation could not be accepted.");
    } finally {
      setBusyId(null);
    }
  }

  if (invitations.length === 0) return null;

  return (
    <section className={styles.requestSection} aria-labelledby="pod-invitation-title">
      <header className={styles.sectionHeader}>
        <div>
          <span>Private Pod invitations</span>
          <h2 id="pod-invitation-title">A friend invited you</h2>
        </div>
        <small>{invitations.length}</small>
      </header>
      <div className={styles.requestList}>
        {invitations.map((invitation) => {
          const busy = busyId === invitation.invitationId;
          return (
            <article
              className={`${styles.requestCard} ${styles.invitationCard}`}
              key={invitation.invitationId}
            >
              <div className={styles.requestMeta}>
                <span>{invitation.occurrenceCount} occurrences</span>
                <span>{invitation.totalLuna / 100_000} NIM upfront</span>
              </div>
              <h3>{invitation.activityName}</h3>
              <p>{invitation.purpose}</p>
              <div className={styles.actionRow}>
                <button
                  aria-label={`Accept and fund ${invitation.activityName}`}
                  className={styles.primaryButton}
                  disabled={busy}
                  onClick={() => void accept(invitation)}
                  type="button"
                >
                  {busy ? "Accepting invitation" : "Accept and fund"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {error ? <p className={styles.errorMessage} role="alert">{error}</p> : null}
    </section>
  );
}
