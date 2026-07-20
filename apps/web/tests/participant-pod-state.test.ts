import { describe, expect, it } from "vitest";

import {
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
      statusLabel: "Open to apply",
      actionLabel: "View Pod",
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
    ["applied", "Application pending", "View application", "/applications"],
    ["accepted_unfunded", "Accepted, funding required", "Continue to funding", "/pods/pod-1/fund"],
    ["funding_failed", "Funding needs attention", "Retry funding", "/pods/pod-1/fund"],
    ["deposit_pending", "Funding in progress", "Track funding", "/pods/pod-1/fund/status?intent=intent-1"],
    ["funded_provisional", "Commitment credited", "Track commitment", "/pods/pod-1/fund/status?intent=intent-1"],
    ["roster_locked", "Joined", "Open Pod", "/pods/pod-1/rules"],
    ["refund_pending", "Refund in progress", "Track refund", "/pods/pod-1/fund/status?intent=intent-1"],
    ["refunded", "Refund completed", "View receipt", "/pods/pod-1/fund/status?intent=intent-1"]
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
      href: "/applications"
    });
  });
});
