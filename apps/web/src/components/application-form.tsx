"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitPublicApplication } from "../lib/enrollment-client";
import styles from "./acquisition-flow.module.css";

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
  const [answers, setAnswers] = useState(() => questions.map(() => ""));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isReview = step === questions.length;
  const question = questions[step];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isReview) {
      setStep((current) => current + 1);
      return;
    }
    setSubmitting(true);
    try {
      await submitPublicApplication(
        podId,
        answers,
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
    <form className={`application-form ${styles.applicationForm}`} onSubmit={submit}>
      {!isReview && question ? (
        <section className={styles.questionStep}>
          <p aria-live="polite" className={styles.stepLabel}>Question {step + 1} of {questions.length}</p>
          <label htmlFor={`answer-${step}`}>
            <span>{question}</span>
          </label>
          <textarea
            id={`answer-${step}`}
            maxLength={500}
            minLength={2}
            name={`answer-${step}`}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setAnswers((current) =>
                current.map((answer, index) => index === step ? value : answer)
              );
            }}
            placeholder="Be concrete and honest."
            required
            rows={5}
            value={answers[step]}
          />
          <small>2 to 500 characters</small>
        </section>
      ) : (
        <section className={styles.reviewStep}>
          <p aria-live="polite" className={styles.stepLabel}>
            {questions.length > 0 ? `Step ${questions.length + 1} of ${questions.length + 1}` : "Ready to apply"}
          </p>
          <h2>Review and consent</h2>
          {questions.length > 0 ? (
            <dl className={styles.answerReview}>
              {questions.map((reviewQuestion, index) => (
                <div key={reviewQuestion}>
                  <dt>{reviewQuestion}</dt>
                  <dd>{answers[index]}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>This creator accepts a simple application request.</p>
          )}
          <label className={styles.consentRow}>
            <input name="understandsReservation" required type="checkbox" />
            <span>I understand that applying or being accepted does not reserve a place.</span>
          </label>
          {visitorConsent ? (
            <label className={styles.consentRow}>
              <input name="acceptsVisitorRoom" required type="checkbox" />
              <span>I accept this frozen contract and understand that, after roster lock, visitors can read the Pod room, public proof records, and public supporting images. They cannot participate or see creator-only evidence, private decision notes, or financial data.</span>
            </label>
          ) : null}
        </section>
      )}
      {error ? <div className={styles.inlineError} role="alert"><span>{error}</span></div> : null}
      <div className={styles.formActions}>
        {step > 0 ? (
          <button
            className={styles.secondaryAction}
            disabled={submitting}
            onClick={() => {
              setError("");
              setStep((current) => current - 1);
            }}
            type="button"
          >
            Back
          </button>
        ) : null}
        <button className={styles.primaryAction} disabled={submitting} type="submit">
          {isReview
            ? submitting ? "Sending application" : "Send application"
            : step === questions.length - 1 ? "Review application" : "Next question"}
        </button>
      </div>
    </form>
  );
}
