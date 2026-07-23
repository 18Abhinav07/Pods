import { templateContracts, type PodState, type TemplateId } from "@pods/domain";
import Link from "next/link";

import { AppHeader } from "../../components/app-header";
import { PrimaryNav } from "../../components/primary-nav";
import { PublicPodCard } from "../../components/public-pod-card";
import { publicVisitorRoomsEnabled } from "../../lib/alpha-access";
import { alphaAwarePageSession } from "../../lib/alpha-access-server";
import { relationshipForViewer } from "../../lib/participant-pod-state";
import { profileForSession } from "../../lib/profile-presentation";
import { podsRepository } from "../../lib/server-db";

function templateFilter(value: string | undefined): TemplateId | null {
  return templateContracts.some((template) => template.id === value)
    ? (value as TemplateId)
    : null;
}

function stageFilter(value: string | undefined): "open" | "live" | "recent" {
  return value === "live" || value === "recent" ? value : "open";
}

export default async function DiscoverPage({
  searchParams
}: {
    searchParams: Promise<{ template?: string; stage?: string }>;
}) {
  const query = await searchParams;
  const session = await alphaAwarePageSession("/discover");
  const activeTemplate = templateFilter(query.template);
  const activeStage = stageFilter(query.stage);
  const [publicPods, memberships] = await Promise.all([
    podsRepository.listPublicPodDirectory({ now: new Date(), recentDays: 30 }),
    session ? podsRepository.listMembershipsForUser(session.userId) : Promise.resolve([])
  ]);
  const membershipByPod = new Map(
    memberships.map(({ membership }) => [membership.podId, membership])
  );
  const stagePods = publicPods.filter(
    (pod) =>
      pod.stage === activeStage &&
      (activeStage === "open" || publicVisitorRoomsEnabled(process.env))
  );
  const visiblePods = activeTemplate
    ? stagePods.filter((pod) => pod.templateId === activeTemplate)
    : stagePods;
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
        maxParticipants: contract.community.maxParticipants,
        stage: activeStage,
        state: pod.state as Exclude<PodState, "draft">
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
      {session ? <AppHeader profile={profileForSession(session)} title="Discover" /> : <header className="app-topbar"><Link className="wordmark" href="/"><span className="pod-mark" aria-hidden="true" />pods</Link></header>}
      <p className="route-lede entrance entrance-hero">Apply to open groups or watch visitor-enabled Pods build in public.</p>
      <nav className="discover-stage-filter" aria-label="Pod lifecycle">
        {(["open", "live", "recent"] as const).map((stage) => (
          <Link
            aria-current={activeStage === stage ? "page" : undefined}
            href={`/discover?stage=${stage}${activeTemplate ? `&template=${activeTemplate}` : ""}`}
            key={stage}
          >
            {stage[0]?.toUpperCase()}{stage.slice(1)}
          </Link>
        ))}
      </nav>
      <div className="template-filter-shell">
        <nav className="template-filter" aria-label="Filter public Pods">
          <Link aria-current={!activeTemplate ? "page" : undefined} href={`/discover?stage=${activeStage}`}>All</Link>
          {templateContracts.map((template) => <Link aria-current={activeTemplate === template.id ? "page" : undefined} href={`/discover?stage=${activeStage}&template=${template.id}`} key={template.id}>{template.name.replace(" & Movement", "").replace(" & Focus", "").replace(" & Ship", "")}</Link>)}
        </nav>
      </div>
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
          <h2>No matching {activeStage} Pods yet.</h2>
          <p>Clear the activity filter or publish a focused Pod for the community.</p>
          {activeTemplate ? <Link className="secondary-action full-action" href={`/discover?stage=${activeStage}`}>Clear filter</Link> : null}
          <Link className="primary-action full-action" href="/pods/create/template">Create a Pod</Link>
        </section>
      )}
      <PrimaryNav active="discover" />
    </main>
  );
}
