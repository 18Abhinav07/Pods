import { notFound } from "next/navigation";

import { podsRepository } from "./server-db";
import { requireSession } from "./session";

export async function requireEnrollmentOwner(podId: string, returnPath: string) {
  const session = await requireSession(returnPath);
  const pod = await podsRepository.getPodForOwner(session.userId, podId);
  if (!pod?.contractData || !pod.contractHash || pod.state === "draft") notFound();
  return { session, pod };
}
