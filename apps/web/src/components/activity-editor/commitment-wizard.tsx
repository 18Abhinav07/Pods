"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  GitCommit,
  GitPullRequest,
  GlobeSimple,
  ListChecks
} from "@phosphor-icons/react";
import type { BuildDeliverableType } from "@pods/domain";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { formatZonedMoment } from "../../lib/format-moment";
import { deliverableLabel } from "./build-editor";
import { FlowProgress } from "./flow-progress";

const deliverableIcons: Record<
  BuildDeliverableType,
  typeof GitPullRequest
> = {
  pull_request: GitPullRequest,
  commit: GitCommit,
  issue: ListChecks,
  live_artifact: GlobeSimple
};

export function CommitmentWizard({
  allowedDeliverables,
  busy,
  closesAt,
  deliverableType,
  goal,
  onDeliverableType,
  onGoal,
  onTask,
  projectTheme,
  task,
  templateId,
  timeZone
}: {
  allowedDeliverables: readonly BuildDeliverableType[];
  busy: boolean;
  closesAt: string | null;
  deliverableType: BuildDeliverableType;
  goal: string;
  onDeliverableType: (value: BuildDeliverableType) => void;
  onGoal: (value: string) => void;
  onTask: (value: string) => void;
  projectTheme: string;
  task: string;
  templateId: "build" | "create";
  timeZone: string;
}) {
  const [step, setStep] = useState(0);
  const reduceMotion = useReducedMotion();
  const isCreate = templateId === "create";
  const commitment = isCreate ? goal : task;
  const commitmentReady = commitment.trim().length >= 12;
  const labels = isCreate
    ? ["Define", "Check", "Lock"]
    : ["Define", "Proof type", "Lock"];

  function advance() {
    setStep((current) => Math.min(labels.length - 1, current + 1));
  }

  function back() {
    setStep((current) => Math.max(0, current - 1));
  }

  return (
    <>
      <FlowProgress
        ariaLabel="Commitment progress"
        labels={labels}
        step={step}
      />
      <motion.section
        animate={{ opacity: 1, x: 0 }}
        className="flow-stage"
        initial={reduceMotion ? false : { opacity: 0, x: 14 }}
        key={step}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
          {step === 0 ? (
            <>
              <header className="flow-stage-heading">
                <span>{isCreate ? "Today's output" : "Today's finish"}</span>
                <h2>{isCreate ? "Name today's output." : "Name today's finish."}</h2>
                <p>
                  {isCreate
                    ? "Choose one concrete result you can show when the session closes."
                    : "Write one result another builder can verify without guessing."}
                </p>
              </header>
              <label htmlFor={isCreate ? "create-goal" : "occurrence-task"}>
                {isCreate ? "Output goal" : "Today's task"}
              </label>
              <textarea
                id={isCreate ? "create-goal" : "occurrence-task"}
                maxLength={240}
                minLength={12}
                onChange={(event) => {
                  if (isCreate) onGoal(event.target.value);
                  else onTask(event.target.value);
                }}
                placeholder={
                  isCreate
                    ? "Complete one finished character color study."
                    : "Ship the mobile evidence capture and review states."
                }
                required
                rows={5}
                value={commitment}
              />
              <div className="flow-character-count">
                <span>One clear promise</span>
                <b>{commitment.length}/240</b>
              </div>
            </>
          ) : null}

          {step === 1 && !isCreate ? (
            <>
              <header className="flow-stage-heading">
                <span>Proof type</span>
                <h2>Choose how the work will be verified.</h2>
                <p>The final link must match this choice and the task you locked.</p>
              </header>
              <fieldset className="deliverable-choice-grid is-visual-choice">
                <legend>Visible deliverable</legend>
                {allowedDeliverables.map((value) => {
                  const Icon = deliverableIcons[value];
                  return (
                    <label
                      className={deliverableType === value ? "is-selected" : ""}
                      key={value}
                    >
                      <input
                        checked={deliverableType === value}
                        name="deliverable"
                        onChange={() => onDeliverableType(value)}
                        type="radio"
                        value={value}
                      />
                      <Icon aria-hidden="true" size={23} weight="regular" />
                      <span>{deliverableLabel(value)}</span>
                      <i aria-hidden="true">
                        {deliverableType === value
                          ? <Check size={13} weight="bold" />
                          : null}
                      </i>
                    </label>
                  );
                })}
              </fieldset>
            </>
          ) : null}

          {step === 1 && isCreate ? (
            <>
              <header className="flow-stage-heading">
                <span>Match the ritual</span>
                <h2>Check the promise.</h2>
                <p>Your creator will compare the finished proof with this locked output.</p>
              </header>
              <div className="commitment-review-block">
                <span>Practice</span>
                <strong>{projectTheme}</strong>
                <p>{goal}</p>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <header className="flow-stage-heading">
                <span>Final check</span>
                <h2>Make it official.</h2>
                <p>After this moment, the promise stays fixed for the occurrence.</p>
              </header>
              <div className="commitment-review-block">
                <span>{isCreate ? "Output goal" : "Task"}</span>
                <strong>{commitment}</strong>
                {!isCreate ? <p>{deliverableLabel(deliverableType)}</p> : null}
              </div>
              <aside className="activity-lock-disclosure">
                <strong>
                  Lock by{" "}
                  {closesAt
                    ? formatZonedMoment(closesAt, { timeZone })
                    : "the commitment cutoff"}
                </strong>
                <p>
                  Once locked, this {isCreate ? "goal" : "task"} cannot be changed
                  for this occurrence.
                </p>
              </aside>
            </>
          ) : null}
      </motion.section>

      <footer className="flow-action-dock">
        {step > 0 ? (
          <button className="flow-back-action" onClick={back} type="button">
            <ArrowLeft aria-hidden="true" size={18} />
            Back
          </button>
        ) : <span />}
        {step < 2 ? (
          <button
            className="flow-primary-action"
            disabled={step === 0 && !commitmentReady}
            onClick={(event) => {
              event.preventDefault();
              advance();
            }}
            type="button"
          >
            {step === 0
              ? isCreate ? "Review goal" : "Choose proof type"
              : "Review commitment"}
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        ) : (
          <button
            className="flow-primary-action"
            disabled={busy}
            type="submit"
          >
            {busy
              ? "Locking"
              : isCreate ? "Lock this goal" : "Lock this task"}
            <Check aria-hidden="true" size={18} weight="bold" />
          </button>
        )}
      </footer>
    </>
  );
}
