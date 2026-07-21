import type { PodsRepository } from "@pods/db";

type OccurrenceRepository = Pick<
  PodsRepository,
  "getEffectiveTime" | "runOccurrenceTransitions"
>;

export async function runOccurrenceCycle(input: {
  repository: OccurrenceRepository;
  realNow?: () => Date;
}) {
  const realNow = (input.realNow ?? (() => new Date()))();
  const effectiveNow = await input.repository.getEffectiveTime(realNow);
  return input.repository.runOccurrenceTransitions(effectiveNow);
}
