import type { MembershipState } from "@pods/domain";

import { presentPodRelationship } from "./participant-pod-state";

export type TodayParticipant = {
  podId: string;
  state: MembershipState;
  depositIntentId: string | null;
};

export type TodayEnrollmentAction =
  | ({ kind: "participant" } & TodayParticipant)
  | { kind: "review"; podId: string }
  | { kind: "recruit"; podId: string }
  | { kind: "empty" };

export function chooseTodayEnrollmentAction(input: {
  participants: TodayParticipant[];
  reviewPodId: string | null;
  recruitPodId: string | null;
}): TodayEnrollmentAction {
  const participant = input.participants
    .map((candidate) => ({
      candidate,
      priority: presentPodRelationship({
        podId: candidate.podId,
        relationship: {
          kind: "member",
          state: candidate.state,
          depositIntentId: candidate.depositIntentId
        }
      }).todayPriority
    }))
    .filter(
      (item): item is { candidate: TodayParticipant; priority: number } =>
        item.priority !== null
    )
    .sort((left, right) => left.priority - right.priority)[0]?.candidate;
  if (participant) return { kind: "participant", ...participant };
  if (input.reviewPodId) return { kind: "review", podId: input.reviewPodId };
  if (input.recruitPodId) return { kind: "recruit", podId: input.recruitPodId };
  return { kind: "empty" };
}
