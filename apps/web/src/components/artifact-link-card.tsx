"use client";

import { ArrowUpRight, LinkSimple } from "@phosphor-icons/react";

import styles from "./artifact-link-card.module.css";

function destinationLabel(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "External destination";
  }
}

export function ArtifactLinkCard({
  artifactAction = false,
  context = "Public artifact",
  href,
  label,
  roomPublicArtifact = false,
  tone = "default"
}: {
  artifactAction?: boolean;
  context?: string;
  href: string;
  label: string;
  roomPublicArtifact?: boolean;
  tone?: "default" | "inverse";
}) {
  return (
    <a
      aria-label={label}
      className={`${styles.card}${tone === "inverse" ? ` ${styles.inverse}` : ""}`}
      data-artifact-action={artifactAction ? "" : undefined}
      data-artifact-card
      data-room-public-artifact={roomPublicArtifact ? "" : undefined}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <i aria-hidden="true" className={styles.leading}>
        <LinkSimple size={19} weight="bold" />
      </i>
      <span className={styles.copy}>
        <small>{context}</small>
        <strong>{destinationLabel(href)}</strong>
      </span>
      <i aria-hidden="true" className={styles.trailing}>
        <ArrowUpRight size={17} weight="bold" />
      </i>
    </a>
  );
}
