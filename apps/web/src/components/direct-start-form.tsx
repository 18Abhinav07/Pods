"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function DirectStartForm({ handle, friend }: { handle: string; friend: boolean }) {
  const router = useRouter();
  const [introduction, setIntroduction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, introduction })
    });
    const payload = (await response.json()) as {
      error?: string;
      conversation?: { id: string };
      visibleState?: "active" | "pending";
    };
    if (!response.ok || !payload.conversation) {
      setError(payload.error ?? "Conversation could not be opened");
      setBusy(false);
      return;
    }
    router.replace(payload.visibleState === "active" ? `/messages/${payload.conversation.id}` : "/messages?view=requests&sent=1");
  }
  return <form className="direct-start-form" onSubmit={submit}><div className="direct-start-orbit" aria-hidden="true"><i /><i /><i /></div><span>{friend ? "Friend message" : "Message request"}</span><h1>{friend ? `Message @${handle}` : `Introduce yourself to @${handle}`}</h1><p>{friend ? "Friends enter a private conversation immediately." : "They will see your identity, shared-Pod context, and this plain-text introduction before choosing Accept, Discard, or Block."}</p><label htmlFor="direct-introduction">{friend ? "First message" : "Introduction"}</label><textarea id="direct-introduction" maxLength={500} minLength={1} onChange={(event) => setIntroduction(event.target.value)} placeholder={friend ? "Share something useful..." : "Why would you like to connect?"} required rows={5} value={introduction} /><small>{introduction.length}/500 · links and media unlock after acceptance</small>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-action full-action" disabled={busy || !introduction.trim()} type="submit">{busy ? "Opening conversation" : friend ? "Send message" : "Send one request"}</button></form>;
}
