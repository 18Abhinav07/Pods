"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitPublicApplication } from "../lib/enrollment-client";

export function ApplicationForm({
  podId,
  questions,
  visitorConsent
}: {
  podId: string;
  questions: string[];
  visitorConsent: { contractHash: string } | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await submitPublicApplication(
        podId,
        questions.map((_, index) => String(formData.get(`answer-${index}`) ?? "")),
        visitorConsent
          ? {
              acceptedContractHash: visitorConsent.contractHash,
              visitorDisclosureAccepted: true
            }
          : fetch
      );
      router.push(`/applications?sent=1&pod=${podId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Application could not be sent");
      setSubmitting(false);
    }
  }

  return (
    <form className="application-form" onSubmit={submit}>
      {questions.length > 0 ? (
        <div className="application-questions">
          {questions.map((question, index) => (
            <label className="field-block" key={question}>
              <span>{question}</span>
              <textarea
                maxLength={500}
                minLength={2}
                name={`answer-${index}`}
                placeholder="Be concrete and honest."
                required
                rows={4}
              />
              <small>2 to 500 characters</small>
            </label>
          ))}
        </div>
      ) : (
        <div className="neutral-empty compact-empty"><span>No questions</span><p>This creator accepts a simple application request.</p></div>
      )}
      <label className="consent-row">
        <input name="understandsReservation" required type="checkbox" />
        <span>I understand that applying or being accepted does not reserve a place.</span>
      </label>
      {visitorConsent ? (
        <label className="consent-row">
          <input name="acceptsVisitorRoom" required type="checkbox" />
          <span>I accept this frozen contract and understand that, after roster lock, visitors can read the Pod room, public proof records, and public supporting images. They cannot participate or see private evidence, reviewer details, or financial data.</span>
        </label>
      ) : null}
      {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
      <button className="primary-action full-action" disabled={submitting} type="submit">
        {submitting ? "Sending application" : "Send application"}
      </button>
    </form>
  );
}
