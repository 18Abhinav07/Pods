import { notFound, redirect } from "next/navigation";

import { podsRepository } from "../../../../../../lib/server-db";
import { requireSession } from "../../../../../../lib/session";

export default async function RecoveryRedirectPage({
  params
}: {
  params: Promise<{ podId: string; submissionId: string }>;
}) {
  const { podId, submissionId } = await params;
  const session = await requireSession(`/pods/${podId}/submissions/${submissionId}/recover`);
  const now = await podsRepository.getEffectiveTime(new Date());
  const occurrence = await podsRepository.findRecoveryOccurrence({
    userId: session.userId,
    podId,
    submissionId,
    now
  });
  if (!occurrence) notFound();
  redirect(`/pods/${podId}/activity/${occurrence.id}?recover=${submissionId}`);
}
