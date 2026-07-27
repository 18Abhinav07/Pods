"use client";

import { ArrowRight, SpinnerGap } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./settlement-flow.module.css";

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
    <div className={styles.finalize}>
      <button
        className={styles.primaryAction}
        disabled={working}
        onClick={finalize}
        type="button"
      >
        <span>{working ? "Calculating settlement" : "Finalize now"}</span>
        {working ? (
          <SpinnerGap
            aria-hidden="true"
            className={styles.spinner}
            weight="bold"
          />
        ) : (
          <ArrowRight aria-hidden="true" weight="bold" />
        )}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
