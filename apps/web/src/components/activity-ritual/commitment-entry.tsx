"use client";

import {
  ArrowRight,
  GitBranch,
  PaintBrushBroad
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { formatZonedMoment } from "../../lib/format-moment";
import styles from "./activity-ritual.module.css";

function remainingLabel(deadlineAt: string, now: number): string {
  const milliseconds = Math.max(0, new Date(deadlineAt).getTime() - now);
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type CommitmentWindowState = "upcoming" | "open" | "closed";

function resolveWindowState({
  commitmentDeadlineAt,
  effectiveNow,
  opensAt
}: {
  commitmentDeadlineAt: string;
  effectiveNow: number;
  opensAt: string;
}): CommitmentWindowState {
  if (effectiveNow < new Date(opensAt).getTime()) return "upcoming";
  if (effectiveNow >= new Date(commitmentDeadlineAt).getTime()) return "closed";
  return "open";
}

export function CommitmentEntry({
  closesAt,
  commitmentDeadlineAt,
  currentStreak,
  effectiveNowAt,
  fullReturnAlpha,
  initiallyOpen,
  onStart,
  opensAt,
  projectTheme,
  reviewerKind,
  stakeNim,
  templateId,
  timeZone
}: {
  closesAt: string;
  commitmentDeadlineAt: string;
  currentStreak: number;
  effectiveNowAt: string;
  fullReturnAlpha: boolean;
  initiallyOpen: boolean;
  onStart: () => void;
  opensAt: string;
  projectTheme: string;
  reviewerKind: "creator" | "pods_team";
  stakeNim: number;
  templateId: "build" | "create";
  timeZone: string;
}) {
  const reduceMotion = useReducedMotion();
  const initialEffectiveNow = new Date(effectiveNowAt).getTime();
  const [effectiveNow, setEffectiveNow] = useState(initialEffectiveNow);
  const [windowState, setWindowState] = useState<CommitmentWindowState>(() =>
    initiallyOpen
      ? "open"
      : resolveWindowState({
          commitmentDeadlineAt,
          effectiveNow: initialEffectiveNow,
          opensAt
        })
  );
  const isCreate = templateId === "create";
  const SignalIcon = isCreate ? PaintBrushBroad : GitBranch;
  const reviewerReference = reviewerKind === "pods_team"
    ? "The Pods Team"
    : "Your creator";

  useEffect(() => {
    const clientBaseline = Date.now();
    const effectiveBaseline = new Date(effectiveNowAt).getTime();
    const update = () => {
      const projectedEffectiveNow =
        effectiveBaseline + Math.max(0, Date.now() - clientBaseline);
      setEffectiveNow(projectedEffectiveNow);
      setWindowState(
        resolveWindowState({
          commitmentDeadlineAt,
          effectiveNow: projectedEffectiveNow,
          opensAt
        })
      );
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [commitmentDeadlineAt, effectiveNowAt, opensAt]);

  const isOpen = windowState === "open";
  const activeDeadline =
    windowState === "upcoming" ? opensAt : commitmentDeadlineAt;
  const kicker =
    windowState === "upcoming"
      ? "Commitment opens soon"
      : windowState === "open"
        ? "Commitment window open"
        : "Commitment window closed";
  const timerLabel =
    windowState === "upcoming"
      ? "Starts in"
      : windowState === "open"
        ? "Window closes in"
        : "Closed at";
  const actionLabel =
    windowState === "upcoming"
      ? "Commitment not open"
      : windowState === "open"
        ? "Start commitment"
        : "Commitment closed";

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={styles.commitmentEntry}
      data-template={templateId}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      transition={{
        duration: reduceMotion ? 0 : 0.24,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <article className={styles.signalStage}>
        <p className={styles.signalKicker}>{kicker}</p>
        <h2>
          Choose the one thing you will{" "}
          <span>{isCreate ? "make." : "ship."}</span>
        </h2>
        <p className={styles.signalTheme}>{projectTheme}</p>

        <div
          aria-hidden="true"
          className={styles.orbitVisual}
          data-reduced-motion={reduceMotion ? "true" : "false"}
        >
          <span className={styles.orbitRing} />
          <span className={styles.orbitCore}>
            <SignalIcon size={38} weight="regular" />
          </span>
          <span className={`${styles.orbitChip} ${styles.orbitChipOne}`}>
            {isCreate ? "Artifact" : "Pull request"}
          </span>
          <span className={`${styles.orbitChip} ${styles.orbitChipTwo}`}>
            {isCreate ? "Reflection" : "Commit"}
          </span>
        </div>

        <div className={styles.windowTimer}>
          <span>{timerLabel}</span>
          <strong role="timer">
            {windowState === "closed"
              ? formatZonedMoment(activeDeadline, { timeZone })
              : remainingLabel(activeDeadline, effectiveNow)}
          </strong>
          <small>
            {windowState === "closed"
              ? "Commitment cutoff"
              : formatZonedMoment(activeDeadline, { timeZone })}
          </small>
        </div>
      </article>

      <div aria-label="Occurrence status" className={styles.statusRail}>
        <div>
          <span>{fullReturnAlpha ? "Activity slice" : "At risk"}</span>
          <strong>{stakeNim} NIM</strong>
        </div>
        <div>
          <span>Streak</span>
          <strong>{String(currentStreak).padStart(2, "0")}</strong>
        </div>
        <div>
          <span>Proof due</span>
          <strong>{formatZonedMoment(closesAt, { timeZone })}</strong>
        </div>
      </div>

      <p className={styles.entryNote}>
        {fullReturnAlpha
          ? "Your full Testnet principal remains returnable."
          : `Lock one concrete finish line now. ${reviewerReference} reviews the proof later.`}
      </p>

      <footer className={styles.entryDock}>
        <button
          className={styles.primaryAction}
          disabled={!isOpen}
          onClick={() => {
            if (isOpen) onStart();
          }}
          type="button"
        >
          <span>{actionLabel}</span>
          <span aria-hidden="true" className={styles.actionIcon}>
            <ArrowRight size={19} weight="bold" />
          </span>
        </button>
      </footer>
    </motion.section>
  );
}
