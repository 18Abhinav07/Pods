import { templateContracts, type PodState } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TemplateSymbol } from "../../../components/template-symbol";
import { publicVisitorRoomsEnabled } from "../../../lib/alpha-access";
import { publicPodPageSession } from "../../../lib/alpha-access-server";
import {
  presentPodRelationship,
  relationshipForViewer
} from "../../../lib/participant-pod-state";
import { isUuidRouteParam } from "../../../lib/route-params";
import { podsRepository } from "../../../lib/server-db";

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export default async function PublicPodPage({
  params
}: {
  params: Promise<{ podId: string }>;
}) {
  const { podId } = await params;
  if (!isUuidRouteParam(podId)) notFound();
  const [pod, session] = await Promise.all([
    podsRepository.getPublicPodSurface(podId, new Date()),
    publicPodPageSession()
  ]);
  if (!pod?.contractData || pod.contractData.community.visibility !== "public") notFound();
  if (pod.stage !== "open" && !publicVisitorRoomsEnabled(process.env)) notFound();
  const membership = session
    ? await podsRepository.getMembershipForUser(session.userId, pod.id)
    : null;
  const relationship = relationshipForViewer({
    creatorUserId: pod.creatorUserId,
    viewerUserId: session?.userId ?? null,
    membership
  });
  const presentation = presentPodRelationship({
    podId: pod.id,
    podState: pod.state as Exclude<PodState, "draft">,
    settlementMode: pod.contractData.settlementMode,
    relationship
  });
  const contract = pod.contractData;
  const template = templateContracts.find((item) => item.id === contract.templateId);

  return (
    <main className="app-shell public-preview-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/discover"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className="phase-pill">Public Pod</span>
      </header>
      <section className="public-preview-hero entrance entrance-hero">
        <TemplateSymbol templateId={contract.templateId} />
        <p className="eyebrow">{template?.name}</p>
        <h1>{contract.activity.name}</h1>
        <p>{contract.activity.purpose}</p>
      </section>
      <section className="public-preview-ledger entrance entrance-status">
        <div><span>Schedule</span><strong>{contract.commitment.occurrenceCount} occurrences</strong><small>{contract.activity.startDate} to {contract.activity.endDate}</small></div>
        <div><span>Upfront commitment</span><strong>{nim(contract.commitment.totalLuna)} NIM</strong><small>{nim(contract.commitment.lunaPerOccurrence)} NIM per occurrence</small></div>
        <div><span>Community</span><strong>{contract.community.minParticipants} to {contract.community.maxParticipants} people</strong><small>Creator reviews applications</small></div>
        <div><span>Evidence authority</span><strong>Creator review</strong><small>The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds.</small></div>
      </section>
      {pod.stage === "open" && relationship.kind === "visitor" ? (
        <aside className="reservation-disclosure entrance entrance-templates">
          <strong>Application before commitment</strong>
          <p>Applying does not reserve a place. A place is secured only after acceptance, funding finality, and roster lock.</p>
        </aside>
      ) : pod.stage === "open" ? (
        <aside className={`pod-relationship-banner is-${presentation.tone} entrance entrance-templates`}>
          <strong>{presentation.statusLabel}</strong>
          <p>{presentation.statusDetail}</p>
        </aside>
      ) : (
        <aside className="pod-relationship-banner is-neutral entrance entrance-templates">
          <strong>{pod.stage === "recent" ? "Completed public archive" : pod.stage === "cancelled" ? "Pod cancelled" : "Roster locked"}</strong>
          <p>{pod.visitorRoomAvailable ? "The participant roster is closed. You can follow the public room without joining." : "This Pod is no longer accepting applications."}</p>
        </aside>
      )}
      {pod.stage === "open" ? (
        <Link
          className="primary-action full-action"
          href={relationship.kind === "visitor" ? `/pods/${pod.id}/apply` : presentation.href}
        >
          {relationship.kind === "visitor" ? "Apply to join" : presentation.actionLabel}
        </Link>
      ) : pod.visitorRoomAvailable ? (
        <Link className="primary-action full-action" href={`/pods/${pod.id}/room`}>
          {relationship.kind === "creator" || relationship.kind === "member" ? "Open Pod room" : "Watch public room"}
        </Link>
      ) : (
        <Link className="secondary-action full-action" href="/discover">Browse public Pods</Link>
      )}
    </main>
  );
}

export const metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true
  }
};
