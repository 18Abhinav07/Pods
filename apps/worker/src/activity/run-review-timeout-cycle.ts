import type { PodsRepository } from "@pods/db";

type ReviewTimeoutRepository = Pick<
  PodsRepository,
  "getEffectiveTime" | "protectTimedOutReviews"
>;

export async function runReviewTimeoutCycle(input: {
  repository: ReviewTimeoutRepository;
  realNow?: () => Date;
}) {
  const realNow = (input.realNow ?? (() => new Date()))();
  const effectiveNow = await input.repository.getEffectiveTime(realNow);
  return input.repository.protectTimedOutReviews(effectiveNow);
}
