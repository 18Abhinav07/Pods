"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { establishWalletSession } from "../lib/nimiq-wallet-client";
import { useHydrated } from "../lib/use-hydrated";

type ConnectState = "idle" | "connecting" | "signing" | "error";

export function ConnectClient({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [state, setState] = useState<ConnectState>("idle");
  const [error, setError] = useState("");

  async function connect() {
    setError("");
    setState("connecting");
    try {
      setState("signing");
      const session = await establishWalletSession();
      router.replace(
        session.needsProfile
          ? `/onboarding/profile?returnTo=${encodeURIComponent(returnTo)}`
          : returnTo
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet connection failed");
      setState("error");
    }
  }

  const pending = state === "connecting" || state === "signing";

  return (
    <div className="connect-panel">
      <p className="eyebrow">Enter Pods</p>
      <h1>Your wallet is your key.</h1>
      <p className="screen-copy">
        Sign once in Nimiq Pay. No password and no NIM leaves your wallet.
      </p>
      {error ? (
        <div className="inline-error" role="alert">
          <strong>Connection paused</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <button className="primary-action full-action" disabled={!hydrated || pending} onClick={connect} type="button">
        {pending ? "Waiting for Nimiq Pay" : error ? "Try wallet again" : "Connect Nimiq wallet"}
      </button>
      <p className="fine-print">Signing only verifies ownership.</p>
    </div>
  );
}
