import type { PodsRepository } from "@pods/db";

type ProofReviewDeadlineRepository = Pick<
  PodsRepository,
  "getEffectiveTime" | "runProofReviewDeadlines"
>;

export async function runProofReviewDeadlineCycle(input: {
  repository: ProofReviewDeadlineRepository;
  realNow?: () => Date;
}) {
  const realNow = (input.realNow ?? (() => new Date()))();
  const effectiveNow = await input.repository.getEffectiveTime(realNow);
  return input.repository.runProofReviewDeadlines(effectiveNow);
}
