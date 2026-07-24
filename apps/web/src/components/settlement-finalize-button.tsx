"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettlementFinalizeButton({ podId }: { podId: string }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function finalize() {
    if (working) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/pods/${podId}/admin/settlement`, {
        method: "POST"
      });
      const data = (await response.json()) as { error?: unknown };
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Settlement could not be finalized"
        );
      }
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Settlement could not be finalized"
      );
      setWorking(false);
    }
  }

  return (
    <div className="settlement-finalize">
      <button
        className="primary-action full-action"
        disabled={working}
        onClick={finalize}
        type="button"
      >
        {working ? "Calculating settlement" : "Finalize now"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
