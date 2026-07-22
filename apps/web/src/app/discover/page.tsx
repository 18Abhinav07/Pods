import { templateContracts, type TemplateId } from "@pods/domain";
import Link from "next/link";

import { AppHeader } from "../../components/app-header";
import { PrimaryNav } from "../../components/primary-nav";
import { PublicPodCard } from "../../components/public-pod-card";
import { alphaAwarePageSession } from "../../lib/alpha-access-server";
import { relationshipForViewer } from "../../lib/participant-pod-state";
import { profileForSession } from "../../lib/profile-presentation";
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
    <main className="app-shell adaptive-discover">
      {session ? <AppHeader profile={profileForSession(session)} title="Discover" /> : <header className="app-topbar"><Link className="wordmark" href="/"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link></header>}
      <p className="route-lede entrance entrance-hero">Public Pods are discoverable and application-based. Private Pods arrive by invitation.</p>
      <nav className="template-filter" aria-label="Filter public Pods">
        <Link aria-current={!activeTemplate ? "page" : undefined} href="/discover">For you</Link>
        {templateContracts.map((template) => <Link aria-current={activeTemplate === template.id ? "page" : undefined} href={`/discover?template=${template.id}`} key={template.id}>{template.name.replace(" & Movement", "").replace(" & Focus", "").replace(" & Ship", "")}</Link>)}
      </nav>
      {cards.length > 0 ? (
        <section className="public-pod-grid" aria-label="Public Pods">
          {cards.map((card, visualIndex) => (
            <PublicPodCard
              key={card.pod.id}
              pod={card.pod}
              relationship={card.relationship}
              visualIndex={visualIndex}
            />
          ))}
        </section>
      ) : (
        <section className="empty-state entrance entrance-status">
          <h2>No matching public Pods yet.</h2>
          <p>Clear the filter or publish a focused activity for the community.</p>
          {activeTemplate ? <Link className="secondary-action full-action" href="/discover">Clear filter</Link> : null}
          <Link className="primary-action full-action" href="/pods/create/template">Create a Pod</Link>
        </section>
      )}
      <PrimaryNav active="discover" />
    </main>
  );
}
