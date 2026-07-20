import { describe, expect, it, vi } from "vitest";

import { runCutoffCycle } from "../src/funding/run-cutoff-cycle";

function repository() {
  return {
    getEffectiveTime: vi.fn(async () => new Date("2027-03-08T00:00:00.000Z")),
    listPodsDueForCutoff: vi.fn(async () => [{ id: "pod-1" }, { id: "pod-2" }]),
    applyPodCutoff: vi.fn(async ({ podId }: { podId: string }) => ({
      podId,
      podState: "locked_scheduled",
      includedMembershipIds: [] as string[],
      refundLegIds: [] as string[]
    }))
  };
}

describe("runCutoffCycle", () => {
  it("uses the audited effective time and processes every due Pod once", async () => {
    const store = repository();
    const realNow = new Date("2026-07-20T10:00:00.000Z");

    const results = await runCutoffCycle({ repository: store, realNow: () => realNow });

    expect(store.getEffectiveTime).toHaveBeenCalledWith(realNow);
    expect(store.listPodsDueForCutoff).toHaveBeenCalledWith(
      new Date("2027-03-08T00:00:00.000Z")
    );
    expect(store.applyPodCutoff).toHaveBeenCalledTimes(2);
    expect(store.applyPodCutoff).toHaveBeenNthCalledWith(1, {
      podId: "pod-1",
      now: new Date("2027-03-08T00:00:00.000Z")
    });
    expect(results).toEqual([
      {
        podId: "pod-1",
        podState: "locked_scheduled",
        includedMembershipIds: [],
        refundLegIds: []
      },
      {
        podId: "pod-2",
        podState: "locked_scheduled",
        includedMembershipIds: [],
        refundLegIds: []
      }
    ]);
  });

  it("reports one Pod failure without fabricating a result for it", async () => {
    const store = repository();
    store.applyPodCutoff
      .mockRejectedValueOnce(new Error("serialization failure"))
      .mockResolvedValueOnce({
        podId: "pod-2",
        podState: "cancelled_refunding",
        includedMembershipIds: [],
        refundLegIds: ["refund-1"]
      });
    const onError = vi.fn();

    const results = await runCutoffCycle({ repository: store, onError });

    expect(onError).toHaveBeenCalledWith("pod-1", expect.any(Error));
    expect(results).toEqual([
      {
        podId: "pod-2",
        podState: "cancelled_refunding",
        includedMembershipIds: [],
        refundLegIds: ["refund-1"]
      }
    ]);
  });
});
