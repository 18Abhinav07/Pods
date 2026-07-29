import { describe, expect, it } from "vitest";

import { runProofReviewDeadlineCycle } from "../src/activity/run-proof-review-deadline-cycle";

describe("runProofReviewDeadlineCycle", () => {
  it("uses audited effective time for proof-case deadlines", async () => {
    const realNow = new Date("2026-07-28T12:00:00.000Z");
    const effectiveNow = new Date("2027-04-06T12:00:00.000Z");
    const calls: Array<{ name: string; now: Date }> = [];
    const repository = {
      async getEffectiveTime(now: Date) {
        calls.push({ name: "getEffectiveTime", now });
        return effectiveNow;
      },
      async runProofReviewDeadlines(now: Date) {
        calls.push({ name: "runProofReviewDeadlines", now });
        return { processed: 2, advanced: 1, resolved: 1 };
      }
    };

    await expect(runProofReviewDeadlineCycle({
      repository,
      realNow: () => realNow
    })).resolves.toEqual({ processed: 2, advanced: 1, resolved: 1 });
    expect(calls).toEqual([
      { name: "getEffectiveTime", now: realNow },
      { name: "runProofReviewDeadlines", now: effectiveNow }
    ]);
  });
});
