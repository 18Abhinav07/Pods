"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function OpsConnectForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/ops/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, returnTo })
      });
      const body = (await response.json()) as { error?: string; returnTo?: string };
      if (!response.ok) throw new Error(body.error ?? "Reviewer access failed");
      router.replace(body.returnTo ?? "/ops/public-safety");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reviewer access failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ops-connect-card" onSubmit={submit}>
      <label htmlFor="ops-access-token">Pods operations access token</label>
      <input
        autoComplete="current-password"
        id="ops-access-token"
        onChange={(event) => setAccessToken(event.target.value)}
        required
        type="password"
        value={accessToken}
      />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="primary-action full-action" disabled={submitting} type="submit">
        {submitting ? "Checking access" : "Open public safety workspace"}
      </button>
    </form>
  );
}
