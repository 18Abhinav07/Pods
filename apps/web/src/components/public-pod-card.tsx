import type { TemplateId } from "@pods/domain";
import Link from "next/link";

import { TemplateSymbol } from "./template-symbol";

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

export function PublicPodCard({ pod }: { pod: PublicPodCardData }) {
  return (
    <article className="public-pod-card entrance entrance-status">
      <div className="public-pod-card-head">
        <TemplateSymbol templateId={pod.templateId} />
        <div>
          <p className="eyebrow">{pod.templateId === "build" ? "Build & Ship" : "Activity Pod"}</p>
          <h2>{pod.name}</h2>
        </div>
      </div>
      <p className="public-pod-purpose">{pod.purpose}</p>
      <dl className="public-pod-facts">
        <div><dt>Commitment</dt><dd>{nim(pod.totalLuna)} NIM upfront</dd></div>
        <div><dt>Cadence</dt><dd>{pod.occurrenceCount} occurrences</dd></div>
        <div><dt>Dates</dt><dd>{pod.startDate} to {pod.endDate}</dd></div>
        <div><dt>Group</dt><dd>{pod.minParticipants} to {pod.maxParticipants} people</dd></div>
      </dl>
      <Link className="primary-action full-action" href={`/pods/${pod.id}`}>
        Apply to join
      </Link>
    </article>
  );
}
