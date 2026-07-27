"use client";

import type { PodState, TemplateId } from "@pods/domain";
import Image from "next/image";
import Link from "next/link";

import {
  presentPodRelationship,
  type PodRelationship
} from "../lib/participant-pod-state";
import { adaptiveThemeForTemplate, mediaForTemplate } from "../lib/template-presentation";
import styles from "./acquisition-flow.module.css";

const templateLabels: Record<TemplateId, string> = {
  build: "Build & Ship",
  create: "Practice & Create",
  fitness: "Fitness & Movement",
  reading: "Reading",
  study: "Study & Focus"
};

export type PublicPodCardData = {
  id: string;
  templateId: TemplateId;
  name: string;
  purpose: string;
  startDate: string;
  endDate: string;
  occurrenceCount: number;
  totalLuna: number;
  minParticipants: number;
  maxParticipants: number;
  stage?: "open" | "live" | "recent";
  state?: Exclude<PodState, "draft"> | undefined;
};

export function PublicPodCard({
  pod,
  relationship = { kind: "visitor" },
  visualIndex
}: {
  pod: PublicPodCardData;
  relationship?: PodRelationship;
  visualIndex?: number;
}) {
  const presentation = presentPodRelationship({
    podId: pod.id,
    podState: pod.state,
    relationship
  });
  const theme = adaptiveThemeForTemplate(pod.templateId);
  const media = mediaForTemplate(pod.templateId, visualIndex ?? pod.id);
  const statusLabel =
    relationship.kind === "visitor" && pod.stage === "live"
      ? "Activity live"
      : relationship.kind === "visitor" && pod.stage === "recent"
        ? "Completed"
        : presentation.statusLabel;
  return (
    <article
      className={`public-pod-card adaptive-pod-card is-compact-row theme-${theme} ${styles.podCard}`}
      data-template={pod.templateId}
    >
      <Link
        aria-label={`Open ${pod.name}`}
        className={`adaptive-card-hit-area ${styles.cardHitArea}`}
        href={presentation.href}
      />
      <div className={`adaptive-pod-media ${styles.podMedia}`}>
        <Image
          alt={`${templateLabels[pod.templateId]} activity cover`}
          data-template-art={pod.templateId}
          fill
          sizes="76px"
          src={media.hero}
        />
      </div>
      <div className={`adaptive-pod-copy ${styles.podCopy}`}>
        <h2 className={styles.podName}>{pod.name}</h2>
        <p className={styles.podStatus}>{statusLabel}</p>
      </div>
      <span className={`adaptive-pod-type ${styles.podType}`}>
        {pod.stage && pod.stage !== "open" ? `${pod.stage === "live" ? "Live" : "Archive"} · ` : ""}
        {templateLabels[pod.templateId]}
      </span>
    </article>
  );
}
