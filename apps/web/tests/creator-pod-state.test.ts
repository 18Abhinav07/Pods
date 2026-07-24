import type { PodState } from "@pods/domain";
import { describe, expect, it } from "vitest";

import { presentCreatorPodState } from "../src/lib/creator-pod-state";

const stateEyebrows: Record<PodState, string> = {
  draft: "Pod draft",
  enrollment_open: "Enrollment command center",
  cutoff_evaluating: "Roster evaluating",
  locked_scheduled: "Roster locked",
  active: "Creator review active",
  final_review: "Final review",
  completed: "Pod completed",
  cancelled_refunding: "Returns in progress",
  cancelled: "Pod cancelled"
};

describe("presentCreatorPodState", () => {
  it.each(Object.entries(stateEyebrows) as Array<[PodState, string]>)(
    "presents %s without falling through to another lifecycle",
    (state, eyebrow) => {
      expect(presentCreatorPodState({
        podId: "pod-1",
        state,
        verifier: "creator",
        pendingReviewCount: 0
      }).admin.eyebrow).toBe(eyebrow);
    }
  );

  it.each(["active", "final_review"] as const)(
    "gives a creator-reviewed %s Pod the direct command destinations and pending count",
    (state) => {
      const presentation = presentCreatorPodState({
        podId: "pod-1",
        state,
        verifier: "creator",
        pendingReviewCount: 2
      });

      expect(presentation.admin.actions).toEqual([
        {
          kind: "review",
          label: "Review 2 proofs",
          href: "/pods/pod-1/admin/reviews",
          emphasis: "primary"
        },
        {
          kind: "room",
          label: "Open Pod room",
          href: "/pods/pod-1/room",
          emphasis: "secondary"
        },
        {
          kind: "activity",
          label: "View activity",
          href: "/pods/pod-1/activity",
          emphasis: "secondary"
        },
        {
          kind: "funding",
          label: "View participant funding stages",
          href: "/pods/pod-1/admin/funding",
          emphasis: "secondary"
        },
        {
          kind: "rules",
          label: "Review frozen rules",
          href: "/pods/pod-1/rules",
          emphasis: "secondary"
        }
      ]);
      expect(JSON.stringify(presentation).toLowerCase()).not.toContain("cancel");
    }
  );

  it("keeps a legacy Pods Team contract truthful without creator review authority", () => {
    const presentation = presentCreatorPodState({
      podId: "pod-1",
      state: "active",
      verifier: "pods_team",
      pendingReviewCount: 4
    });

    expect(presentation.admin.eyebrow).toBe("Legacy Pods Team review");
    expect(presentation.admin.detail).toContain(
      "This legacy Pod uses Pods Team review."
    );
    expect(presentation.admin.actions.map(({ kind }) => kind)).toEqual([
      "room",
      "activity",
      "funding",
      "rules"
    ]);
    expect(JSON.stringify(presentation).toLowerCase()).not.toContain("cancel");
  });

  it("presents completion as an archive and never as cancellation", () => {
    const presentation = presentCreatorPodState({
      podId: "pod-1",
      state: "completed",
      verifier: "creator",
      pendingReviewCount: 3
    });

    expect(presentation).toMatchObject({
      statusLabel: "Completed",
      actionLabel: "View Pod archive",
      href: "/pods/pod-1/room",
      admin: {
        eyebrow: "Pod completed"
      }
    });
    expect(JSON.stringify(presentation).toLowerCase()).not.toContain("cancel");
    expect(presentation.admin.actions.some(({ kind }) => kind === "review"))
      .toBe(false);
  });

  it.each(["cancelled_refunding", "cancelled"] as const)(
    "never exposes creator review from %s",
    (state) => {
      const presentation = presentCreatorPodState({
        podId: "pod-1",
        state,
        verifier: "creator",
        pendingReviewCount: 7
      });

      expect(presentation.admin.actions.some(({ kind }) => kind === "review"))
        .toBe(false);
    }
  );
});
