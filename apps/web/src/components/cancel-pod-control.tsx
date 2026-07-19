"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cancelEnrollmentPod } from "../lib/creator-enrollment-client";

export function CancelPodControl({ podId, podName }: { podId: string; podName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      await cancelEnrollmentPod(podId);
      router.push("/my-pods");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pod could not be cancelled");
      setBusy(false);
    }
  }

  return (
    <section className="danger-zone">
      <span>Enrollment control</span>
      <h2>Cancel this Pod</h2>
      <p>Cancellation removes {podName} from discovery. The frozen contract and application history remain.</p>
      {!confirming ? (
        <button className="danger-action" onClick={() => setConfirming(true)} type="button">Cancel Pod</button>
      ) : (
        <div className="danger-confirmation">
          <strong>Cancel before any funding exists?</strong>
          <div><button disabled={busy} onClick={() => setConfirming(false)} type="button">Keep Pod</button><button className="danger-action" disabled={busy} onClick={cancel} type="button">{busy ? "Cancelling" : "Confirm cancellation"}</button></div>
        </div>
      )}
      {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
    </section>
  );
}
