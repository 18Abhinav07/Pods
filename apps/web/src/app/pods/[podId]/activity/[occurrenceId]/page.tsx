import type { BuildDeliverableType } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityOccurrence } from "../../../../../components/activity-occurrence";
import { podsRepository } from "../../../../../lib/server-db";
import { requireSession } from "../../../../../lib/session";

const deliverables = ["pull_request", "commit", "issue", "live_artifact"] as const;

function allowedDeliverables(value: unknown): BuildDeliverableType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is BuildDeliverableType =>
    deliverables.includes(item as BuildDeliverableType)
  );
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
  if (!activity?.pod.contractData || !activity.occurrence.commitmentDeadlineAt) notFound();
  const now = await podsRepository.getEffectiveTime(new Date());
  const currentStreak = await podsRepository.getActivityStreak({
    membershipId: activity.membership.id,
    podId,
    now
  });
  const configuration = activity.pod.contractData.activity.config;
  return (
    <main className="app-shell activity-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <Link className="phase-pill" href={`/pods/${podId}/room`}>Pod room</Link>
      </header>
      <ActivityOccurrence
        allowedDeliverables={allowedDeliverables(configuration.allowedDeliverables)}
        closesAt={activity.occurrence.closesAt.toISOString()}
        commitment={activity.commitment ? {
          id: activity.commitment.id,
          task: activity.commitment.task,
          deliverableType: activity.commitment.deliverableType,
          lockedAt: activity.commitment.lockedAt.toISOString()
        } : null}
        commitmentDeadlineAt={activity.occurrence.commitmentDeadlineAt.toISOString()}
        currentStreak={currentStreak}
        occurrenceId={activity.occurrence.id}
        occurrenceOrdinal={activity.occurrence.ordinal}
        podId={podId}
        podName={activity.pod.contractData.activity.name}
        projectTheme={String(configuration.projectTheme ?? "")}
        settlementMode={activity.pod.contractData.settlementMode ?? "proportional"}
        stakeNim={activity.pod.contractData.commitment.lunaPerOccurrence / 100_000}
        submission={activity.submission ? {
          id: activity.submission.id,
          state: activity.submission.state,
          resultSummary: activity.submission.resultSummary,
          artifactUrl: activity.submission.artifactUrl,
          evidenceObjectKey: activity.submission.evidenceObjectKey,
          proofShareMode: activity.submission.proofShareMode
        } : null}
        timeZone={activity.pod.contractData.activity.timeZone}
      />
    </main>
  );
}
