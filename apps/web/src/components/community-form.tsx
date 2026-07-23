"use client";

import type { CommunityStepInput } from "@pods/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buildCommunityPayload } from "../lib/wizard-payloads";
import { savePodDraftStep } from "../lib/wizard-client";

export function CommunityForm({ podId, initial }: { podId: string; initial: CommunityStepInput }) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(initial.visibility);
  const [roomAudience, setRoomAudience] = useState(
    initial.visibility === "public" ? initial.roomAudience ?? "members_only" : "members_only"
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

  return <form className="wizard-form" onSubmit={submit}>
    <fieldset className="field-block"><legend>Community space</legend><div className="visibility-grid">
      <label className={visibility === "public" ? "is-selected" : ""}><input type="radio" name="visibility" value="public" checked={visibility === "public"} onChange={() => setVisibility("public")} /><strong>Public activity</strong><span>Discoverable. Builders apply and the creator accepts.</span></label>
      <label className={visibility === "private" ? "is-selected" : ""}><input type="radio" name="visibility" value="private" checked={visibility === "private"} onChange={() => setVisibility("private")} /><strong>Private activity</strong><span>Hidden everywhere. Entry requires a valid invitation.</span></label>
    </div></fieldset>
    <div className="field-grid"><label className="field-block"><span>Minimum people</span><input type="number" name="minParticipants" min="2" defaultValue={initial.minParticipants} required /></label><label className="field-block"><span>Maximum people</span><input type="number" name="maxParticipants" min="2" defaultValue={initial.maxParticipants} required /></label></div>
    {visibility === "public" ? <>
      <label className="field-block"><span>Application questions</span><textarea name="applicationQuestions" rows={3} defaultValue={initial.visibility === "public" ? initial.applicationQuestions.join("\n") : "What will you commit to?"} /><small>One question per line. Applicants see these before acceptance.</small></label>
      <fieldset className="field-block visitor-audience-choice">
        <legend>Who can read the Pod after the roster locks?</legend>
        <label className={`visitor-audience-row ${roomAudience === "members_only" ? "is-selected" : ""}`}>
          <span className="visitor-audience-copy">
            <strong>Members only</strong>
            <small>Only locked members can read the room and public proof record.</small>
          </span>
          <input
            aria-label="Members only"
            checked={roomAudience === "members_only"}
            name="roomAudience"
            onChange={() => setRoomAudience("members_only")}
            type="radio"
            value="members_only"
          />
        </label>
        <label className={`visitor-audience-row ${roomAudience === "public_read_only" ? "is-selected" : ""}`}>
          <span className="visitor-audience-copy">
            <strong>Let visitors follow along</strong>
            <small>Anyone with the link can read the room and Pod-shared proofs. Visitors cannot react, reply, submit, or see private review and funding details.</small>
          </span>
          <input
            aria-label="Let visitors follow along"
            checked={roomAudience === "public_read_only"}
            name="roomAudience"
            onChange={() => setRoomAudience("public_read_only")}
            type="radio"
            value="public_read_only"
          />
        </label>
      </fieldset>
    </> : <label className="field-block"><span>Invitation expiry</span><select name="inviteExpiryHours" defaultValue={initial.visibility === "private" ? initial.inviteExpiryHours : 168}><option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option><option value="336">14 days</option></select></label>}
    <div className="authority-note"><strong>Creator authority</strong><span>You control enrollment and announcements. Pods team review and frozen financial terms remain outside creator control.</span></div>
    {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
    <button className="primary-action full-action" disabled={saving} type="submit">{saving ? "Saving community" : "Continue to commitment"}</button>
  </form>;
}
