"use client";

import { parseNimToLuna } from "@pods/domain";
import { Equals, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { savePodDraftStep } from "../lib/wizard-client";
import styles from "./creator-flow.module.css";

function formatLuna(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export function CommitmentForm({
  podId,
  occurrenceCount,
  initialNim,
  settlementMode
}: {
  podId: string;
  occurrenceCount: number;
  initialNim: string;
  settlementMode: "proportional" | "full_refund_alpha" | null;
}) {
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

  return <form className={styles.form} onSubmit={submit}>
    <section className={styles.nimHero}>
      <span className={styles.nimMark}>
        <Image alt="NIM" height={56} src="/media/nimiq-signet.svg" width={56} />
      </span>
      <label className={styles.amountField}>
        <span>Per occurrence</span>
        <span className={styles.amountInput}><input aria-label="NIM per occurrence" name="nimPerOccurrence" inputMode="decimal" value={nim} onChange={(event) => setNim(event.target.value)} required /><b>NIM</b></span>
      </label>
    </section>

    <section className={styles.equation} aria-label={`${occurrenceCount} occurrences times ${nim || "0"} NIM equals ${total} NIM maximum upfront`}>
      <div><span>Occurrences</span><strong>{occurrenceCount}</strong></div>
      <i aria-hidden="true"><X size={12} weight="bold" /></i>
      <div><span>Each</span><strong>{nim || "0"} NIM</strong></div>
      <i aria-hidden="true"><Equals size={12} weight="bold" /></i>
      <div><span>Maximum upfront</span><strong>{total} NIM</strong></div>
    </section>

    <details className={styles.details}>
      <summary>How settlement works</summary>
      <div className={styles.detailsBody}>
        {settlementMode === "proportional"
          ? "Approved work returns its own slice and may earn from rejected or missed slices in the same occurrence. Timeout-protected principal never enters the bonus pool."
          : settlementMode === "full_refund_alpha"
            ? "This immutable Testnet contract returns the complete commitment after roster lock. Activity outcomes still build the progress record."
            : "The exact settlement rule will appear in the frozen contract before publication. Nothing is published from this screen."}
      </div>
    </details>

    <div className={styles.infoNote}><span className={styles.infoNoteIcon} aria-hidden="true"><Image alt="" height={16} src="/media/nimiq-signet.svg" width={16} /></span><span><strong>Funded upfront by participants</strong><span>You set the cadence and review proof. You never fund this Pod or receive participant money.</span></span></div>
    {error ? <div className={styles.error} role="alert">{error}</div> : null}
    <div className={styles.actionDock}><button className={styles.primaryAction} disabled={saving} type="submit">{saving ? "Saving commitment" : "Review frozen contract"}</button></div>
  </form>;
}
