import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getWaitingRoomForUser = vi.hoisted(() => vi.fn());
const getVerifierAuthorityForPod = vi.hoisted(() => vi.fn());

const pod = {
  id: "pod-1",
  state: "locked_scheduled",
  contractHash: "a".repeat(64),
  contractData: {
    templateId: "build",
    settlementMode: "proportional",
    activity: {
      name: "Ship together",
      purpose: "Complete one visible build commitment each occurrence.",
      startDate: "2027-03-08",
      endDate: "2027-03-12",
      timeZone: "UTC"
    },
    community: { visibility: "public", minParticipants: 2, maxParticipants: 4 },
    commitment: { occurrenceCount: 3, totalLuna: 30_000, lunaPerOccurrence: 10_000 },
    verification: { verifier: "creator" }
  }
};

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "participant-1" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getPodForOwner: vi.fn(async () => null),
    getPodForAcceptedMember: vi.fn(async () => null),
    getWaitingRoomForUser,
    getMembershipForUser: vi.fn(async () => ({
      state: "active",
      depositIntentId: "intent-1"
    })),
    getVerifierAuthorityForPod
  }
}));

import RulesPage from "../src/app/pods/[podId]/rules/page";

describe("RulesPage", () => {
  beforeEach(() => {
    getWaitingRoomForUser.mockResolvedValue({ pod });
    getVerifierAuthorityForPod.mockResolvedValue({
      frozenVerifier: "creator",
      effectiveVerifier: "creator",
      source: "contract",
      amendedAt: null
    });
  });

  it("keeps the frozen contract available to an active participant", async () => {
    render(await RulesPage({ params: Promise.resolve({ podId: "pod-1" }) }));

    expect(screen.getByRole("link", { name: "Open Pod" }))
      .toHaveAttribute("href", "/pods/pod-1/room");
    expect(screen.getByText("Creator review")).toBeVisible();
    expect(screen.getByText(
      "The Pod creator reviews member proofs. Approval and rejection can change how member stakes are redistributed. The creator does not fund this Pod or receive member funds. This Testnet MVP has no appeal or peer vote. Fund only if you trust the creator and accept these frozen rules."
    )).toBeVisible();
    expect(screen.queryByText("Review funding handoff")).not.toBeInTheDocument();
  });

  it("separates a frozen Pods Team contract from its Testnet creator amendment", async () => {
    getWaitingRoomForUser.mockResolvedValueOnce({
      pod: {
        ...pod,
        contractData: {
          ...pod.contractData,
          settlementMode: "full_refund_alpha",
          verification: { verifier: "pods_team" }
        }
      }
    });
    getVerifierAuthorityForPod.mockResolvedValueOnce({
      frozenVerifier: "pods_team",
      effectiveVerifier: "creator",
      source: "testnet_override",
      amendedAt: new Date("2026-07-24T08:30:00.000Z")
    });

    render(await RulesPage({ params: Promise.resolve({ podId: "pod-1" }) }));

    expect(screen.getByText("Frozen evidence authority")).toBeVisible();
    expect(screen.getByText("Pods Team review")).toBeVisible();
    expect(screen.getByText("Testnet operational amendment")).toBeVisible();
    expect(screen.getByText("Creator review active")).toBeVisible();
    expect(screen.getByText(
      "The frozen contract fingerprint remains unchanged."
    )).toBeVisible();
  });
});
