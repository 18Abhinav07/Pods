import type { PodsRepository } from "@pods/db";

type CutoffRepository = Pick<
  PodsRepository,
  "getEffectiveTime" | "listPodsDueForCutoff" | "applyPodCutoff"
>;

export async function runCutoffCycle(input: {
  repository: CutoffRepository;
  realNow?: () => Date;
  onError?: (podId: string, error: Error) => void;
}) {
  const realNow = (input.realNow ?? (() => new Date()))();
  const effectiveNow = await input.repository.getEffectiveTime(realNow);
  const duePods = await input.repository.listPodsDueForCutoff(effectiveNow);
  const results: Awaited<ReturnType<CutoffRepository["applyPodCutoff"]>>[] = [];
  for (const pod of duePods) {
    try {
      results.push(
        await input.repository.applyPodCutoff({ podId: pod.id, now: effectiveNow })
      );
    } catch (error) {
      input.onError?.(
        pod.id,
        error instanceof Error ? error : new Error("Unknown cutoff failure")
      );
    }
  }
  return results;
}
