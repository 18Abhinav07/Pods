"use client";

import {
  ArrowRight,
  Check,
  GitCommit,
  GitPullRequest,
  GlobeSimple,
  ListChecks,
  LockSimple,
  PaintBrushBroad
} from "@phosphor-icons/react";
import type { BuildDeliverableType } from "@pods/domain";
import { motion, useReducedMotion } from "motion/react";

import { formatZonedMoment } from "../../lib/format-moment";
import styles from "../activity-ritual/activity-ritual.module.css";
import { deliverableLabel } from "./build-editor";
import { FlowProgress } from "./flow-progress";

const deliverableIcons: Record<BuildDeliverableType, typeof GitPullRequest> = {
  pull_request: GitPullRequest,
  commit: GitCommit,
  issue: ListChecks,
  live_artifact: GlobeSimple
};

const deliverableDescriptions: Record<BuildDeliverableType, string> = {
  pull_request: "Best for a reviewable feature or fix.",
  commit: "Best for a focused code or content change.",
  issue: "Best when completion closes a tracked task.",
  live_artifact: "Best for a deployed page, demo, or release."
};

const buildHints = [
  "Merge a reviewable pull request",
  "Publish the two-wallet demo",
  "Close the funding-state issue"
] as const;

function specificity(value: string) {
  const length = value.trim().length;
  if (length >= 36) return { label: "Specific enough", segments: 4 };
  if (length >= 24) return { label: "Nearly there", segments: 3 };
  if (length >= 12) return { label: "Getting clearer", segments: 2 };
  return { label: "Add a concrete result", segments: 1 };
}

