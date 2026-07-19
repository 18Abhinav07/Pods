import { notFound, redirect } from "next/navigation";

import { podsRepository } from "./server-db";
import { requireSession } from "./session";

export async function requireDraftOwner(
  podId: string | undefined,
  returnPath: string
) {
  if (!podId) redirect("/pods/create/template");
  const session = await requireSession(`${returnPath}?draft=${encodeURIComponent(podId)}`);
  const pod = await podsRepository.getPodForOwner(session.userId, podId);
  if (!pod) notFound();
  if (pod.state !== "draft") redirect(`/pods/${pod.id}/rules`);
  return { session, pod };
}
