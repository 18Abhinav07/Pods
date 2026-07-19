import type { ActivityStepInput } from "@pods/domain";

import { ActivityForm } from "../../../../components/activity-form";
import { CreatorShell } from "../../../../components/creator-shell";
import { requireDraftOwner } from "../../../../lib/creator-guard";

function dateAfter(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

export default async function ActivityStepPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const { draft } = await searchParams;
  const { pod } = await requireDraftOwner(draft, "/pods/create/activity");
  const initial: ActivityStepInput = pod.draftData.activity ?? {
    name: "",
    purpose: "",
    startDate: dateAfter(7),
    endDate: dateAfter(28),
    timeZone: "Asia/Kolkata",
    weekdays: [1, 3, 5],
    config: {}
  };
  return <CreatorShell activeStep={1} eyebrow="Step 2 of 5" title="Define what showing up means." copy="The schedule and success criterion become immutable when this Pod is published."><ActivityForm podId={pod.id} templateId={pod.templateId} initial={initial} /></CreatorShell>;
}
