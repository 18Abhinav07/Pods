"use client";

import { ArrowRight, Check } from "@phosphor-icons/react";
import type { TemplateId } from "@pods/domain";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { FlowProgress } from "../activity-editor/flow-progress";
import styles from "./activity-ritual.module.css";

const labels = ["Result", "Evidence", "Visibility", "Review"] as const;

export type ProofReviewRow = {
  label: string;
  value: string;
};

export function ProofWizard({
  busy,
  canContinueEvidence,
  canContinueResult,
  canSubmit,
  deliverable,
  draftState,
  error,
  evidenceControls,
  lockedTask,
  occurrenceOrdinal,
  onStep,
  privacyControls,
  reviewerKind,
  resultEditor,
  reviewRows,
  step,
  templateId
}: {
  busy: boolean;
  canContinueEvidence: boolean;
  canContinueResult: boolean;
  canSubmit: boolean;
  deliverable?: string | null;
  draftState: "idle" | "saving" | "saved";
  error: string;
  evidenceControls: ReactNode;
  lockedTask?: string | null;
  occurrenceOrdinal: number;
  onStep: (step: number) => void;
  privacyControls: ReactNode;
  reviewerKind: "creator" | "pods_team";
  resultEditor: ReactNode;
  reviewRows: ProofReviewRow[];
  step: number;
  templateId: TemplateId;
}) {
  const reduceMotion = useReducedMotion();
  const reviewerLabel = reviewerKind === "pods_team"
    ? "Pods Team"
    : "Pod creator";
  const stageHeadings = [
    {
      eyebrow: "Result",
      title: "What did you finish?",
      detail: `Be specific. The ${reviewerLabel} compares this result with the activity rule.`
    },
    {
      eyebrow: "Evidence",
      title: "Make the work visible.",
      detail: "Add the evidence this activity requires. You can replace it before submission."
    },
    {
      eyebrow: "Visibility",
      title: "Choose who sees the proof.",
      detail: `The ${reviewerLabel} always receives the complete proof for review.`
    },
    {
      eyebrow: "Review",
      title: "One last check.",
      detail: "Your proof and visibility become immutable after submission."
    }
  ] as const;
  const heading = stageHeadings[step] ?? stageHeadings[0];

  return (
    <section
      className={styles.proofWizard}
      data-proof-wizard
      data-template={templateId}
    >
      <FlowProgress ariaLabel="Proof progress" labels={labels} step={step} />

      <motion.section
        animate={{ opacity: 1, x: 0 }}
        className={styles.proofStage}
        data-flow-stage
        initial={reduceMotion ? false : { opacity: 0, x: 12 }}
        key={step}
        transition={{
          duration: reduceMotion ? 0 : 0.22,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        <header className={styles.proofHeading}>
          <span>{heading.eyebrow}</span>
          <h2>{heading.title}</h2>
          <p>{heading.detail}</p>
        </header>

        {step === 0 ? (
          <>
            {lockedTask ? (
              <aside className={styles.lockedRail}>
                <div>
                  <span>Locked for occurrence {String(occurrenceOrdinal).padStart(2, "0")}</span>
                  <strong>{lockedTask}</strong>
                </div>
                {deliverable ? <small>{deliverable}</small> : null}
              </aside>
            ) : null}
            <div className={styles.resultEditor}>{resultEditor}</div>
          </>
        ) : null}

        {step === 1 ? evidenceControls : null}
        {step === 2 ? privacyControls : null}

        {step === 3 ? (
          <dl className={styles.reviewSummary}>
            {reviewRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </motion.section>

      {error ? <p className={styles.formError} role="alert">{error}</p> : null}

      <p
        aria-live="polite"
        className={styles.draftState}
        data-state={draftState}
      >
        {draftState === "saving"
          ? "Saving draft"
          : draftState === "saved"
            ? "Draft saved"
            : "Changes save automatically"}
      </p>

      <footer className={styles.wizardDock}>
        {step > 0 ? (
          <button
            className={styles.secondaryAction}
            onClick={() => onStep(Math.max(0, step - 1))}
            type="button"
          >
            Previous
          </button>
        ) : <span />}

        {step < 3 ? (
          <button
            className={styles.primaryAction}
            disabled={
              step === 0
                ? !canContinueResult
                : step === 1
                  ? !canContinueEvidence
                  : false
            }
            onClick={(event) => {
              event.preventDefault();
              onStep(Math.min(3, step + 1));
            }}
            type="button"
          >
            <span>
              {step === 0
                ? "Continue to evidence"
                : step === 1
                  ? "Continue to visibility"
                  : "Review submission"}
            </span>
            <span aria-hidden="true" className={styles.actionIcon}>
              <ArrowRight size={18} weight="bold" />
            </span>
          </button>
        ) : (
          <button
            className={styles.primaryAction}
            disabled={busy || !canSubmit}
            type="submit"
          >
            <span>
              {busy
                ? "Submitting"
                : reviewerKind === "pods_team"
                  ? "Submit to Pods Team"
                  : "Submit to creator"}
            </span>
            <span aria-hidden="true" className={styles.actionIcon}>
              <Check size={18} weight="bold" />
            </span>
          </button>
        )}
      </footer>
    </section>
  );
}
