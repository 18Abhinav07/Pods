"use client";

import { parseNimToLuna } from "@pods/domain";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { savePodDraftStep } from "../lib/wizard-client";

function formatLuna(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export function CommitmentForm({ podId, occurrenceCount, initialNim }: { podId: string; occurrenceCount: number; initialNim: string }) {
  const router = useRouter();
  const [nim, setNim] = useState(initialNim);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const total = useMemo(() => {
    try { return formatLuna(parseNimToLuna(nim) * occurrenceCount); } catch { return "0"; }
  }, [nim, occurrenceCount]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await savePodDraftStep(podId, "commitment", { nimPerOccurrence: nim });
      router.push(`/pods/create/review?draft=${encodeURIComponent(podId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Commitment could not be saved");
      setSaving(false);
    }
  }

  return <form className="wizard-form" onSubmit={submit}>
    <label className="field-block commitment-input"><span>NIM per occurrence</span><div><input name="nimPerOccurrence" inputMode="decimal" value={nim} onChange={(event) => setNim(event.target.value)} required /><b>NIM</b></div><small>Every participant funds the maximum commitment upfront.</small></label>
    <div className="commitment-math"><div><span>Occurrences</span><strong>{occurrenceCount}</strong></div><i>×</i><div><span>Per occurrence</span><strong>{nim || "0"} NIM</strong></div><i>=</i><div className="is-total"><span>Total upfront</span><strong>{total} NIM</strong></div></div>
    <div className="outcome-compact"><div><span>Approved</span><b>Principal + bonus eligible</b></div><div><span>Timeout or grace</span><b>Principal protected</b></div><div><span>Rejected or missed</span><b>Slice provisionally forfeited</b></div></div>
    <div className="authority-note"><strong>Centralized verification</strong><span>Evidence is reviewed by the Pods team. Creators and participants do not vote on financial outcomes.</span></div>
    {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
    <button className="primary-action full-action" disabled={saving} type="submit">{saving ? "Saving commitment" : "Review frozen contract"}</button>
  </form>;
}
