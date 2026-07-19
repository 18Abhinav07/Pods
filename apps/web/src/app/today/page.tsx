import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";
import { TemplateSymbol } from "../../components/template-symbol";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";
import { chooseTodayEnrollmentAction } from "../../lib/today-priority";

export default async function TodayPage() {
  const session = await requireSession("/today");
  const [memberships, creatorApplications, ownedPods] = await Promise.all([
    podsRepository.listMembershipsForUser(session.userId),
    podsRepository.listApplicationsForCreator({ creatorUserId: session.userId }),
    podsRepository.listPodsForOwner(session.userId)
  ]);
  const accepted = memberships.find(({ membership, pod }) => membership.state === "accepted_unfunded" && pod.state === "enrollment_open");
  const pendingReview = creatorApplications.find(({ application, pod }) => application.state === "applied" && pod.state === "enrollment_open");
  const recruit = ownedPods.find((pod) => pod.state === "enrollment_open" && pod.contractData?.community.visibility === "public");
  const action = chooseTodayEnrollmentAction({
    acceptedPodId: accepted?.pod.id ?? null,
    reviewPodId: pendingReview?.pod.id ?? null,
    recruitPodId: recruit?.id ?? null
  });
  const actionPod = action.kind === "fund" ? accepted?.pod : action.kind === "review" ? pendingReview?.pod : action.kind === "recruit" ? recruit : null;
  const shortWallet = `${session.walletAddress.slice(0, 9)}...${session.walletAddress.slice(-5)}`;
  const copy = action.kind === "fund"
    ? { eyebrow: "Highest priority", title: "Your acceptance is waiting for funding.", detail: "Review the frozen financial commitment before Phase 3 activates any NIM transaction.", cta: "Review funding handoff", href: `/pods/${action.podId}/fund` }
    : action.kind === "review"
      ? { eyebrow: "Creator decision", title: "A builder is waiting for your answer.", detail: "Review their frozen application responses and make one terminal enrollment decision.", cta: "Review applications", href: `/pods/${action.podId}/admin/applications` }
      : action.kind === "recruit"
        ? { eyebrow: "Enrollment open", title: "Your public Pod is ready to grow.", detail: "Share the public preview so the right participants can inspect the contract and apply.", cta: "Open creator controls", href: `/pods/${action.podId}/admin` }
        : { eyebrow: "Today", title: "Choose your next commitment.", detail: "Join a public activity with a cadence that fits, or create a focused group of your own.", cta: "Discover public Pods", href: "/discover" };

  return (
    <main className="app-shell">
      <header className="app-topbar entrance entrance-topbar"><Link className="wordmark" href="/today" aria-label="Pods Today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><span className="wallet-chip">{shortWallet}</span></header>
      <section className="today-hero entrance entrance-hero"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="screen-copy">{copy.detail}</p></section>
      <section className="today-action-card entrance entrance-status">
        {actionPod ? <TemplateSymbol templateId={actionPod.templateId} /> : <span className="today-action-index">01</span>}
        <div><span>{action.kind === "empty" ? "Start here" : actionPod?.contractData?.activity.name}</span><strong>{copy.cta}</strong></div>
        <Link className="primary-action full-action" href={copy.href}>{copy.cta}</Link>
      </section>
      {action.kind !== "empty" ? <Link className="secondary-action full-action today-secondary" href="/discover">Browse other public Pods</Link> : <Link className="secondary-action full-action today-secondary" href="/pods/create/template">Create a Pod</Link>}
      <PrimaryNav active="today" />
    </main>
  );
}
