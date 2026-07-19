import { describe, expect, it } from "vitest";

import { chooseTodayEnrollmentAction } from "../src/lib/today-priority";

describe("Phase 2 Today priority", () => {
  it("places accepted funding before creator review and recruiting", () => {
    expect(chooseTodayEnrollmentAction({ acceptedPodId: "accepted", reviewPodId: "review", recruitPodId: "recruit" })).toEqual({ kind: "fund", podId: "accepted" });
  });

  it("places creator review before recruiting", () => {
    expect(chooseTodayEnrollmentAction({ acceptedPodId: null, reviewPodId: "review", recruitPodId: "recruit" })).toEqual({ kind: "review", podId: "review" });
  });

  it("falls back from recruiting to discovery", () => {
    expect(chooseTodayEnrollmentAction({ acceptedPodId: null, reviewPodId: null, recruitPodId: "recruit" })).toEqual({ kind: "recruit", podId: "recruit" });
    expect(chooseTodayEnrollmentAction({ acceptedPodId: null, reviewPodId: null, recruitPodId: null })).toEqual({ kind: "empty" });
  });
});
