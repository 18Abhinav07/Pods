"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WalletSessionSwitcher() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function switchWallet() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Wallet session could not be ended");
      router.push("/connect?returnTo=%2Ftoday");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet session could not be ended");
      setPending(false);
    }
  }

  return (
    <>
      <button
        className="secondary-action full-action"
        type="button"
        disabled={pending}
        onClick={switchWallet}
      >
        {pending ? "Ending wallet session" : "Sign out and switch wallet"}
      </button>
      {error ? <p className="inline-error" role="alert">{error}</p> : null}
    </>
  );
}
