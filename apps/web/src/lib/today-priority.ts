export type TodayEnrollmentAction =
  | { kind: "fund"; podId: string }
  | { kind: "review"; podId: string }
  | { kind: "recruit"; podId: string }
  | { kind: "empty" };

export function chooseTodayEnrollmentAction(input: {
  acceptedPodId: string | null;
  reviewPodId: string | null;
  recruitPodId: string | null;
}): TodayEnrollmentAction {
  if (input.acceptedPodId) return { kind: "fund", podId: input.acceptedPodId };
  if (input.reviewPodId) return { kind: "review", podId: input.reviewPodId };
  if (input.recruitPodId) return { kind: "recruit", podId: input.recruitPodId };
  return { kind: "empty" };
}
