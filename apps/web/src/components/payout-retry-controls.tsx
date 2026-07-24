"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PayoutRetryControls({ legId }: { legId: string }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working) return;
    const form = new FormData(event.currentTarget);
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/ops/transfers/${legId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: String(form.get("reason") ?? "") })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Payout could not be retried");
      }
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Payout could not be retried"
      );
      setWorking(false);
    }
  }

  return (
    <form className="payout-retry-controls" onSubmit={submit}>
      <label>
        Audit reason
        <textarea
          defaultValue="A fresh chain check is required before replacement."
          maxLength={500}
          minLength={10}
          name="reason"
          required
          rows={2}
        />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="primary-action" disabled={working} type="submit">
        {working ? "Rechecking" : "Recheck and retry"}
      </button>
    </form>
  );
}
