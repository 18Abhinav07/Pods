"use client";

import type { PodState, TemplateId } from "@pods/domain";
import Image from "next/image";
import Link from "next/link";

import {
  presentPodRelationship,
  type PodRelationship
} from "../lib/participant-pod-state";
import { adaptiveThemeForTemplate, mediaForTemplate } from "../lib/template-presentation";

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
  return (
    <article className={`public-pod-card adaptive-pod-card is-compact-row theme-${theme} entrance entrance-status${relationship.kind === "visitor" ? " is-visitor" : ""}`}>
      <Link
        aria-label={`Open ${pod.name}`}
        className="adaptive-card-hit-area"
        href={presentation.href}
      />
      <div className="adaptive-pod-media">
        <Image
          alt={`${templateLabels[pod.templateId]} activity cover`}
          data-template-art={pod.templateId}
          fill
          sizes="76px"
          src={media.hero}
        />
      </div>
      <div className="adaptive-pod-copy">
        <h2>{pod.name}</h2>
        <p>{relationship.kind === "visitor" ? pod.purpose : presentation.statusLabel}</p>
      </div>
      <span className="adaptive-pod-type">
        {pod.stage && pod.stage !== "open" ? `${pod.stage === "live" ? "Live" : "Archive"} · ` : ""}
        {templateLabels[pod.templateId]}
      </span>
    </article>
  );
}
