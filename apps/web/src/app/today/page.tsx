import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";
import { TemplateSymbol } from "../../components/template-symbol";
import { presentCreatorPodState, presentPodRelationship } from "../../lib/participant-pod-state";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";
import { chooseTodayEnrollmentAction } from "../../lib/today-priority";

export default async function TodayPage() {
  const session = await requireSession("/today");
  const now = await podsRepository.getEffectiveTime(new Date());
  const [memberships, creatorApplications, ownedPods, activities] = await Promise.all([
    podsRepository.listMembershipsForUser(session.userId),
    podsRepository.listApplicationsForCreator({ creatorUserId: session.userId }),
    podsRepository.listPodsForOwner(session.userId),
    podsRepository.listCurrentActivitiesForUser({ userId: session.userId, now })
  ]);
  const pendingReview = creatorApplications.find(({ application, pod }) => application.state === "applied" && pod.state === "enrollment_open");
  const recruit = ownedPods.find((pod) => pod.state === "enrollment_open" && pod.contractData?.community.visibility === "public");
  const creatorFunding = ownedPods.find((pod) =>
    ["cutoff_evaluating", "locked_scheduled", "active", "cancelled_refunding", "cancelled"].includes(pod.state)
  );
  const activityActions = activities.map(({ pod, occurrence, commitment, submission }) => ({
    podId: pod.id,
    occurrenceId: occurrence.id,
    action: (
      occurrence.opensAt.getTime() > now.getTime()
        ? "upcoming"
        : !commitment
          ? "lock_task"
          : !submission || submission.state === "draft"
            ? "submit_evidence"
            : submission.state
    ) as "lock_task" | "submit_evidence" | "reviewing" | "approved" | "upcoming"
  }));
  const action = chooseTodayEnrollmentAction({
    activities: activityActions,
    participants: memberships.map(({ membership, pod }) => ({
      podId: pod.id,
      state: membership.state,
      depositIntentId: membership.depositIntentId
    })),
    reviewPodId: pendingReview?.pod.id ?? null,
    creatorFundingPodId: creatorFunding?.id ?? null,
    recruitPodId: recruit?.id ?? null
  });
  const participantRecord = action.kind === "participant"
    ? memberships.find(({ pod }) => pod.id === action.podId)
    : null;
  const participantPresentation = action.kind === "participant"
    ? presentPodRelationship({
        podId: action.podId,
        relationship: {
          kind: "member",
          state: action.state,
          depositIntentId: action.depositIntentId
        }
      })
    : null;
  const creatorPresentation = action.kind === "creator_funding" && creatorFunding
    ? presentCreatorPodState({
        podId: creatorFunding.id,
        state: creatorFunding.state as "cutoff_evaluating" | "locked_scheduled" | "active" | "cancelled_refunding" | "cancelled"
      })
    : null;
  const activeRecord = action.kind === "activity"
    ? activities.find(({ pod }) => pod.id === action.podId)
    : null;
  const actionPod = action.kind === "activity"
    ? activeRecord?.pod
    : action.kind === "participant"
    ? participantRecord?.pod
    : action.kind === "review"
      ? pendingReview?.pod
      : action.kind === "creator_funding"
        ? creatorFunding
      : action.kind === "recruit"
        ? recruit
        : null;
  const shortWallet = `${session.walletAddress.slice(0, 9)}...${session.walletAddress.slice(-5)}`;
  const activityCopy = action.kind === "activity"
    ? action.action === "lock_task"
      ? { eyebrow: "Task lock open", title: "Name the work before you build.", detail: "Lock one concrete task and its visible deliverable before the frozen cutoff.", cta: "Lock today's task" }
      : action.action === "submit_evidence"
        ? { eyebrow: "Evidence due", title: "Turn shipped work into visible progress.", detail: "Save your result and public artifact, then send the occurrence to Pods team review.", cta: "Complete evidence" }
        : action.action === "reviewing"
          ? { eyebrow: "Under review", title: "Your work is with the Pods team.", detail: "The locked task and public artifact are being reviewed against the frozen contract.", cta: "View review status" }
          : action.action === "approved"
            ? { eyebrow: "Occurrence approved", title: "Your visible work counted.", detail: "This occurrence was manually approved and now contributes to your streak.", cta: "View achievement" }
            : { eyebrow: "Next occurrence", title: "Your next build is already scheduled.", detail: "Open the occurrence to review its frozen timing and project theme.", cta: "Preview occurrence" }
    : null;
  const copy = action.kind === "activity" && activityCopy
    ? {
        ...activityCopy,
        href: `/pods/${action.podId}/activity/${action.occurrenceId}`
      }
    : action.kind === "participant" && participantPresentation
    ? {
        eyebrow: participantPresentation.todayEyebrow,
        title: participantPresentation.todayTitle,
        detail: participantPresentation.todayDetail,
        cta: participantPresentation.actionLabel,
        href: participantPresentation.href
      }
    : action.kind === "review"
      ? { eyebrow: "Creator decision", title: "A builder is waiting for your answer.", detail: "Review their frozen application responses and make one terminal enrollment decision.", cta: "Review applications", href: `/pods/${action.podId}/admin/applications` }
    : action.kind === "creator_funding" && creatorPresentation
        ? { eyebrow: creatorPresentation.todayEyebrow, title: creatorPresentation.todayTitle, detail: creatorPresentation.todayDetail, cta: creatorPresentation.actionLabel, href: creatorPresentation.href }
      : action.kind === "recruit"
        ? { eyebrow: "Enrollment open", title: "Your public Pod is ready to grow.", detail: "Share the public preview so the right participants can inspect the contract and apply.", cta: "Open creator controls", href: `/pods/${action.podId}/admin` }
        : { eyebrow: "Today", title: "Choose your next commitment.", detail: "Join a public activity with a cadence that fits, or create a focused group of your own.", cta: "Discover public Pods", href: "/discover" };

  return (
    <main className="app-shell">
      <header className="app-topbar entrance entrance-topbar"><Link className="wordmark" href="/today" aria-label="Pods Today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><Link className="wallet-chip" href="/profile" aria-label="Open wallet profile">{shortWallet}</Link></header>
      <section className="today-hero entrance entrance-hero"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="screen-copy">{copy.detail}</p></section>
      <section className="today-action-card entrance entrance-status">
        {actionPod ? <TemplateSymbol templateId={actionPod.templateId} /> : <span className="today-action-index">01</span>}
        <div><span>{action.kind === "empty" ? "Start here" : actionPod?.contractData?.activity.name}</span><strong>{copy.cta}</strong></div>
        <Link className="primary-action full-action" href={copy.href}>{copy.cta}</Link>
      </section>
      {action.kind !== "empty" ? (
        <Link className="secondary-action full-action today-secondary" href="/my-pods">View all My Pods</Link>
      ) : (
        <Link className="secondary-action full-action today-secondary" href="/pods/create/template">Create a Pod</Link>
      )}
      <PrimaryNav active="today" />
    </main>
  );
}
