import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FundingStatusRail } from "../src/components/funding-status-rail";
import type { ParticipantDepositIntent } from "../src/lib/funding-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

const baseIntent: ParticipantDepositIntent = {
  id: "intent-1",
  podId: "pod-1",
  state: "transaction_submitted",
  recipient: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
  amountLuna: 50_000,
  network: "testnet",
  reference: "pods-00112233445566778899aabb",
  transactionHash: "a".repeat(64),
  exceptionCode: null,
  expiresAt: "2027-03-08T00:00:00.000Z",
  observedAt: null,
  finalizedAt: null,
  creditedAt: null
};

describe("FundingStatusRail", () => {
  it.each([
    ["wallet_approval_pending", "Waiting on wallet confirmation"],
    ["transaction_submitted", "Transaction submitted"],
    ["observed", "Payment found on Testnet"],
    ["finalized", "Payment reached finality"],
    ["credited_provisional", "Commitment credited"],
    ["applied_to_roster", "Place secured"],
    ["refund_pending", "Refund queued"],
    ["refunded", "Refund confirmed"],
    ["exception_review", "Payment needs review"]
  ] as const)("renders %s as %s", (state, label) => {
    render(<FundingStatusRail intent={{ ...baseIntent, state }} />);

    expect(screen.getByRole(state === "exception_review" ? "alert" : "status"))
      .toHaveTextContent(label);
  });

  it("renders wallet rejection as recoverable without suggesting funds moved", () => {
    render(
      <FundingStatusRail
        intent={{ ...baseIntent, state: "wallet_rejected", transactionHash: null }}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Wallet confirmation was declined");
    expect(screen.getByRole("link", { name: "Try funding again" }))
      .toHaveAttribute("href", "/pods/pod-1/fund");
  });

  it.each([
    ["transaction_not_observed", "Transaction not found yet"],
    ["wrong_network", "Payment used the wrong network"],
    ["reference_mismatch", "Payment reference does not match"],
    ["reference_missing", "Payment reference is missing"],
    ["reference_duplicate", "Payment reference was already used"],
    ["reference_expired", "Payment arrived after the intent expired"],
    ["amount_mismatch", "Payment amount does not match"],
    ["recipient_mismatch", "Payment recipient does not match"],
    ["execution_failed", "Transaction execution failed"],
    ["finalized_after_cutoff", "Payment finalized after the cutoff"],
    ["capacity_excluded", "Pod capacity was already filled"]
  ] as const)("explains %s as %s", (exceptionCode, copy) => {
    render(
      <FundingStatusRail
        intent={{ ...baseIntent, state: "exception_review", exceptionCode }}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(copy);
  });

  it("keeps transaction detail available but collapsed until requested", async () => {
    const user = userEvent.setup();
    render(<FundingStatusRail intent={baseIntent} />);

    expect(screen.getByRole("img", { name: "NIM token" })).toBeVisible();
    const receipt = screen.getByText("Commitment details").closest("details");
    expect(receipt).not.toHaveAttribute("open");
    await user.click(screen.getByText("Commitment details"));
    expect(screen.getByText("Transaction hash")).toBeInTheDocument();
    expect(screen.getByText("a".repeat(64))).toBeInTheDocument();
    expect(screen.getAllByText("0.5 NIM").length).toBeGreaterThan(0);
    expect(screen.getByText("Nimiq Testnet")).toBeInTheDocument();
  });

  it("renders every funding checkpoint complete once the place is secured", () => {
    render(<FundingStatusRail intent={{ ...baseIntent, state: "applied_to_roster" }} />);

    const checkpoints = screen.getAllByRole("listitem");
    expect(checkpoints).toHaveLength(6);
    for (const checkpoint of checkpoints) {
      expect(checkpoint).toHaveClass("is-complete");
      expect(checkpoint).not.toHaveAttribute("aria-current");
    }
    expect(checkpoints.at(-1)).toHaveTextContent("✓");
    expect(screen.getByRole("link", { name: "Open Pod" }))
      .toHaveAttribute("href", "/pods/pod-1/room");
    expect(screen.getByRole("link", { name: "View My Pods" }))
      .toHaveAttribute("href", "/my-pods");
    expect(screen.queryByRole("link", { name: "Back to applications" }))
      .not.toBeInTheDocument();
  });

  it("presents all six checkpoints as compact semantic steps", () => {
    render(<FundingStatusRail intent={{ ...baseIntent, state: "observed" }} />);

    expect(screen.getByRole("list", { name: "Funding progress" })).toHaveAttribute(
      "data-compact-financial-rail"
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByRole("listitem", { name: /Observed/i })).toHaveAttribute(
      "aria-current",
      "step"
    );
  });

  it("keeps an exception at the latest chain milestone that actually happened", () => {
    render(
      <FundingStatusRail
        intent={{
          ...baseIntent,
          state: "exception_review",
          exceptionCode: "finalized_after_cutoff",
          observedAt: "2027-03-01T12:00:00.000Z",
          finalizedAt: "2027-03-01T12:05:00.000Z"
        }}
      />
    );

    expect(screen.getByRole("listitem", { name: /Submitted/i }))
      .toHaveAttribute("data-state", "complete");
    expect(screen.getByRole("listitem", { name: /Finalized/i }))
      .toHaveAttribute("data-state", "current");
    expect(screen.getByRole("listitem", { name: /Finalized/i }))
      .toHaveAttribute("aria-current", "step");
  });

  it("keeps an unobserved transaction exception at submitted", () => {
    render(
      <FundingStatusRail
        intent={{
          ...baseIntent,
          state: "exception_review",
          exceptionCode: "transaction_not_observed"
        }}
      />
    );

    expect(screen.getByRole("listitem", { name: /Submitted/i }))
      .toHaveAttribute("data-state", "current");
    expect(screen.getByRole("listitem", { name: /Observed/i }))
      .toHaveAttribute("data-state", "upcoming");
  });
});
