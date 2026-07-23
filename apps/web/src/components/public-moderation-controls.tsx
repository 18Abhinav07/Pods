"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublicModerationControls({
  reportId
}: {
  reportId: string;
}) {
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
      const response = await fetch(
        `/api/ops/public-safety/reports/${reportId}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: String(form.get("action") ?? ""),
            reason: String(form.get("reason") ?? "")
          })
        }
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Action could not be applied");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action could not be applied");
      setWorking(false);
    }
  }

  return (
    <form className="public-moderation-controls" onSubmit={submit}>
      <label>
        Action
        <select defaultValue="suppress_content" name="action">
          <option value="suppress_content">Hide from public room</option>
          <option value="restore_content">Restore to public room</option>
          <option value="suspend_room">Suspend public room</option>
          <option value="restore_room">Restore public room</option>
          <option value="dismiss_report">Dismiss report</option>
        </select>
      </label>
      <label>
        Audit reason
        <textarea
          defaultValue="Reviewed by Pods public safety operations."
          maxLength={1000}
          minLength={5}
          name="reason"
          required
          rows={3}
        />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="primary-action" disabled={working} type="submit">
        {working ? "Applying" : "Apply action"}
      </button>
    </form>
  );
}
