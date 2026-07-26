import { describe, expect, it } from "vitest";

import {
  ACTOR_DEFINITIONS,
  SCREEN_REGISTRY,
  TRANSITION_REGISTRY,
  createInitialPreviewState,
  dispatchPreviewAction,
  getAvailableTransitions
} from "../src/components/design-preview/registry";
import type {
  ActivityOutcome,
  PodLifecycle,
  PreviewActorId,
  PreviewState
} from "../src/components/design-preview/model";

describe("design preview journey registry", () => {
  it("gives every actor a registered initial screen", () => {
    for (const actor of Object.values(ACTOR_DEFINITIONS)) {
      expect(SCREEN_REGISTRY[actor.initialScreen]).toBeDefined();
    }
  });

  it("registers every transition destination", () => {
    for (const transition of TRANSITION_REGISTRY) {
      expect(SCREEN_REGISTRY[transition.to]).toBeDefined();
    }
  });

  it("switches inspected journeys without changing the signed-in viewer", () => {
    const state = createInitialPreviewState({
      id: "viewer-1",
      displayName: "Ryuk",
      handle: "ryuk"
    });

    const next = dispatchPreviewAction(state, {
      type: "switch-actor",
      actor: "creator"
    });

    expect(next.actor).toBe("creator");
    expect(next.viewer).toEqual(state.viewer);
  });

  it("preserves selected entities while navigating between screens", () => {
    const selected = {
      podId: "pod-1",
      personHandle: "arivale",
      submissionId: "submission-1",
      applicationId: "application-1",
      transferId: "transfer-1"
    } satisfies PreviewState["selected"];
    const state: PreviewState = {
      ...createInitialPreviewState(),
      selected
    };

    const next = dispatchPreviewAction(state, {
      type: "open-screen",
      screen: "public-pod-details"
    });

    expect(next.selected).toEqual(selected);
  });

  it("does not let an applicant jump directly to funding", () => {
    const screens = [
      "application",
      "application-submitted",
      "application-pending"
    ] as const;

    for (const screen of screens) {
      const transitions = getAvailableTransitions({
        ...createInitialPreviewState(),
        actor: "applicant",
        screen
      });
      expect(transitions.map((transition) => transition.to)).not.toContain(
        "funding-summary"
      );
    }
  });

  it("does not let a waiting member enter the room before roster lock", () => {
    const transitions = getAvailableTransitions({
      ...createInitialPreviewState(),
      actor: "waiting-member",
      screen: "funding-waiting"
    });

    expect(transitions.map((transition) => transition.to)).not.toContain(
      "pod-room"
    );
  });

  it("does not let a participant set their own proof outcome", () => {
    const transitions = getAvailableTransitions({
      ...createInitialPreviewState(),
      actor: "participant",
      screen: "creator-reviewing"
    });

    expect(transitions).toHaveLength(0);
    expect(
      transitions.some((transition) =>
        ["proof-approved", "proof-rejected", "proof-timeout-protected"].includes(
          transition.to
        )
      )
    ).toBe(false);
  });

  it("contains no obsolete clarification, dispute, appeal, or grace states", () => {
    const serialized = JSON.stringify({
      actors: ACTOR_DEFINITIONS,
      screens: SCREEN_REGISTRY,
      transitions: TRANSITION_REGISTRY
    }).toLowerCase();

    for (const obsolete of ["clarification", "dispute", "appeal", "grace"]) {
      expect(serialized).not.toContain(obsolete);
    }
  });

  it("uses final_review then completed as the Pod lifecycle", () => {
    const validLifecycle: PodLifecycle[] = [
      "draft",
      "enrollment_open",
      "funding",
      "waiting",
      "active",
      "final_review",
      "completed",
      "cancelled"
    ];
    const validOutcomes: ActivityOutcome[] = [
      "approved",
      "rejected",
      "timeout_protected",
      "missed"
    ];
    const allActors: PreviewActorId[] = Object.keys(
      ACTOR_DEFINITIONS
    ) as PreviewActorId[];

    expect(validLifecycle).toEqual([
      "draft",
      "enrollment_open",
      "funding",
      "waiting",
      "active",
      "final_review",
      "completed",
      "cancelled"
    ]);
    expect(validOutcomes).toEqual([
      "approved",
      "rejected",
      "timeout_protected",
      "missed"
    ]);
    expect(allActors).toContain("waiting-member");
  });
});
