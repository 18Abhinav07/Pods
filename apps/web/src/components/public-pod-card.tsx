"use client";

import type { TemplateId } from "@pods/domain";
import { ArrowRight, Info, X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  presentPodRelationship,
  type PodRelationship
} from "../lib/participant-pod-state";
import { adaptiveThemeForTemplate, mediaForTemplate } from "../lib/template-presentation";

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
};

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export function PublicPodCard({
  pod,
  relationship = { kind: "visitor" },
  visualIndex
}: {
  pod: PublicPodCardData;
  relationship?: PodRelationship;
  visualIndex?: number;
}) {
  const presentation = presentPodRelationship({ podId: pod.id, relationship });
  const theme = adaptiveThemeForTemplate(pod.templateId);
  const media = mediaForTemplate(pod.templateId, visualIndex ?? pod.id);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailPanelId = `pod-${pod.id}-details`;
  return (
    <article className={`public-pod-card adaptive-pod-card theme-${theme} entrance entrance-status${relationship.kind === "visitor" ? " is-visitor" : ""}`}>
      <div className="adaptive-pod-media">
        <Image alt="" fill sizes="390px" src={media.hero} />
        <div className="adaptive-pod-overlay" />
        <div className="pod-card-details">
          <button
            aria-controls={detailPanelId}
            aria-expanded={detailsOpen}
            aria-label={detailsOpen ? "Hide Pod details" : "Show Pod details"}
            onClick={() => setDetailsOpen((open) => !open)}
            type="button"
          >
            {detailsOpen ? <X aria-hidden="true" size={19} weight="bold" /> : <Info aria-hidden="true" size={20} weight="bold" />}
          </button>
          <div aria-hidden={!detailsOpen} className={`pod-card-detail-panel${detailsOpen ? " is-open" : ""}`} hidden={!detailsOpen} id={detailPanelId}>
            <p>{pod.purpose}</p>
            <dl className="public-pod-facts">
              <div><dt>Commitment</dt><dd>{nim(pod.totalLuna)} NIM upfront</dd></div>
              <div><dt>Cadence</dt><dd>{pod.occurrenceCount} {pod.occurrenceCount === 1 ? "occurrence" : "occurrences"}</dd></div>
              <div><dt>Dates</dt><dd>{pod.startDate} to {pod.endDate}</dd></div>
              <div><dt>Group</dt><dd>{pod.minParticipants} to {pod.maxParticipants} people</dd></div>
            </dl>
          </div>
        </div>
        <div className={`adaptive-pod-title${relationship.kind === "visitor" ? " has-apply" : ""}`}><h2>{pod.name}</h2></div>
        {relationship.kind === "visitor" ? (
          <Link
            aria-label={`Review and apply to ${pod.name}`}
            className="discover-apply-orb"
            href={presentation.href}
          >
            <ArrowRight aria-hidden="true" size={21} weight="bold" />
          </Link>
        ) : null}
      </div>
      {relationship.kind !== "visitor" ? <Link
        aria-label={presentation.actionLabel}
        className={`adaptive-card-action is-${presentation.tone}`}
        href={presentation.href}
      >
        <span>
          <small>{presentation.statusLabel}</small>
          <strong>{presentation.actionLabel}</strong>
        </span>
        <i aria-hidden="true">→</i>
      </Link> : null}
    </article>
  );
}
