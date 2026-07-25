import { templateContracts, type BuildDeliverableType } from "@pods/domain";
import { notFound, redirect } from "next/navigation";

import { ActivityOccurrence } from "../../../../../components/activity-occurrence";
import styles from "../../../../../components/activity-ritual/activity-ritual.module.css";
import { PodActionHeader } from "../../../../../components/activity-ritual/pod-action-header";
import { toActivitySubmissionView } from "../../../../../lib/activity-submission-view";
import { podsRepository } from "../../../../../lib/server-db";
import { requireSession } from "../../../../../lib/session";

const deliverables = ["pull_request", "commit", "issue", "live_artifact"] as const;

function allowedDeliverables(value: unknown): BuildDeliverableType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is BuildDeliverableType =>
    deliverables.includes(item as BuildDeliverableType)
  );
}

function templateTheme(
  templateId: import("@pods/domain").TemplateId,
  configuration: Record<string, unknown>
) {
  if (templateId === "fitness") {
    return `${String(configuration.activityType ?? "Movement")} · ${String(configuration.measurableMinimum ?? "")}`;
  }
  if (templateId === "reading") {
    return String(configuration.bookOrTheme ?? "Reading practice");
  }
  if (templateId === "study") {
    return String(configuration.subject ?? "Focused study");
  }
  if (templateId === "create") {
    return String(configuration.discipline ?? "Creative practice");
  }
  return String(configuration.projectTheme ?? "Build and ship");
}

export default async function ActivityOccurrencePage({
  params
}: {
  params: Promise<{ podId: string; occurrenceId: string }>;
}) {
  const { podId, occurrenceId } = await params;
  const session = await requireSession(`/pods/${podId}/activity/${occurrenceId}`);
  const activity = await podsRepository.getActivityOccurrenceForMember({
    userId: session.userId,
    podId,
    occurrenceId
  });
  if (!activity?.pod.contractData) notFound();
  if (activity.submission && activity.submission.state !== "draft") {
    redirect(`/pods/${podId}/submissions/${activity.submission.id}`);
  }
  const now = await podsRepository.getEffectiveTime(new Date());
  const commitmentDeadline =
    activity.occurrence.commitmentDeadlineAt ?? activity.occurrence.closesAt;
  const initiallyOpen =
    now.getTime() >= activity.occurrence.opensAt.getTime() &&
    now.getTime() < commitmentDeadline.getTime();
  const currentStreak = await podsRepository.getActivityStreak({
    membershipId: activity.membership.id,
    podId,
    now
  });
  const verifierAuthority =
    await podsRepository.getVerifierAuthorityForPod(podId);
  const reviewerKind =
    verifierAuthority?.effectiveVerifier ??
    activity.pod.contractData.verification?.verifier ??
    "creator";
  const configuration = activity.pod.contractData.activity.config;
  const templateLabel =
    templateContracts.find((template) => template.id === activity.pod.templateId)
      ?.name ?? "Activity";
  return (
    <main className={styles.ritualShell}>
      <PodActionHeader
        occurrenceNumber={activity.occurrence.ordinal}
        podId={podId}
        podName={activity.pod.contractData.activity.name}
        templateLabel={templateLabel}
      />
      <div className={styles.mobileContent}>
        <ActivityOccurrence
          allowedDeliverables={allowedDeliverables(configuration.allowedDeliverables)}
          closesAt={activity.occurrence.closesAt.toISOString()}
          commitment={activity.commitment ? {
            id: activity.commitment.id,
            kind: activity.commitment.kind,
            task: activity.commitment.task,
            deliverableType: activity.commitment.deliverableType,
            details: activity.commitment.details,
            lockedAt: activity.commitment.lockedAt.toISOString()
          } : null}
          commitmentDeadlineAt={
            activity.occurrence.commitmentDeadlineAt?.toISOString() ?? null
          }
          currentStreak={currentStreak}
          effectiveNowAt={now.toISOString()}
          initiallyOpen={initiallyOpen}
          occurrenceId={activity.occurrence.id}
          occurrenceOrdinal={activity.occurrence.ordinal}
          opensAt={activity.occurrence.opensAt.toISOString()}
          podId={podId}
          podName={activity.pod.contractData.activity.name}
          projectTheme={templateTheme(activity.pod.templateId, configuration)}
          reviewerKind={reviewerKind}
          settlementMode={activity.pod.contractData.settlementMode ?? "proportional"}
          stakeNim={activity.pod.contractData.commitment.lunaPerOccurrence / 100_000}
          submission={
            activity.submission
              ? toActivitySubmissionView(activity.submission)
              : null
          }
          publicVisitorSharingEnabled={
            activity.pod.contractData.version === 2 &&
            activity.pod.contractData.community.roomAudience === "public_read_only"
          }
          timeZone={activity.pod.contractData.activity.timeZone}
          templateConfig={configuration}
          templateId={activity.pod.contractData.templateId}
        />
      </div>
    </main>
  );
}
