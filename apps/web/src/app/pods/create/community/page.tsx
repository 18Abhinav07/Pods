import type { CommunityStepInput } from "@pods/domain";

import { CommunityForm } from "../../../../components/community-form";
import { CreatorShell } from "../../../../components/creator-shell";
import { requireDraftOwner } from "../../../../lib/creator-guard";
import { redirect } from "next/navigation";

export default async function CommunityStepPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const { draft } = await searchParams;
  const { pod } = await requireDraftOwner(draft, "/pods/create/community");
  if (!pod.draftData.activity) redirect(`/pods/create/activity?draft=${pod.id}`);
  const initial: CommunityStepInput = pod.draftData.community ?? {
    visibility: "public",
    minParticipants: 3,
    maxParticipants: 8,
    applicationQuestions: ["What will you commit to during this Pod?"],
    roomAudience: "members_only"
  };
  return <CreatorShell activeStep={2} eyebrow="Step 3 of 5" title="Choose who can enter." copy="Public Pods are discoverable and application-based. Private Pods stay hidden behind invitations."><CommunityForm podId={pod.id} initial={initial} /></CreatorShell>;
}
