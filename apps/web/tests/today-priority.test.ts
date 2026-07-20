import { describe, expect, it } from "vitest";

import { chooseTodayEnrollmentAction } from "../src/lib/today-priority";

describe("Phase 2 Today priority", () => {
  it("places participant funding recovery before creator review and recruiting", () => {
    expect(chooseTodayEnrollmentAction({
      participants: [{ podId: "funding", state: "funding_failed", depositIntentId: null }],
      reviewPodId: "review",
      recruitPodId: "recruit"
    })).toEqual({
      kind: "participant",
      podId: "funding",
      state: "funding_failed",
      depositIntentId: null
    });
  });

  it("keeps an application or funding stage visible instead of falling back to discovery", () => {
    expect(chooseTodayEnrollmentAction({
      participants: [{ podId: "applied", state: "applied", depositIntentId: null }],
      reviewPodId: null,
      recruitPodId: null
    })).toMatchObject({ kind: "participant", podId: "applied", state: "applied" });
    expect(chooseTodayEnrollmentAction({
      participants: [{ podId: "credited", state: "funded_provisional", depositIntentId: "intent-1" }],
      reviewPodId: null,
      recruitPodId: null
    })).toMatchObject({ kind: "participant", podId: "credited", state: "funded_provisional" });
  });

  it("chooses the participant state with the most urgent next action", () => {
    expect(chooseTodayEnrollmentAction({
      participants: [
        { podId: "applied", state: "applied", depositIntentId: null },
        { podId: "pending", state: "deposit_pending", depositIntentId: "intent-2" },
        { podId: "failed", state: "funding_failed", depositIntentId: null }
      ],
      reviewPodId: null,
      recruitPodId: null
    })).toMatchObject({ kind: "participant", podId: "failed", state: "funding_failed" });
  });

  it("places creator review before recruiting", () => {
    expect(chooseTodayEnrollmentAction({ participants: [], reviewPodId: "review", recruitPodId: "recruit" })).toEqual({ kind: "review", podId: "review" });
  });

  it("keeps a creator roster or refund outcome visible before recruiting", () => {
    expect(chooseTodayEnrollmentAction({
      participants: [],
      reviewPodId: null,
      creatorFundingPodId: "funding-overview",
      recruitPodId: "recruit"
    })).toEqual({ kind: "creator_funding", podId: "funding-overview" });
  });

  it("falls back from recruiting to discovery", () => {
    expect(chooseTodayEnrollmentAction({ participants: [], reviewPodId: null, recruitPodId: "recruit" })).toEqual({ kind: "recruit", podId: "recruit" });
    expect(chooseTodayEnrollmentAction({ participants: [], reviewPodId: null, recruitPodId: null })).toEqual({ kind: "empty" });
  });
});
