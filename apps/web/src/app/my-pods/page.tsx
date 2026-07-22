import { templateContracts } from "@pods/domain";
import Link from "next/link";

import { MyPodsList, type MyPodListItem } from "../../components/my-pods-list";
import { AppHeader } from "../../components/app-header";
import { PrimaryNav } from "../../components/primary-nav";
import { presentCreatorPodState, presentPodRelationship } from "../../lib/participant-pod-state";
import { profileForSession } from "../../lib/profile-presentation";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";

function ownerItem(pod: Awaited<ReturnType<typeof podsRepository.listPodsForOwner>>[number]): MyPodListItem {
  const template = templateContracts.find((item) => item.id === pod.templateId);
  const name = pod.contractData?.activity.name ?? pod.draftData.activity?.name ?? "Untitled Pod";
  const draftHref = pod.state === "draft"
    ? `/pods/create/${pod.draftData.activity ? pod.draftData.community ? pod.draftData.commitment ? "review" : "commitment" : "community" : "activity"}?draft=${pod.id}`
    : null;
  const creatorPresentation = pod.state === "draft"
    ? null
    : presentCreatorPodState({
        podId: pod.id,
        state: pod.state as "enrollment_open" | "cutoff_evaluating" | "locked_scheduled" | "active" | "cancelled_refunding" | "cancelled"
      });
  return {
    id: pod.id,
    href: draftHref ?? creatorPresentation?.href ?? "/my-pods",
    name,
    state: pod.state,
    templateId: pod.templateId,
    templateName: template?.name ?? "Activity",
    statusLabel: pod.state === "draft" ? "Draft" : creatorPresentation?.statusLabel ?? "Creator controls",
    statusDetail: pod.state === "draft" ? "No financial exposure" : creatorPresentation?.statusDetail ?? "Open Pod"
  };
}

export default async function MyPodsPage() {
  const session = await requireSession("/my-pods");
  const [ownedPods, joinedRecords] = await Promise.all([
    podsRepository.listPodsForOwner(session.userId),
    podsRepository.listMembershipsForUser(session.userId)
  ]);
  const ownedItems = ownedPods.map(ownerItem);
  const joinedItems: MyPodListItem[] = joinedRecords.map(({ membership, pod }) => {
    const template = templateContracts.find((item) => item.id === pod.templateId);
    const presentation = presentPodRelationship({
      podId: pod.id,
      relationship: {
        kind: "member",
        state: membership.state,
        depositIntentId: membership.depositIntentId
      }
    });
    return {
      id: `member-${membership.id}`,
      href: presentation.href,
      name: pod.contractData?.activity.name ?? "Pod",
      state: membership.state,
      templateId: pod.templateId,
      templateName: template?.name ?? "Activity",
      statusLabel: presentation.statusLabel,
      statusDetail: presentation.statusDetail
    };
  });
  const empty = ownedItems.length === 0 && joinedItems.length === 0;

  return (
    <main className="app-shell adaptive-my-pods">
      <AppHeader
        action={<Link aria-label="Create a Pod" className="new-pod-button" href="/pods/create/template"><span aria-hidden="true">+</span></Link>}
        profile={profileForSession(session)}
        title="My Pods"
      />
      <p className="route-lede entrance entrance-hero">Active groups, commitments, and drafts.</p>
      {empty ? (
        <section className="empty-state"><h2>No Pods yet.</h2><p>Join a public activity or start your own.</p><Link className="secondary-action full-action" href="/discover">Browse public Pods</Link><Link className="primary-action full-action" href="/pods/create/template">Create a Pod</Link></section>
      ) : (
        <div className="my-pods-groups">
          {joinedItems.length > 0 ? <section><div className="section-heading"><span>Participant</span><strong>{joinedItems.length}</strong></div><MyPodsList items={joinedItems} /></section> : null}
          {ownedItems.length > 0 ? <section><div className="section-heading"><span>Creator</span><strong>{ownedItems.length}</strong></div><MyPodsList items={ownedItems} /></section> : null}
        </div>
      )}
      <PrimaryNav active="my-pods" />
    </main>
  );
}
