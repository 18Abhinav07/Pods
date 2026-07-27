"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./pod-room.module.css";

export function formatRemainingTime(target: number, now: number) {
  const totalSeconds = Math.max(0, Math.floor((target - now) / 1000));
  if (totalSeconds === 0) return "Closed";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  return hours > 0 ? `${hours}h ${clock}` : clock;
}

export function PodOccurrenceStrip({
  action,
  initialNow,
  progressLabel,
  stateLabel,
  targetAt,
  targetLabel
}: {
  action?: { href: string; label: string };
  initialNow: string;
  progressLabel: string;
  stateLabel: string;
  targetAt: string | null;
  targetLabel: "remaining" | "until next occurrence" | null;
}) {
  const target = targetAt ? new Date(targetAt).getTime() : null;
  const initialNowMs = new Date(initialNow).getTime();
  const [now, setNow] = useState(initialNowMs);

  useEffect(() => {
    if (target === null) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setNow(initialNowMs + (Date.now() - startedAt));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [initialNowMs, target]);

  const remaining = target === null || targetLabel === null
    ? null
    : `${formatRemainingTime(target, now)} ${targetLabel}`;
  return (
    <section className={styles.occurrence} aria-label="Current Pod activity">
      <span className={styles.occurrenceCopy}>
        <small>{stateLabel}</small>
        <strong>{progressLabel}</strong>
      </span>
      {remaining ? (
        <time className={styles.occurrenceTime} dateTime={targetAt ?? undefined}>
          {remaining}
        </time>
      ) : null}
      {action ? (
        <Link className={styles.actionLink} href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}
