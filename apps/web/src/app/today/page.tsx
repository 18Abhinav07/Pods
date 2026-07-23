import Link from "next/link";
import Image from "next/image";
import type { PodState } from "@pods/domain";

import { AppHeader } from "../../components/app-header";
import { PrimaryNav } from "../../components/primary-nav";
import { presentCreatorPodState, presentPodRelationship } from "../../lib/participant-pod-state";
import { profileForSession } from "../../lib/profile-presentation";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";
import { adaptiveThemeForTemplate, mediaForTemplate } from "../../lib/template-presentation";
import {
  chooseTodayEnrollmentAction,
  type TodayActivityAction
} from "../../lib/today-priority";

export default async function TodayPage() {
  const session = await requireSession("/today");
  const now = await podsRepository.getEffectiveTime(new Date());
  const [
    memberships,
    creatorApplications,
    ownedPods,
    activities,
    creatorReview
  ] = await Promise.all([
    podsRepository.listMembershipsForUser(session.userId),
    podsRepository.listApplicationsForCreator({ creatorUserId: session.userId }),
    podsRepository.listPodsForOwner(session.userId),
    podsRepository.listCurrentActivitiesForUser({ userId: session.userId, now }),
    podsRepository.findFirstPendingReviewForCreator({
      creatorUserId: session.userId
    })
  ]);
  const pendingReview = creatorApplications.find(({ application, pod }) => application.state === "applied" && pod.state === "enrollment_open");
  const recruit = ownedPods.find((pod) => pod.state === "enrollment_open" && pod.contractData?.community.visibility === "public");
  const creatorFunding = ownedPods.find((pod) =>
    ["cutoff_evaluating", "locked_scheduled", "active", "final_review", "completed", "cancelled_refunding", "cancelled"].includes(pod.state)
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
    ) as TodayActivityAction
  }));
  const action = chooseTodayEnrollmentAction({
    activities: activityActions,
    participants: memberships.map(({ membership, pod }) => ({
      podId: pod.id,
      podState: pod.state as Exclude<PodState, "draft">,
      state: membership.state,
      depositIntentId: membership.depositIntentId
    })),
    creatorReviewPodId: creatorReview?.id ?? null,
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
        podState: action.podState,
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
        state: creatorFunding.state as Exclude<PodState, "draft">
      })
    : null;
  const activeRecord = action.kind === "activity"
    ? activities.find(({ pod }) => pod.id === action.podId)
    : null;
  const actionPod = action.kind === "activity"
    ? activeRecord?.pod
    : action.kind === "participant"
    ? participantRecord?.pod
    : action.kind === "creator_review"
      ? creatorReview
    : action.kind === "review"
      ? pendingReview?.pod
      : action.kind === "creator_funding"
        ? creatorFunding
      : action.kind === "recruit"
        ? recruit
        : null;
  const activityCopy = action.kind === "activity"
    ? action.action === "lock_task"
      ? { eyebrow: "Commitment open", title: "Name the work before you build.", detail: "Lock one concrete task and its visible deliverable before the frozen cutoff.", cta: "Lock today's task", href: `/pods/${action.podId}/activity/${action.occurrenceId}` }
      : action.action === "submit_evidence"
        ? { eyebrow: "Proof due", title: "Turn shipped work into visible progress.", detail: "Add your result and public artifact, then send this occurrence to creator review.", cta: "Add today's proof", href: `/pods/${action.podId}/activity/${action.occurrenceId}` }
        : action.action === "reviewing"
          ? { eyebrow: "Creator review in progress", title: "Your proof is with the Pod creator.", detail: "The Pod creator is checking your proof against the locked commitment.", cta: "View review", href: `/pods/${action.podId}/activity/${action.occurrenceId}` }
          : action.action === "approved"
            ? { eyebrow: "Work approved", title: "Your work is counted.", detail: "The Pod creator approved this proof. It counts toward your progress and streak.", cta: "Open Pod room", href: `/pods/${action.podId}/room` }
            : action.action === "rejected"
              ? { eyebrow: "Proof not verified", title: "Your proof needs attention.", detail: "Review the final result against your locked commitment.", cta: "View result", href: `/pods/${action.podId}/activity/${action.occurrenceId}` }
              : action.action === "timeout_protected"
                ? { eyebrow: "Protected after review timeout", title: "Your proof is protected.", detail: "The creator did not decide within 24 hours. This occurrence counts toward your progress and streak.", cta: "View result", href: `/pods/${action.podId}/activity/${action.occurrenceId}` }
                : { eyebrow: "Coming up", title: "Your next activity is scheduled.", detail: "Review the timing and arrive ready to lock one clear commitment.", cta: "Preview next activity", href: `/pods/${action.podId}/activity/${action.occurrenceId}` }
    : null;
  const copy = action.kind === "activity" && activityCopy
    ? activityCopy
    : action.kind === "participant" && participantPresentation
    ? {
        eyebrow: participantPresentation.todayEyebrow,
        title: participantPresentation.todayTitle,
        detail: participantPresentation.todayDetail,
        cta: participantPresentation.actionLabel,
        href: participantPresentation.href
      }
    : action.kind === "creator_review"
      ? {
          eyebrow: "Proofs waiting",
          title: "Members are waiting for your review.",
          detail: "Compare each proof with its locked commitment and record one final result.",
          cta: "Review proofs",
          href: `/pods/${action.podId}/admin/reviews`
        }
    : action.kind === "review"
      ? { eyebrow: "Creator decision", title: "A builder is waiting for your answer.", detail: "Review their frozen application responses and make one terminal enrollment decision.", cta: "Review applications", href: `/pods/${action.podId}/admin/applications` }
    : action.kind === "creator_funding" && creatorPresentation
        ? { eyebrow: creatorPresentation.todayEyebrow, title: creatorPresentation.todayTitle, detail: creatorPresentation.todayDetail, cta: creatorPresentation.actionLabel, href: creatorPresentation.href }
      : action.kind === "recruit"
        ? { eyebrow: "Enrollment open", title: "Your public Pod is ready to grow.", detail: "Share the public preview so the right participants can inspect the contract and apply.", cta: "Open creator controls", href: `/pods/${action.podId}/admin` }
        : { eyebrow: "Today", title: "Choose your next commitment.", detail: "Join a public activity with a cadence that fits, or create a focused group of your own.", cta: "Discover public Pods", href: "/discover" };

  const templateId = actionPod?.templateId ?? "build";
  const theme = adaptiveThemeForTemplate(templateId);
  const media = mediaForTemplate(templateId, actionPod?.id);
  const otherPods = memberships
    .filter(({ pod }) => pod.id !== actionPod?.id)
    .slice(0, 2);
  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(now);

  return (
    <main className={`app-shell adaptive-today theme-${theme}`}>
      <AppHeader profile={profileForSession(session)} />
      <header className="mobile-page-title today-page-title entrance entrance-hero">
        <p>{dateLabel}</p>
        <h1>{action.kind === "empty" ? "Start moving." : "Your move."}</h1>
      </header>

      <section className="today-focus-card entrance entrance-status">
        <Image alt={actionPod?.contractData?.activity.name ?? "Builders creating momentum together"} fill priority sizes="430px" src={media.hero} />
        <div className="today-focus-shade" />
        <div className="today-focus-copy">
          <span className="today-focus-state"><i />{copy.eyebrow}</span>
          <div>
            {actionPod?.contractData?.activity.name ? <small>{actionPod.contractData.activity.name}</small> : null}
            <h2>{copy.title}</h2>
            <p>{copy.detail}</p>
          </div>
          <Link className="today-focus-action" href={copy.href}>{copy.cta}<span aria-hidden="true">→</span></Link>
        </div>
      </section>

      {otherPods.length > 0 ? (
        <section className="also-moving">
          <div className="adaptive-section-heading"><h2>Also in motion</h2><Link href="/my-pods">View all</Link></div>
          <div className="moving-strip">
            {otherPods.map(({ membership, pod }, visualIndex) => {
              const presentation = presentPodRelationship({
                podId: pod.id,
                podState: pod.state as Exclude<PodState, "draft">,
                relationship: { kind: "member", state: membership.state, depositIntentId: membership.depositIntentId }
              });
              const otherMedia = mediaForTemplate(pod.templateId, visualIndex);
              return (
                <Link className={`moving-card theme-${adaptiveThemeForTemplate(pod.templateId)}`} href={presentation.href} key={pod.id}>
                  <Image alt="" fill sizes="260px" src={otherMedia.hero} />
                  <span><small>{presentation.statusLabel}</small><strong>{pod.contractData?.activity.name ?? "Your Pod"}</strong></span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
      <PrimaryNav active="today" />
    </main>
  );
}
