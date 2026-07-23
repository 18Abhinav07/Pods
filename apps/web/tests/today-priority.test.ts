import { describe, expect, it } from "vitest";

import { chooseTodayEnrollmentAction } from "../src/lib/today-priority";

describe("Phase 2 Today priority", () => {
  it("places an open occurrence before enrollment and creator work", () => {
    expect(chooseTodayEnrollmentAction({
      activities: [{
        podId: "active-pod",
        occurrenceId: "occurrence-1",
        action: "lock_task"
      }],
      participants: [{ podId: "applied", state: "applied", depositIntentId: null }],
      reviewPodId: "review",
      creatorReviewPodId: "creator-review",
      recruitPodId: "recruit"
    })).toEqual({
      kind: "activity",
      podId: "active-pod",
      occurrenceId: "occurrence-1",
      action: "lock_task"
    });
  });

  it("keeps unfinished funding ahead of occurrence work", () => {
    expect(chooseTodayEnrollmentAction({
      activities: [{ podId: "active-pod", occurrenceId: "occurrence-1", action: "lock_task" }],
      participants: [{ podId: "funding", state: "funding_failed", depositIntentId: null }],
      reviewPodId: null,
      recruitPodId: null
    })).toMatchObject({ kind: "participant", podId: "funding" });
  });

  it("places participant funding recovery before creator review and recruiting", () => {
    expect(chooseTodayEnrollmentAction({
      participants: [{ podId: "funding", state: "funding_failed", depositIntentId: null }],
      reviewPodId: "review",
      creatorReviewPodId: "creator-review",
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

  it("places pending creator proofs after participant activity but before nonurgent work", () => {
    expect(chooseTodayEnrollmentAction({
      activities: [{
        podId: "activity",
        occurrenceId: "occurrence-1",
        action: "submit_evidence"
      }],
      participants: [],
      creatorReviewPodId: "creator-review",
      reviewPodId: "application-review",
      recruitPodId: "recruit"
    })).toMatchObject({ kind: "activity", podId: "activity" });

    expect(chooseTodayEnrollmentAction({
      participants: [{
        podId: "application",
        state: "applied",
        depositIntentId: null
      }],
      creatorReviewPodId: "creator-review",
      reviewPodId: "application-review",
      creatorFundingPodId: "creator-funding",
      recruitPodId: "recruit"
    })).toEqual({ kind: "creator_review", podId: "creator-review" });
  });

  it.each([
    "upcoming",
    "reviewing",
    "approved",
    "rejected",
    "timeout_protected"
  ] as const)(
    "places creator review before passive %s participant activity",
    (activity) => {
      expect(chooseTodayEnrollmentAction({
        activities: [{
          podId: "activity",
          occurrenceId: "occurrence-1",
          action: activity
        }],
        participants: [],
        creatorReviewPodId: "creator-review",
        reviewPodId: null,
        recruitPodId: null
      })).toEqual({ kind: "creator_review", podId: "creator-review" });
    }
  );

  it.each(["lock_task", "submit_evidence"] as const)(
    "keeps due member work %s before creator review",
    (activity) => {
      expect(chooseTodayEnrollmentAction({
        activities: [{
          podId: "activity",
          occurrenceId: "occurrence-1",
          action: activity
        }],
        participants: [],
        creatorReviewPodId: "creator-review",
        reviewPodId: null,
        recruitPodId: null
      })).toMatchObject({ kind: "activity", action: activity });
    }
  );

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

  it("does not turn a completed participant record into current work", () => {
    expect(chooseTodayEnrollmentAction({
      participants: [{
        podId: "completed-pod",
        podState: "completed",
        state: "active",
        depositIntentId: "intent-1"
      }],
      reviewPodId: null,
      recruitPodId: null
    })).toEqual({ kind: "empty" });
  });
});
