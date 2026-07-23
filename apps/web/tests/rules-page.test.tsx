import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pod = {
  id: "pod-1",
  state: "locked_scheduled",
  contractHash: "a".repeat(64),
  contractData: {
    templateId: "build",
    activity: {
      name: "Ship together",
      purpose: "Complete one visible build commitment each occurrence.",
      startDate: "2027-03-08",
      endDate: "2027-03-12",
      timeZone: "UTC"
    },
    community: { visibility: "public", minParticipants: 2, maxParticipants: 4 },
    commitment: { occurrenceCount: 3, totalLuna: 30_000, lunaPerOccurrence: 10_000 }
  }
};

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "participant-1" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getPodForOwner: vi.fn(async () => null),
    getPodForAcceptedMember: vi.fn(async () => null),
    getWaitingRoomForUser: vi.fn(async () => ({ pod })),
    getMembershipForUser: vi.fn(async () => ({
      state: "active",
      depositIntentId: "intent-1"
    }))
  }
}));

import RulesPage from "../src/app/pods/[podId]/rules/page";

describe("RulesPage", () => {
  it("keeps the frozen contract available to an active participant", async () => {
    render(await RulesPage({ params: Promise.resolve({ podId: "pod-1" }) }));

    expect(screen.getByRole("link", { name: "Open Pod" }))
      .toHaveAttribute("href", "/pods/pod-1/room");
    expect(screen.getByText("Creator review")).toBeVisible();
    expect(screen.getByText(
      "The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds."
    )).toBeVisible();
    expect(screen.queryByText("Review funding handoff")).not.toBeInTheDocument();
  });
});
