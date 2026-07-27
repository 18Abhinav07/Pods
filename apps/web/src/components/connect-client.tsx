"use client";

import { ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { establishWalletSession } from "../lib/nimiq-wallet-client";
import { useHydrated } from "../lib/use-hydrated";
import styles from "./entry-flow.module.css";

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
    <div className={styles.connectPanel}>
      <div className={styles.connectCopy}>
        <h1>Connect your wallet</h1>
        <p>One signature creates your Pods account.</p>
      </div>
      <div className={styles.walletPromise}>
        <ShieldCheck aria-hidden="true" />
        <span>
          <strong>Private identity</strong>
          <small>Your public profile never displays your wallet address.</small>
        </span>
      </div>
      {error ? (
        <div className={styles.inlineError} role="alert">
          <strong>Connection paused</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className={styles.connectAction}>
        <button
          className={styles.primaryButton}
          disabled={!hydrated || pending}
          onClick={connect}
          type="button"
        >
          <span>{pending ? "Waiting for Nimiq Pay" : error ? "Try wallet again" : "Connect wallet"}</span>
          <i aria-hidden="true"><ArrowRight weight="bold" /></i>
        </button>
        <p className={styles.connectNote}>Testnet beta. Test NIM has no real-world value.</p>
      </div>
    </div>
  );
}
