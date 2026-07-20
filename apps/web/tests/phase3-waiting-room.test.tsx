import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  CreatorFundingOverview,
  type CreatorFundingOverviewProps
} from "../src/components/creator-funding-overview";
import { PodWaitingRoom, type PodWaitingRoomProps } from "../src/components/pod-waiting-room";
import { RefundStatusRail } from "../src/components/refund-status-rail";
import { presentPodRelationship } from "../src/lib/participant-pod-state";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

const waitingRoom: PodWaitingRoomProps = {
  podId: "pod-1",
  name: "Ship Pods in Public",
  purpose: "Build one concrete product milestone together.",
  viewerRole: "participant",
  membershipState: "funded_provisional",
  fundingStatusHref: "/pods/pod-1/fund/status?intent=intent-1",
  confirmedParticipants: 1,
  minParticipants: 2,
  maxParticipants: 4,
  cutoffAt: "2027-03-08T00:00:00.000Z",
  firstOccurrenceAt: "2027-03-08T00:00:00.000Z",
  firstOccurrenceDate: "2027-03-08",
  occurrenceCount: 5,
  weekdays: [1, 2, 3, 4, 5],
  timeZone: "UTC",
  nimPerOccurrence: 0.1,
  totalNim: 0.5,
  refund: null
};

describe("Phase 3B waiting room", () => {
  it("shows the participant's real funding stage, capacity, cutoff, and frozen schedule", () => {
    render(<PodWaitingRoom {...waitingRoom} />);

    expect(screen.getByRole("heading", { name: "Ship Pods in Public" })).toBeInTheDocument();
    expect(screen.getByText("Commitment credited")).toBeInTheDocument();
    expect(screen.getByText("1 confirmed")).toBeInTheDocument();
    expect(screen.getByText("3 places remaining")).toBeInTheDocument();
    expect(screen.getByText("5 frozen occurrences")).toBeInTheDocument();
    expect(screen.getByText(/Pods team reviews evidence/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open funding tracker" }))
      .toHaveAttribute("href", waitingRoom.fundingStatusHref);
  });

  it("renders a participant-safe refund rail with a persisted transaction receipt", () => {
    render(
      <RefundStatusRail
        refund={{
          state: "broadcast",
          amountNim: 8,
          transactionHash: "a".repeat(64),
          confirmedAt: null
        }}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Refund submitted");
    expect(screen.getByText("8 NIM")).toBeInTheDocument();
    expect(screen.getByText("a".repeat(64))).toBeInTheDocument();
    expect(screen.queryByText(/raw transaction/i)).not.toBeInTheDocument();
  });

  it("routes every post-credit participant stage to the same canonical Pod room", () => {
    for (const state of [
      "funded_provisional",
      "roster_locked",
      "excluded_at_cutoff",
      "refund_pending",
      "refunded"
    ] as const) {
      expect(
        presentPodRelationship({
          podId: "pod-1",
          relationship: { kind: "member", state, depositIntentId: "intent-1" }
        }).href
      ).toBe("/pods/pod-1/today");
    }
  });
});

describe("Phase 3B creator funding overview", () => {
  it("renders participant labels and safe lifecycle statuses only", () => {
    const props: CreatorFundingOverviewProps = {
      podId: "pod-1",
      name: "Ship Pods in Public",
      podState: "enrollment_open",
      cutoffAt: "2027-03-08T00:00:00.000Z",
      minParticipants: 2,
      maxParticipants: 4,
      confirmedParticipants: 1,
      participants: [
        {
          id: "membership-1",
          label: "Participant 01",
          admissionLabel: "Public application",
          statusLabel: "Commitment credited",
          statusDetail: "Waiting for roster lock"
        },
        {
          id: "membership-2",
          label: "Participant 02",
          admissionLabel: "Private invitation",
          statusLabel: "Funding required",
          statusDetail: "No funds credited"
        }
      ]
    };

    render(<CreatorFundingOverview {...props} />);

    expect(screen.getByText("Participant 01")).toBeInTheDocument();
    expect(screen.getByText("Commitment credited")).toBeInTheDocument();
    expect(screen.getByText("Funding required")).toBeInTheDocument();
    expect(screen.getByText("1 of 4 confirmed")).toBeInTheDocument();
    expect(screen.queryByText(/wallet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reference/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/treasury/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/participant_liability/i)).not.toBeInTheDocument();
  });
});
