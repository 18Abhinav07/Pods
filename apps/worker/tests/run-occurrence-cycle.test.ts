import { describe, expect, it, vi } from "vitest";

import { runOccurrenceCycle } from "../src/activity/run-occurrence-cycle";

describe("runOccurrenceCycle", () => {
  it("advances activity from the audited Clock and returns the transition counts", async () => {
    const effectiveNow = new Date("2027-04-05T08:00:00.000Z");
    const realNow = new Date("2026-07-21T09:00:00.000Z");
    const repository = {
      getEffectiveTime: vi.fn(async () => effectiveNow),
      runOccurrenceTransitions: vi.fn(async () => ({
        activatedPods: 1,
        activatedMemberships: 3,
        advancedOccurrences: 1
      }))
    };

    const result = await runOccurrenceCycle({ repository, realNow: () => realNow });

    expect(repository.getEffectiveTime).toHaveBeenCalledWith(realNow);
    expect(repository.runOccurrenceTransitions).toHaveBeenCalledWith(effectiveNow);
    expect(result).toEqual({
      activatedPods: 1,
      activatedMemberships: 3,
      advancedOccurrences: 1
    });
  });
});
