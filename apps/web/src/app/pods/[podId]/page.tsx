import { templateContracts, type PodState } from "@pods/domain";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "../../../components/acquisition-flow.module.css";
import { publicVisitorRoomsEnabled } from "../../../lib/alpha-access";
import { publicPodPageSession } from "../../../lib/alpha-access-server";
import {
  presentPodRelationship,
  relationshipForViewer
} from "../../../lib/participant-pod-state";
import { isUuidRouteParam } from "../../../lib/route-params";
import { podsRepository } from "../../../lib/server-db";
import { mediaForTemplate } from "../../../lib/template-presentation";

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
  const [membership, creatorProfile] = await Promise.all([
    session
      ? podsRepository.getMembershipForUser(session.userId, pod.id)
      : Promise.resolve(null),
    podsRepository.getProfileForUser(pod.creatorUserId)
  ]);
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
  const media = mediaForTemplate(contract.templateId, pod.id);
  const creatorName =
    creatorProfile?.visibility === "public" ? creatorProfile.displayName : null;
  const stateLabel =
    relationship.kind !== "visitor"
      ? presentation.statusLabel
      : pod.stage === "open"
        ? presentation.statusLabel
        : pod.stage === "recent"
          ? "Completed"
          : pod.stage === "cancelled"
            ? "Pod cancelled"
            : "Activity live";

  return (
    <main
      className={`app-shell public-preview-shell ${styles.shell}`}
      data-template={contract.templateId}
    >
      <header className={`app-topbar ${styles.topbar}`}>
        <Link className={`wordmark ${styles.wordmark}`} href="/discover"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className={styles.routeLabel}>Public Pod</span>
      </header>
      <div className={styles.mediaHero}>
        <Image
          alt={`${template?.name ?? "Pod"} activity`}
          fill
          priority
          sizes="(max-width: 760px) 100vw, 760px"
          src={media.hero}
        />
        <span className={styles.heroState}>{stateLabel}</span>
      </div>
      <section className={styles.podSummary}>
        <p className={styles.templateLabel}>{template?.name}</p>
        <h1>{contract.activity.name}</h1>
        <p>{contract.activity.purpose}</p>
        <span className={styles.creatorLine}>
          {creatorName ? `Created by ${creatorName}` : "Created by a Pods member"}
        </span>
      </section>
      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>Occurrences</dt>
          <dd className={styles.factValue}>{contract.commitment.occurrenceCount}</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>Upfront</dt>
          <dd className={styles.factValue}>{nim(contract.commitment.totalLuna)} NIM</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>Capacity</dt>
          <dd className={styles.factValue}>{contract.community.minParticipants} to {contract.community.maxParticipants}</dd>
        </div>
      </dl>
      <section className={styles.explanation}>
        <h2>Creator review</h2>
        <p>The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds.</p>
        <p>
          {pod.stage === "open" && relationship.kind === "visitor"
            ? "Applying does not reserve a place. A place is secured only after acceptance, funding finality, and roster lock."
            : pod.stage === "open"
              ? presentation.statusDetail
              : pod.visitorRoomAvailable
                ? "The participant roster is closed. You can follow the public room without joining."
                : "This Pod is no longer accepting applications."}
        </p>
      </section>
      <section className={styles.disclosureList} aria-label="Pod details">
        <details className={styles.disclosureRow}>
          <summary>Frozen rules</summary>
          <p>{contract.commitment.occurrenceCount} occurrences from {contract.activity.startDate} to {contract.activity.endDate}, with {nim(contract.commitment.lunaPerOccurrence)} NIM committed per occurrence.</p>
        </details>
        {pod.visitorRoomAvailable ? (
          <Link className={styles.disclosureLink} href={`/pods/${pod.id}/room`}>Visitor room</Link>
        ) : (
          <details className={styles.disclosureRow}>
            <summary>Visitor room</summary>
            <p>The room is not available to public visitors in this Pod state.</p>
          </details>
        )}
        <details className={styles.disclosureRow}>
          <summary>People</summary>
          <p>{contract.community.minParticipants} to {contract.community.maxParticipants} participants. The creator reviews every application.</p>
        </details>
      </section>
      <div className={styles.stickyAction}>
        {pod.stage === "open" ? (
          <Link
            className={styles.primaryAction}
            href={relationship.kind === "visitor" ? `/pods/${pod.id}/apply` : presentation.href}
          >
            {relationship.kind === "visitor" ? "Apply to join" : presentation.actionLabel}
          </Link>
        ) : relationship.kind !== "visitor" ? (
          <Link className={styles.primaryAction} href={presentation.href}>
            {presentation.actionLabel}
          </Link>
        ) : pod.visitorRoomAvailable ? (
          <Link className={styles.primaryAction} href={`/pods/${pod.id}/room`}>
            Watch public room
          </Link>
        ) : (
          <Link className={styles.secondaryAction} href="/discover">Browse public Pods</Link>
        )}
      </div>
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
