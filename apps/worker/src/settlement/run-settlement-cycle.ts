interface SettlementRepository {
  getEffectiveTime(realNow: Date): Promise<Date>;
  listSettlementReadyPods(now: Date): Promise<{ id: string }[]>;
  finalizePodSettlement(input: {
    podId: string;
    now: Date;
  }): Promise<{
    kind: "finalized" | "already_finalized";
    settlement: { id: string };
  }>;
}

export async function runSettlementCycle(input: {
  repository: SettlementRepository;
  realNow?: () => Date;
  onError?: (podId: string, error: Error) => void;
}) {
  const realNow = (input.realNow ?? (() => new Date()))();
  const effectiveNow = await input.repository.getEffectiveTime(realNow);
  const readyPods =
    await input.repository.listSettlementReadyPods(effectiveNow);
  const results: Awaited<
    ReturnType<SettlementRepository["finalizePodSettlement"]>
  >[] = [];

  for (const pod of readyPods) {
    try {
      results.push(
        await input.repository.finalizePodSettlement({
          podId: pod.id,
          now: effectiveNow
        })
      );
    } catch (error) {
      input.onError?.(
        pod.id,
        error instanceof Error
          ? error
          : new Error("Unknown settlement finalization failure")
      );
    }
  }

  return results;
}
