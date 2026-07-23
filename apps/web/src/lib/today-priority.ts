import type { MembershipState, PodState } from "@pods/domain";

import { presentPodRelationship } from "./participant-pod-state";

export type TodayParticipant = {
  podId: string;
  state: MembershipState;
  podState?: Exclude<PodState, "draft"> | undefined;
  depositIntentId: string | null;
};

export type TodayActivityAction =
  | "lock_task"
  | "submit_evidence"
  | "reviewing"
  | "approved"
  | "rejected"
  | "timeout_protected"
  | "upcoming";

export type TodayEnrollmentAction =
  | {
      kind: "activity";
      podId: string;
      occurrenceId: string;
      action: TodayActivityAction;
    }
  | ({ kind: "participant" } & TodayParticipant)
  | { kind: "creator_review"; podId: string }
  | { kind: "review"; podId: string }
  | { kind: "creator_funding"; podId: string }
  | { kind: "recruit"; podId: string }
  | { kind: "empty" };

export function chooseTodayEnrollmentAction(input: {
  activities?: Array<{
    podId: string;
    occurrenceId: string;
    action: TodayActivityAction;
  }>;
  participants: TodayParticipant[];
  creatorReviewPodId?: string | null;
  reviewPodId: string | null;
  creatorFundingPodId?: string | null;
  recruitPodId: string | null;
}): TodayEnrollmentAction {
  const participant = input.participants
    .map((candidate) => ({
      candidate,
      priority: presentPodRelationship({
        podId: candidate.podId,
        podState: candidate.podState,
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
        podState: participant.podState,
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
  const dueActivity = input.activities?.find(
    ({ action }) => action === "lock_task" || action === "submit_evidence"
  );
  if (dueActivity) return { kind: "activity", ...dueActivity };
  if (input.creatorReviewPodId) {
    return { kind: "creator_review", podId: input.creatorReviewPodId };
  }
  const passiveActivity = input.activities?.[0];
  if (passiveActivity) return { kind: "activity", ...passiveActivity };
  if (participant) return { kind: "participant", ...participant };
  if (input.reviewPodId) return { kind: "review", podId: input.reviewPodId };
  if (input.creatorFundingPodId) {
    return { kind: "creator_funding", podId: input.creatorFundingPodId };
  }
  if (input.recruitPodId) return { kind: "recruit", podId: input.recruitPodId };
  return { kind: "empty" };
}
