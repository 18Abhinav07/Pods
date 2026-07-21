import type { MembershipState } from "@pods/domain";

import { presentPodRelationship } from "./participant-pod-state";

export type TodayParticipant = {
  podId: string;
  state: MembershipState;
  depositIntentId: string | null;
};

export type TodayEnrollmentAction =
  | {
      kind: "activity";
      podId: string;
      occurrenceId: string;
      action: "lock_task" | "submit_evidence" | "reviewing" | "approved" | "upcoming";
    }
  | ({ kind: "participant" } & TodayParticipant)
  | { kind: "review"; podId: string }
  | { kind: "creator_funding"; podId: string }
  | { kind: "recruit"; podId: string }
  | { kind: "empty" };

export function chooseTodayEnrollmentAction(input: {
  activities?: Array<{
    podId: string;
    occurrenceId: string;
    action: "lock_task" | "submit_evidence" | "reviewing" | "approved" | "upcoming";
  }>;
  participants: TodayParticipant[];
  reviewPodId: string | null;
  creatorFundingPodId?: string | null;
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
  const financialParticipant = participant
    ? presentPodRelationship({
        podId: participant.podId,
        relationship: {
          kind: "member",
          state: participant.state,
          depositIntentId: participant.depositIntentId
        }
      }).todayPriority
    : null;
  if (participant && financialParticipant !== null && financialParticipant <= 20) {
    return { kind: "participant", ...participant };
  }
  const activity = input.activities?.[0];
  if (activity) return { kind: "activity", ...activity };
  if (participant) return { kind: "participant", ...participant };
  if (input.reviewPodId) return { kind: "review", podId: input.reviewPodId };
  if (input.creatorFundingPodId) {
    return { kind: "creator_funding", podId: input.creatorFundingPodId };
  }
  if (input.recruitPodId) return { kind: "recruit", podId: input.recruitPodId };
  return { kind: "empty" };
}
