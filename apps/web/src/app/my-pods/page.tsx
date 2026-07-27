import { templateContracts, type PodState } from "@pods/domain";
import Link from "next/link";

import { MyPodsList, type MyPodListItem } from "../../components/my-pods-list";
import { AppHeader } from "../../components/app-header";
import styles from "../../components/home-flow.module.css";
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
        state: pod.state as Exclude<PodState, "draft">,
        ...(pod.contractData?.settlementMode
          ? { settlementMode: pod.contractData.settlementMode }
          : {})
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
  const joinedItems: MyPodListItem[] = joinedRecords.map(({
    entitlement,
    membership,
    payoutTransfer,
    pod,
    settlement
  }) => {
    const template = templateContracts.find((item) => item.id === pod.templateId);
    const presentation = presentPodRelationship({
      podId: pod.id,
      podState: pod.state as Exclude<PodState, "draft">,
      ...(pod.contractData?.settlementMode
        ? { settlementMode: pod.contractData.settlementMode }
        : {}),
      financial: {
        settlementState: settlement?.state ?? null,
        entitlementState: entitlement?.state ?? null,
        transferState: payoutTransfer?.state ?? null
      },
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
    <main className={`app-shell ${styles.page}`}>
      <AppHeader
        action={{
          description: "Start a new accountability activity",
          href: "/pods/create/template",
          kind: "create",
          label: "Create a Pod"
        }}
        profile={profileForSession(session)}
        title="My Pods"
      />
      {empty ? (
        <section className={styles.empty}><h2>No Pods yet.</h2><p>Join a public activity or shape a focused group of your own.</p><div className={styles.emptyActions}><Link className={styles.secondaryLink} href="/discover">Browse Pods</Link><Link className={styles.primaryLink} href="/pods/create/template">Create a Pod</Link></div></section>
      ) : (
        <div className={styles.groups}>
          {joinedItems.length > 0 ? <section className={styles.group}><div className={styles.groupHeader}><h2>Joined</h2><span>{joinedItems.length}</span></div><MyPodsList items={joinedItems} /></section> : null}
          {ownedItems.length > 0 ? <section className={styles.group}><div className={styles.groupHeader}><h2>Created</h2><span>{ownedItems.length}</span></div><MyPodsList items={ownedItems} /></section> : null}
        </div>
      )}
      <PrimaryNav active="my-pods" />
    </main>
  );
}