export function CommitmentWizard({
  allowedDeliverables,
  busy,
  closesAt,
  deliverableType,
  fullReturnAlpha,
  goal,
  occurrenceOrdinal,
  onDeliverableType,
  onGoal,
  onStep,
  onTask,
  projectTheme,
  reviewerKind,
  stakeNim,
  step,
  task,
  templateId,
  timeZone
}: {
  allowedDeliverables: readonly BuildDeliverableType[];
  busy: boolean;
  closesAt: string;
  deliverableType: BuildDeliverableType;
  fullReturnAlpha: boolean;
  goal: string;
  occurrenceOrdinal: number;
  onDeliverableType: (value: BuildDeliverableType) => void;
  onGoal: (value: string) => void;
  onStep: (value: number) => void;
  onTask: (value: string) => void;
  projectTheme: string;
  reviewerKind: "creator" | "pods_team";
  stakeNim: number;
  step: number;
  task: string;
  templateId: "build" | "create";
  timeZone: string;
}) {
  const reduceMotion = useReducedMotion();
  const isCreate = templateId === "create";
  const commitment = isCreate ? goal : task;
  const commitmentReady = commitment.trim().length >= 12;
  const labels = isCreate
    ? ["Define", "Check", "Lock"]
    : ["Define", "Proof", "Lock"];
  const commitmentSpecificity = specificity(commitment);
  const reviewerReference = reviewerKind === "pods_team"
    ? "The Pods Team"
    : "The Pod creator";

  function advance() {
    onStep(Math.min(labels.length - 1, step + 1));
  }

  return (
    <section className={styles.wizard}>
      <FlowProgress
        ariaLabel="Commitment progress"
        labels={labels}
        step={step}
      />

      <motion.section
        animate={{ opacity: 1, x: 0 }}
        className={styles.wizardStage}
        data-flow-stage
        initial={reduceMotion ? false : { opacity: 0, x: 12 }}
        key={step}
        transition={{
          duration: reduceMotion ? 0 : 0.22,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {step === 0 ? (
          <>
            <header className={styles.stageHeading}>
              <span>Name the finish line</span>
              <h2>What will be true when today is done?</h2>
              <p>
                Make it specific enough that another person can verify the
                result without guessing.
              </p>
            </header>

            <div className={styles.statementEditor}>
              <label htmlFor={isCreate ? "create-goal" : "occurrence-task"}>
                {isCreate ? "Today I will make" : "Today I will"}
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
                    ? "finish one complete character color study"
                    : "ship one concrete result"
                }
                required
                rows={4}
                value={commitment}
              />
              <div className={styles.specificity}>
                <span>{commitmentSpecificity.label}</span>
                <div aria-hidden="true" className={styles.specificityMeter}>
                  {[0, 1, 2, 3].map((index) => (
                    <i
                      data-active={index < commitmentSpecificity.segments}
                      key={index}
                    />
                  ))}
                </div>
                <strong>{commitment.length}/240</strong>
              </div>
            </div>

            {!isCreate ? (
              <div className={styles.promptHints}>
                <span>Need a sharper start?</span>
                <div>
                  {buildHints.map((hint) => (
                    <button
                      key={hint}
                      onClick={(event) => {
                        event.preventDefault();
                        onTask(hint);
                      }}
                      type="button"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 1 && !isCreate ? (
          <>
            <header className={styles.stageHeading}>
              <span>Choose the artifact</span>
              <h2>How will the room know?</h2>
              <p>
                Pick the artifact that best proves this commitment. You will
                add the link or image later.
              </p>
            </header>
            <fieldset className={styles.artifactList}>
              <legend className={styles.visuallyHidden}>Proof type</legend>
              {allowedDeliverables.map((value) => {
                const Icon = deliverableIcons[value];
                const selected = deliverableType === value;
                return (
                  <label data-selected={selected} key={value}>
                    <input
                      checked={selected}
                      name="deliverable"
                      onChange={() => onDeliverableType(value)}
                      type="radio"
                      value={value}
                    />
                    <span className={styles.artifactIcon}>
                      <Icon aria-hidden="true" size={22} weight="regular" />
                    </span>
                    <span className={styles.artifactCopy}>
                      <strong>{deliverableLabel(value)}</strong>
                      <small>{deliverableDescriptions[value]}</small>
                    </span>
                    <span aria-hidden="true" className={styles.choiceCheck}>
                      {selected ? <Check size={13} weight="bold" /> : null}
                    </span>
                  </label>
                );
              })}
            </fieldset>
            <p className={styles.artifactExample}>
              Expected later: a public URL plus an optional Pod-visible image.
            </p>
          </>
        ) : null}

        {step === 1 && isCreate ? (
          <>
            <header className={styles.stageHeading}>
              <span>Match the ritual</span>
              <h2>Check the promise.</h2>
              <p>
                {reviewerReference} compares your finished proof with this
                exact locked output.
              </p>
            </header>
            <article className={styles.promiseCheck}>
              <span className={styles.promiseIcon}>
                <PaintBrushBroad aria-hidden="true" size={26} />
              </span>
              <div>
                <small>Practice</small>
                <strong>{projectTheme}</strong>
                <p>{goal}</p>
              </div>
              <Check aria-hidden="true" size={18} weight="bold" />
            </article>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <header className={styles.stageHeading}>
              <span>Final check</span>
              <h2>Make it real.</h2>
              <p>
                After locking, the commitment cannot be made easier for this
                occurrence.
              </p>
            </header>
            <article className={styles.sealStage}>
              <div className={styles.sealMeta}>
                <span>
                  Occurrence {String(occurrenceOrdinal).padStart(2, "0")}
                </span>
                <strong>Ready to lock</strong>
              </div>
              <span className={styles.sealIcon}>
                {isCreate
                  ? <PaintBrushBroad aria-hidden="true" size={28} />
                  : <GitPullRequest aria-hidden="true" size={28} />}
              </span>
              <h3>{commitment}</h3>
              <div className={styles.sealFacts}>
                <div>
                  <span>{fullReturnAlpha ? "Activity slice" : "At risk"}</span>
                  <strong>{stakeNim} NIM</strong>
                </div>
                <div>
                  <span>Proof</span>
                  <strong>
                    {isCreate
                      ? "Creative artifact"
                      : deliverableLabel(deliverableType)}
                  </strong>
                </div>
                <div>
                  <span>Due</span>
                  <strong>{formatZonedMoment(closesAt, { timeZone })}</strong>
                </div>
              </div>
            </article>
            <aside className={styles.lockDisclosure}>
              <LockSimple aria-hidden="true" size={22} />
              <p>
                {reviewerReference} reviews your proof. The locked promise
                cannot be changed for this occurrence.
              </p>
            </aside>
          </>
        ) : null}
      </motion.section>

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
        {step < 2 ? (
          <button
            className={styles.primaryAction}
            disabled={step === 0 && !commitmentReady}
            onClick={(event) => {
              event.preventDefault();
              advance();
            }}
            type="button"
          >
            <span>
              {step === 0
                ? isCreate ? "Check promise" : "Choose proof"
                : "Review commitment"}
            </span>
            <span aria-hidden="true" className={styles.actionIcon}>
              <ArrowRight size={18} weight="bold" />
            </span>
          </button>
        ) : (
          <button
            className={styles.primaryAction}
            disabled={busy}
            type="submit"
          >
            <span>{busy ? "Locking" : "Lock this commitment"}</span>
            <span aria-hidden="true" className={styles.actionIcon}>
              {busy
                ? <span className={styles.busyDot} />
                : <LockSimple size={18} weight="bold" />}
            </span>
          </button>
        )}
      </footer>
    </section>
  );
}
