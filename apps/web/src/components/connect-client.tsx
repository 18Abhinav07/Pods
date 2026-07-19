"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { establishWalletSession } from "../lib/nimiq-wallet-client";

type ConnectState = "idle" | "connecting" | "signing" | "error";

export function ConnectClient({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [state, setState] = useState<ConnectState>("idle");
  const [error, setError] = useState("");

  async function connect() {
    setError("");
    setState("connecting");
    try {
      setState("signing");
      await establishWalletSession();
      router.replace(returnTo);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet connection failed");
      setState("error");
    }
  }

  const pending = state === "connecting" || state === "signing";

  return (
    <div className="connect-panel">
      <div className="wallet-glyph" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="eyebrow">Nimiq wallet identity</p>
      <h1>One signature. No account form.</h1>
      <p className="screen-copy">
        Pods asks Nimiq Pay to sign a one-time message. Signing proves wallet
        ownership and never sends NIM.
      </p>
      <ol className="connection-steps" aria-label="Connection steps">
        <li className={state !== "idle" ? "is-active" : ""}>Open Nimiq Pay</li>
        <li className={state === "signing" ? "is-active" : ""}>Sign challenge</li>
        <li>Enter Pods</li>
      </ol>
      {error ? (
        <div className="inline-error" role="alert">
          <strong>Connection paused</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <button className="primary-action full-action" disabled={pending} onClick={connect} type="button">
        {pending ? "Waiting for Nimiq Pay" : error ? "Try wallet again" : "Connect Nimiq wallet"}
      </button>
      <p className="fine-print">The session stays on this device for seven days.</p>
    </div>
  );
}
