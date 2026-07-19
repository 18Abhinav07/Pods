"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { publishPodDraft } from "../lib/wizard-client";

export function PublishClient({ podId }: { podId: string }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  async function publish() {
    setError("");
    setPublishing(true);
    try {
      await publishPodDraft(podId);
      router.replace(`/pods/${podId}/rules`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pod could not be published");
      setPublishing(false);
    }
  }

  return <div className="publish-block">
    <label className="frozen-check"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span><strong>Freeze this contract</strong>I understand that schedule, evidence, verification, stake, and payout terms cannot be edited after publication.</span></label>
    {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
    <button className="primary-action full-action" disabled={!accepted || publishing} onClick={publish} type="button">{publishing ? "Publishing contract" : "Publish Pod"}</button>
  </div>;
}
