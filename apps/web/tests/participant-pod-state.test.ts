import { describe, expect, it } from "vitest";

import {
  presentCreatorPodState,
  presentPodRelationship,
  relationshipForViewer
} from "../src/lib/participant-pod-state";

describe("participant Pod relationship presentation", () => {
  it("resolves creator, member, and visitor relationships from viewer data", () => {
    expect(
      relationshipForViewer({
        creatorUserId: "creator",
        viewerUserId: "creator",
        membership: { state: "applied", depositIntentId: null }
      })
    ).toEqual({ kind: "creator" });
    expect(
      relationshipForViewer({
        creatorUserId: "creator",
        viewerUserId: "participant",
        membership: { state: "funding_failed", depositIntentId: null }
      })
    ).toEqual({ kind: "member", state: "funding_failed", depositIntentId: null });
    expect(
      relationshipForViewer({
        creatorUserId: "creator",
        viewerUserId: null,
        membership: null
      })
    ).toEqual({ kind: "visitor" });
  });

  it("keeps the open visitor and creator actions distinct", () => {
    expect(
      presentPodRelationship({ podId: "pod-1", relationship: { kind: "visitor" } })
    ).toMatchObject({
      statusLabel: "Accepting applications",
      actionLabel: "Apply",
      href: "/pods/pod-1"
    });
    expect(
      presentPodRelationship({ podId: "pod-1", relationship: { kind: "creator" } })
    ).toMatchObject({
      statusLabel: "Creator",
      actionLabel: "Manage enrollment",
      href: "/pods/pod-1/admin"
    });
  });

  it.each([
    ["applied", "Application pending", "View application", "/applications?pod=pod-1"],
    ["accepted_unfunded", "Accepted, funding required", "Continue to funding", "/pods/pod-1/fund"],
    ["funding_failed", "Funding needs attention", "Retry funding", "/pods/pod-1/fund"],
    ["deposit_pending", "Funding in progress", "Track funding", "/pods/pod-1/fund/status?intent=intent-1"],
    ["funded_provisional", "Commitment credited", "Track commitment", "/pods/pod-1/today"],
    ["roster_locked", "Joined", "Open Pod", "/pods/pod-1/room"],
    ["active", "Activity live", "Open Pod", "/pods/pod-1/room"],
    ["excluded_at_cutoff", "Not included at cutoff", "View refund status", "/pods/pod-1/today"],
    ["refund_pending", "Refund in progress", "Track refund", "/pods/pod-1/today"],
    ["refunded", "Refund completed", "View receipt", "/pods/pod-1/today"]
  ] as const)("maps %s to one canonical status and action", (state, statusLabel, actionLabel, href) => {
    expect(
      presentPodRelationship({
        podId: "pod-1",
        relationship: { kind: "member", state, depositIntentId: "intent-1" }
      })
    ).toMatchObject({ statusLabel, actionLabel, href });
  });

  it("does not make terminal application outcomes look open to apply", () => {
    expect(
      presentPodRelationship({
        podId: "pod-1",
        relationship: { kind: "member", state: "application_rejected", depositIntentId: null }
      })
    ).toMatchObject({
      statusLabel: "Application not accepted",
      actionLabel: "View outcome",
      href: "/applications?pod=pod-1"
    });
  });

  it("routes final review and completed Pods to their permanent room record", () => {
    expect(presentCreatorPodState({
      podId: "pod-1",
      state: "final_review"
    })).toMatchObject({
      statusLabel: "Final review",
      actionLabel: "Open archived room",
      href: "/pods/pod-1/room"
    });
    expect(presentCreatorPodState({
      podId: "pod-1",
      state: "completed"
    })).toMatchObject({
      statusLabel: "Completed",
      actionLabel: "View Pod archive",
      href: "/pods/pod-1/room"
    });
    expect(presentPodRelationship({
      podId: "pod-1",
      podState: "completed",
      relationship: {
        kind: "member",
        state: "active",
        depositIntentId: "intent-1"
      }
    })).toMatchObject({
      statusLabel: "Completed",
      actionLabel: "View Pod archive",
      href: "/pods/pod-1/room",
      todayPriority: null
    });
  });

  it("routes proportional final review and completion to the canonical settlement", () => {
    expect(presentCreatorPodState({
      podId: "pod-1",
      state: "final_review",
      settlementMode: "proportional"
    })).toMatchObject({
      actionLabel: "View settlement",
      href: "/pods/pod-1/settlement"
    });
    expect(presentPodRelationship({
      podId: "pod-1",
      podState: "completed",
      settlementMode: "proportional",
      relationship: {
        kind: "member",
        state: "active",
        depositIntentId: "intent-1"
      }
    })).toMatchObject({
      actionLabel: "View settlement",
      href: "/pods/pod-1/settlement"
    });
  });
});
