import { materializeOccurrences } from "@pods/domain";
import { redirect } from "next/navigation";

import { CommitmentForm } from "../../../../components/commitment-form";
import { CreatorShell } from "../../../../components/creator-shell";
import { requireDraftOwner } from "../../../../lib/creator-guard";

export default async function CommitmentStepPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const { draft } = await searchParams;
  const { pod } = await requireDraftOwner(draft, "/pods/create/commitment");
  const activity = pod.draftData.activity;
  if (!activity) redirect(`/pods/create/activity?draft=${pod.id}`);
  if (!pod.draftData.community) redirect(`/pods/create/community?draft=${pod.id}`);
  const commitmentCutoff = typeof activity.config.commitmentCutoff === "string" ? activity.config.commitmentCutoff : undefined;
  const occurrences = materializeOccurrences({
    startDate: activity.startDate,
    endDate: activity.endDate,
    timeZone: activity.timeZone,
    weekdays: activity.weekdays,
    ...(commitmentCutoff ? { commitmentCutoff } : {})
  });
  return <CreatorShell activeStep={3} eyebrow="Step 4 of 5" title="Put weight behind the cadence." copy="Every participant will fund the complete maximum commitment before the enrollment cutoff."><CommitmentForm podId={pod.id} occurrenceCount={occurrences.length} initialNim={pod.draftData.commitment?.nimPerOccurrence ?? "0.1"} /></CreatorShell>;
}
