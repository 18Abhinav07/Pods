import { podsRepository } from "./server-db";
import { getCurrentSession } from "./session";

export function realtimeSpikeEnabled() {
  return process.env.PODS_REALTIME_SPIKE_ENABLED === "true";
}

export async function authorizeRealtimeSpikePod(podId: string) {
  const session = await getCurrentSession();
  if (!session) return { status: "unauthenticated" as const };
  const [membership, owned] = await Promise.all([
    podsRepository.getMembershipForUser(session.userId, podId),
    podsRepository.getPodForOwner(session.userId, podId)
  ]);
  const validationStates = new Set([
    "accepted_unfunded",
    "funded_provisional",
    "roster_locked",
    "active"
  ]);
  if (!owned && (!membership || !validationStates.has(membership.state))) {
    return { status: "forbidden" as const };
  }
  return { status: "authorized" as const, session };
}
