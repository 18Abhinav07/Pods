import { describe, expect, it, vi } from "vitest";

import { runSettlementCycle } from "../src/settlement/run-settlement-cycle";

function repository() {
  return {
    getEffectiveTime: vi.fn(async () => new Date("2027-05-04T00:00:00.000Z")),
    listSettlementReadyPods: vi.fn(async () => [
      { id: "pod-1" },
      { id: "pod-2" },
      { id: "pod-3" }
    ]),
    finalizePodSettlement: vi.fn(
      async ({ podId }: { podId: string; now: Date }) => ({
        kind: "finalized" as const,
        settlement: { id: `settlement-${podId}` }
      })
    )
  };
}

describe("runSettlementCycle", () => {
  it("uses audited time and finalizes every ready Pod independently", async () => {
    const store = repository();
    store.finalizePodSettlement
      .mockResolvedValueOnce({
        kind: "finalized",
        settlement: { id: "settlement-pod-1" }
      })
      .mockRejectedValueOnce(new Error("bad frozen matrix"))
      .mockResolvedValueOnce({
        kind: "finalized",
        settlement: { id: "settlement-pod-3" }
      });
    const onError = vi.fn();
    const realNow = new Date("2026-07-24T09:00:00.000Z");

    const results = await runSettlementCycle({
      repository: store,
      realNow: () => realNow,
      onError
    });

    const effectiveNow = new Date("2027-05-04T00:00:00.000Z");
    expect(store.getEffectiveTime).toHaveBeenCalledWith(realNow);
    expect(store.listSettlementReadyPods).toHaveBeenCalledWith(effectiveNow);
    expect(store.finalizePodSettlement).toHaveBeenCalledTimes(3);
    expect(store.finalizePodSettlement).toHaveBeenNthCalledWith(1, {
      podId: "pod-1",
      now: effectiveNow
    });
    expect(store.finalizePodSettlement).toHaveBeenNthCalledWith(3, {
      podId: "pod-3",
      now: effectiveNow
    });
    expect(onError).toHaveBeenCalledWith("pod-2", expect.any(Error));
    expect(results.map((result) => result.settlement.id)).toEqual([
      "settlement-pod-1",
      "settlement-pod-3"
    ]);
  });
});
