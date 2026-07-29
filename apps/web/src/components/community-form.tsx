"use client";

import type { CommunityStepInput } from "@pods/domain";
import { Check } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buildCommunityPayload } from "../lib/wizard-payloads";
import { savePodDraftStep } from "../lib/wizard-client";
import styles from "./creator-flow.module.css";

export function CommunityForm({ podId, initial }: { podId: string; initial: CommunityStepInput }) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(initial.visibility);
  const [roomAudience, setRoomAudience] = useState(
    initial.visibility === "public" ? initial.roomAudience ?? "members_only" : "members_only"
  );
  const [applicationQuestions, setApplicationQuestions] = useState(
    initial.visibility === "public"
      ? initial.applicationQuestions.join("\n")
      : "What will you commit to?"
  );
  const [inviteExpiryHours, setInviteExpiryHours] = useState(
    String(initial.visibility === "private" ? initial.inviteExpiryHours : 168)
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await savePodDraftStep(podId, "community", buildCommunityPayload(new FormData(event.currentTarget)));
      router.push(`/pods/create/commitment?draft=${encodeURIComponent(podId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Community contract could not be saved");
      setSaving(false);
    }
  }

  function selectVisibility(next: "public" | "private") {
    setVisibility(next);
    if (next === "private") setRoomAudience("members_only");
  }

  return <form className={styles.form} onSubmit={submit}>
    <fieldset className={styles.field}>
      <legend className={styles.sectionLabel}>Community space</legend>
      <div className={styles.choiceGrid}>
        <label className={styles.choiceCard} data-selected={visibility === "public"}>
          <input className={styles.choiceInput} type="radio" name="visibility" value="public" checked={visibility === "public"} onChange={() => selectVisibility("public")} />
          <span className={styles.choiceCopy}><strong>Public Pod</strong><span>Listed in Discover. People apply before funding.</span></span>
          <i className={styles.choiceIndicator} aria-hidden="true">{visibility === "public" ? <Check size={14} weight="bold" /> : null}</i>
        </label>
        <label className={styles.choiceCard} data-selected={visibility === "private"}>
          <input className={styles.choiceInput} type="radio" name="visibility" value="private" checked={visibility === "private"} onChange={() => selectVisibility("private")} />
          <span className={styles.choiceCopy}><strong>Private Pod</strong><span>Hidden from discovery. Entry needs an invitation.</span></span>
          <i className={styles.choiceIndicator} aria-hidden="true">{visibility === "private" ? <Check size={14} weight="bold" /> : null}</i>
        </label>
      </div>
    </fieldset>

    {visibility === "public" ? <>
      <input name="roomAudience" type="hidden" value={roomAudience} />
      <section className={styles.switchRow}>
        <span className={styles.switchIcon} aria-hidden="true">◉</span>
        <span className={styles.switchCopy}>
          <strong>Allow read-only visitors</strong>
          <span>Visitors can watch room messages and Pod-shared proof after roster lock.</span>
        </span>
        <button
          aria-checked={roomAudience === "public_read_only"}
          aria-label="Allow read-only visitors"
          className={styles.switchControl}
          onClick={() => setRoomAudience((current) => current === "public_read_only" ? "members_only" : "public_read_only")}
          role="switch"
          type="button"
        />
      </section>
      <section className={styles.sectionCard}>
        <span className={styles.sectionLabel}>Application</span>
        <label className={styles.field}><span>Questions for applicants</span><textarea name="applicationQuestions" onChange={(event) => setApplicationQuestions(event.currentTarget.value)} rows={3} value={applicationQuestions} /><small>One question per line. You review answers before anyone can fund.</small></label>
      </section>
    </> : <section className={styles.sectionCard}><label className={styles.field}><span>Invitation expiry</span><select name="inviteExpiryHours" onChange={(event) => setInviteExpiryHours(event.currentTarget.value)} value={inviteExpiryHours}><option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option><option value="336">14 days</option></select></label></section>}

    <section className={styles.sectionCard}>
      <span className={styles.sectionLabel}>Group size</span>
      <div className={styles.twoColumn}><label className={styles.field}><span>Minimum</span><input type="number" name="minParticipants" min="2" defaultValue={initial.minParticipants} required /></label><label className={styles.field}><span>Maximum</span><input type="number" name="maxParticipants" min="2" defaultValue={initial.maxParticipants} required /></label></div>
    </section>

    <div className={styles.infoNote}><span className={styles.infoNoteIcon} aria-hidden="true"><Check size={16} weight="bold" /></span><span><strong>You review the work</strong><span>As creator, you verify member proof. You do not fund or receive participant money.</span></span></div>
    {error ? <div className={styles.error} role="alert">{error}</div> : null}
    <div className={`${styles.actionDock} ${styles.formActionDock}`}><button className={styles.primaryAction} disabled={saving} type="submit">{saving ? "Saving community" : "Continue to commitment"}</button></div>
  </form>;
}
