"use client";

import { FormEvent, useState } from "react";

export function ReportProfileForm({ handle }: { handle: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    const response = await fetch("/api/social/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, reason: data.get("reason"), details: data.get("details") })
    });
    if (response.ok) setState("sent");
    else { setError("Report could not be sent. Check the details and try again."); setState("idle"); }
  }
  if (state === "sent") return <section className="report-sent"><span>Report received</span><h2>Thank you for protecting the room.</h2><p>Blocking remains available separately and never changes shared Pod financial obligations.</p></section>;
  return <form className="report-profile-form" onSubmit={submit}><label htmlFor="report-reason">Reason</label><select id="report-reason" name="reason" required><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="unsafe_content">Unsafe content</option><option value="other">Other</option></select><label htmlFor="report-details">What happened?</label><textarea id="report-details" maxLength={1000} minLength={5} name="details" required rows={7} />{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-action full-action" disabled={state === "sending"} type="submit">{state === "sending" ? "Sending report" : "Send private report"}</button></form>;
}
