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
  settlementMode: "full_refund_alpha",
  refund: null
};

describe("Phase 3B waiting room", () => {
  it("shows the participant's Pod stage, capacity, cutoff, and frozen schedule without reopening funding", () => {
    render(<PodWaitingRoom {...waitingRoom} />);

    expect(screen.getByRole("heading", { name: "Ship Pods in Public" })).toBeInTheDocument();
    expect(screen.getByText("Commitment credited")).toBeInTheDocument();
    expect(screen.getByText("1 confirmed")).toBeInTheDocument();
    expect(screen.getByText("3 places remaining")).toBeInTheDocument();
    expect(screen.getByRole("timer", { name: "Time until roster lock" })).toBeVisible();
    expect(screen.getByText("5 frozen occurrences")).toBeInTheDocument();
    expect(screen.getAllByText("Mar 8, 2027 · 12:00 AM")).toHaveLength(2);
    expect(screen.getByText(
      "The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds."
    )).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /funding tracker/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Review frozen rules" }))
      .toHaveAttribute("href", "/pods/pod-1/rules");
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
    expect(screen.getAllByText("8 NIM").length).toBeGreaterThan(0);
    expect(screen.getByText("a".repeat(64))).toBeInTheDocument();
    expect(screen.queryByText(/raw transaction/i)).not.toBeInTheDocument();
  });

  it("renders the confirmed refund checkpoint as complete", () => {
    render(
      <RefundStatusRail
        refund={{
          state: "confirmed",
          amountNim: 8,
          transactionHash: "b".repeat(64),
          confirmedAt: "2027-03-08T01:00:00.000Z"
        }}
      />
    );

    const checkpoints = screen.getAllByRole("listitem");
    expect(checkpoints).toHaveLength(5);
    expect(checkpoints[3]).toHaveTextContent("Confirming");
    for (const checkpoint of checkpoints) expect(checkpoint).toHaveClass("is-complete");
    expect(checkpoints.at(-1)).toHaveTextContent("✓");
  });

  it("maps a broadcast refund to submitted complete and confirming current", () => {
    render(
      <RefundStatusRail
        refund={{
          state: "broadcast",
          amountNim: 8,
          transactionHash: "a".repeat(64),
          confirmedAt: null,
          reason: "The minimum roster was not reached."
        }}
      />
    );

    const checkpoints = screen.getAllByRole("listitem");
    expect(checkpoints).toHaveLength(5);
    expect(checkpoints[2]).toHaveClass("is-complete");
    expect(checkpoints[3]).toHaveClass("is-current");
    expect(checkpoints[3]).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("The minimum roster was not reached.")).toBeVisible();
  });

  it("shows one refund action and never renders an incomplete funding rail", () => {
    render(
      <PodWaitingRoom
        {...waitingRoom}
        membershipState="refund_pending"
        refund={{
          state: "queued",
          amountNim: 0.5,
          transactionHash: null,
          confirmedAt: null
        }}
      />
    );

    expect(screen.getByRole("list", { name: "Refund progress" })).toBeVisible();
    expect(screen.queryByRole("list", { name: "Funding progress" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "View My Pods" })).toHaveAttribute(
      "href",
      "/my-pods"
    );
  });

  it("keeps provisional and refund stages in the waiting room", () => {
    for (const state of [
      "funded_provisional",
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

  it("routes roster-locked and active participants to the conversation-first room", () => {
    for (const state of ["roster_locked", "active"] as const) {
      expect(
        presentPodRelationship({
          podId: "pod-1",
          relationship: { kind: "member", state, depositIntentId: "intent-1" }
        }).href
      ).toBe("/pods/pod-1/room");
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
