import { templateContracts, type TemplateId } from "@pods/domain";
import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";
import { PublicPodCard } from "../../components/public-pod-card";
import { alphaAwarePageSession } from "../../lib/alpha-access-server";
import { relationshipForViewer } from "../../lib/participant-pod-state";
import { podsRepository } from "../../lib/server-db";

function templateFilter(value: string | undefined): TemplateId | null {
  return templateContracts.some((template) => template.id === value)
    ? (value as TemplateId)
    : null;
}

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const query = await searchParams;
  const session = await alphaAwarePageSession("/discover");
  const activeTemplate = templateFilter(query.template);
  const [publicPods, memberships] = await Promise.all([
    podsRepository.listPublicPods({ now: new Date() }),
    session ? podsRepository.listMembershipsForUser(session.userId) : Promise.resolve([])
  ]);
  const membershipByPod = new Map(
    memberships.map(({ membership }) => [membership.podId, membership])
  );
  const visiblePods = activeTemplate
    ? publicPods.filter((pod) => pod.templateId === activeTemplate)
    : publicPods;
  const cards = visiblePods.flatMap((pod) => {
    const contract = pod.contractData;
    if (!contract || contract.community.visibility !== "public") return [];
    return [{
      pod: {
        id: pod.id,
        templateId: pod.templateId,
        name: contract.activity.name,
        purpose: contract.activity.purpose,
        startDate: contract.activity.startDate,
        endDate: contract.activity.endDate,
        occurrenceCount: contract.commitment.occurrenceCount,
        totalLuna: contract.commitment.totalLuna,
        minParticipants: contract.community.minParticipants,
        maxParticipants: contract.community.maxParticipants
      },
      relationship: relationshipForViewer({
        creatorUserId: pod.creatorUserId,
        viewerUserId: session?.userId ?? null,
        membership: membershipByPod.get(pod.id) ?? null
      })
    }];
  });

  return (
    <main className="app-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="phase-pill">Public space</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Discover</p>
        <h1>Find people moving in your direction.</h1>
        <p className="screen-copy">Explore public activities with frozen rules, a clear cadence, and an upfront NIM commitment.</p>
      </section>
      <nav className="template-filter" aria-label="Filter public Pods">
        <Link aria-current={!activeTemplate ? "page" : undefined} href="/discover">All</Link>
        {templateContracts.map((template) => (
          <Link
            aria-current={activeTemplate === template.id ? "page" : undefined}
            href={`/discover?template=${template.id}`}
            key={template.id}
          >
            {template.name.replace(" & Movement", "").replace(" & Focus", "").replace(" & Ship", "")}
          </Link>
        ))}
      </nav>
      {cards.length > 0 ? (
        <section className="public-pod-grid" aria-label="Public Pods">
          {cards.map((card) => (
            <PublicPodCard
              key={card.pod.id}
              pod={card.pod}
              relationship={card.relationship}
            />
          ))}
        </section>
      ) : (
        <section className="empty-state entrance entrance-status">
          <span className="empty-index">00</span>
          <h2>No matching public Pods yet.</h2>
          <p>Clear the filter or publish a focused activity for the community.</p>
          {activeTemplate ? <Link className="secondary-action full-action" href="/discover">Clear filters</Link> : null}
          <Link className="primary-action full-action" href="/pods/create/template">Create a Pod</Link>
        </section>
      )}
      <PrimaryNav active="discover" />
    </main>
  );
}
