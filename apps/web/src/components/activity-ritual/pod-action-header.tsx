"use client";

import { ArrowLeft, ChatCircleDots } from "@phosphor-icons/react";
import Link from "next/link";

import styles from "./activity-ritual.module.css";

export function PodActionHeader({
  occurrenceNumber,
  podId,
  podName,
  templateLabel
}: {
  occurrenceNumber: number;
  podId: string;
  podName: string;
  templateLabel: string;
}) {
  const occurrenceLabel = String(occurrenceNumber).padStart(2, "0");

  return (
    <header className={styles.actionHeader}>
      <Link
        aria-label="Back to Today"
        className={`${styles.iconAction} ${styles.backAction}`}
        href="/today"
      >
        <ArrowLeft aria-hidden="true" size={22} weight="bold" />
      </Link>

      <div className={styles.titleGroup}>
        <h1>{podName}</h1>
        <p>
          {templateLabel}
          <span aria-hidden="true"> · </span>
          Occurrence {occurrenceLabel}
        </p>
      </div>

      <Link
        aria-label={`Open ${podName} room`}
        className={`${styles.iconAction} ${styles.roomAction}`}
        href={`/pods/${podId}/room`}
      >
        <ChatCircleDots aria-hidden="true" size={22} weight="fill" />
        <span aria-hidden="true" className={styles.roomStatusDot} />
      </Link>
    </header>
  );
}
