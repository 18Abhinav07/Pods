import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettlementSummary } from "../src/components/settlement-summary";

describe("SettlementSummary", () => {
  it("shows only the participant's own entitlement and occurrence outcomes", () => {
    render(
      <SettlementSummary
        mode="participant"
        settlement={{
          state: "executing",
          totalDepositLuna: 20_000,
          totalPayoutLuna: 20_000
        }}
        entitlement={{
          state: "transfer_queued",
          depositLuna: 10_000,
          principalLuna: 10_000,
          provisionalForfeitureLuna: 0,
          restorationLuna: 0,
          bonusLuna: 10_000,
          payoutLuna: 20_000
        }}
        outcomes={[
          {
            ordinal: 1,
            state: "approved",
            principalLuna: 10_000,
            provisionalForfeitureLuna: 0,
            restorationLuna: 0,
            bonusLuna: 10_000,
            payoutLuna: 20_000
          }
        ]}
        transfer={{
          state: "broadcast",
          amountLuna: 20_000,
          transactionHash: "abc123"
        }}
      />
    );

    expect(screen.getByText("0.2 NIM", { selector: "strong" })).toBeVisible();
    expect(screen.getByText("0.1 NIM bonus")).toBeVisible();
    expect(screen.getByText("Occurrence 1")).toBeVisible();
    expect(screen.getByText("Approved")).toBeVisible();
    expect(screen.getByText("Confirming on chain")).toBeVisible();
    expect(screen.getByText("abc123")).toBeVisible();
    expect(screen.getByRole("list", { name: "Payout progress" })).toBeVisible();
    expect(screen.getByText("How settlement works")).toBeVisible();
    expect(screen.queryByText(/wallet/i)).not.toBeInTheDocument();
  });

  it("shows creator conservation with a participant-safe entitlement snapshot", () => {
    render(
      <SettlementSummary
        mode="creator"
        settlement={{
          state: "settled",
          totalDepositLuna: 20_000,
          totalPayoutLuna: 20_000
        }}
        occurrenceCount={1}
        entitlementCount={2}
        entitlements={[
          {
            displayName: "Approved builder",
            handle: "approved_builder",
            state: "transfer_queued",
            principalLuna: 10_000,
            restorationLuna: 0,
            bonusLuna: 10_000,
            payoutLuna: 20_000,
            transferState: "queued"
          },
          {
            displayName: "Rejected builder",
            handle: "rejected_builder",
            state: "no_transfer_required",
            principalLuna: 0,
            restorationLuna: 0,
            bonusLuna: 0,
            payoutLuna: 0,
            transferState: null
          }
        ]}
      />
    );

    expect(screen.getByText("Treasury conserved")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("Participant entitlements")).toBeVisible();
    const approved = screen.getByText("Approved builder").closest("li");
    expect(approved).not.toBeNull();
    expect(within(approved!).getByText("0.2 NIM")).toBeVisible();
    expect(screen.getByText("@approved_builder")).toBeVisible();
    expect(screen.getByText("Transfer queued")).toBeVisible();
    expect(screen.getByText("No transfer required")).toBeVisible();
    expect(screen.queryByText(/recipient/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/wallet/i)).not.toBeInTheDocument();
  });

  it.each([
    ["queued", "Payout queued"],
    ["prepared", "Payout prepared"],
    ["broadcast", "Payout submitted"],
    ["confirmed", "Payout paid"],
    ["unknown", "Payout confirmation delayed"],
    ["retryable_failed", "Payout retry paused"],
    ["mismatched", "Payout details need review"],
    ["late", "Late payout under review"],
    ["manual_review", "Payout under manual review"]
  ] as const)("gives %s a distinct participant composition", (state, title) => {
    render(
      <SettlementSummary
        mode="participant"
        settlement={{
          state: state === "confirmed" ? "settled" : state === "manual_review" ? "manual_review" : "executing",
          totalDepositLuna: 10_000,
          totalPayoutLuna: 10_000
        }}
        entitlement={{
          state: state === "confirmed" ? "transfer_confirmed" : state === "manual_review" ? "manual_review" : "transfer_queued",
          depositLuna: 10_000,
          principalLuna: 10_000,
          provisionalForfeitureLuna: 0,
          restorationLuna: 0,
          bonusLuna: 0,
          payoutLuna: 10_000
        }}
        outcomes={[]}
        transfer={{
          state,
          amountLuna: 10_000,
          transactionHash: state === "broadcast" || state === "confirmed" ? "hash-1" : null
        }}
      />
    );

    expect(screen.getByRole("heading", { name: title })).toBeVisible();
  });

  it("explains a zero-recipient restoration without treating it as bonus", () => {
    render(
      <SettlementSummary
        mode="participant"
        settlement={{
          state: "settled",
          totalDepositLuna: 10_000,
          totalPayoutLuna: 10_000
        }}
        entitlement={{
          state: "transfer_confirmed",
          depositLuna: 10_000,
          principalLuna: 0,
          provisionalForfeitureLuna: 10_000,
          restorationLuna: 10_000,
          bonusLuna: 0,
          payoutLuna: 10_000
        }}
        outcomes={[{
          ordinal: 1,
          state: "missed",
          principalLuna: 0,
          provisionalForfeitureLuna: 10_000,
          restorationLuna: 10_000,
          bonusLuna: 0,
          payoutLuna: 10_000
        }]}
        transfer={{
          state: "confirmed",
          amountLuna: 10_000,
          transactionHash: "restored-hash"
        }}
      />
    );

    expect(screen.getByText("Unused forfeiture restored")).toBeVisible();
    expect(screen.getByText("0.1 NIM restored")).toBeVisible();
    expect(screen.getByText("0 NIM bonus")).toBeVisible();
  });

  it("closes a zero entitlement without inventing a transfer", () => {
    render(
      <SettlementSummary
        mode="participant"
        settlement={{
          state: "settled",
          totalDepositLuna: 10_000,
          totalPayoutLuna: 10_000
        }}
        entitlement={{
          state: "no_transfer_required",
          depositLuna: 10_000,
          principalLuna: 0,
          provisionalForfeitureLuna: 10_000,
          restorationLuna: 0,
          bonusLuna: 0,
          payoutLuna: 0
        }}
        outcomes={[]}
        transfer={null}
      />
    );

    expect(
      screen.getByRole("heading", { name: "No payout transfer required" })
    ).toBeVisible();
    expect(screen.getByText("0 NIM", { selector: "strong" })).toBeVisible();
    expect(screen.getByText("Closed")).toBeVisible();
    expect(screen.queryByText("Submitted")).not.toBeInTheDocument();
    expect(screen.queryByText(/transaction hash/i)).not.toBeInTheDocument();
  });

  it.each([
    ["retryable_failed", "Retry required"],
    ["mismatched", "Transfer mismatch"],
    ["late", "Late confirmation"],
    ["manual_review", "Manual review"]
  ] as const)("names the %s transfer exception explicitly", (state, label) => {
    render(
      <SettlementSummary
        mode="participant"
        settlement={{
          state: "manual_review",
          totalDepositLuna: 10_000,
          totalPayoutLuna: 10_000
        }}
        entitlement={{
          state: "manual_review",
          depositLuna: 10_000,
          principalLuna: 10_000,
          provisionalForfeitureLuna: 0,
          restorationLuna: 0,
          bonusLuna: 0,
          payoutLuna: 10_000
        }}
        outcomes={[{
          ordinal: 1,
          state: "approved",
          principalLuna: 10_000,
          provisionalForfeitureLuna: 0,
          restorationLuna: 0,
          bonusLuna: 0,
          payoutLuna: 10_000
        }]}
        transfer={{
          state,
          amountLuna: 10_000,
          transactionHash: null
        }}
      />
    );

    expect(screen.getByText(label)).toBeVisible();
  });

  it("does not call a positive queued entitlement no-transfer when its leg is temporarily absent", () => {
    render(
      <SettlementSummary
        mode="participant"
        settlement={{
          state: "executing",
          totalDepositLuna: 10_000,
          totalPayoutLuna: 10_000
        }}
        entitlement={{
          state: "transfer_queued",
          depositLuna: 10_000,
          principalLuna: 10_000,
          provisionalForfeitureLuna: 0,
          restorationLuna: 0,
          bonusLuna: 0,
          payoutLuna: 10_000
        }}
        outcomes={[{
          ordinal: 1,
          state: "approved",
          principalLuna: 10_000,
          provisionalForfeitureLuna: 0,
          restorationLuna: 0,
          bonusLuna: 0,
          payoutLuna: 10_000
        }]}
        transfer={null}
      />
    );

    expect(screen.getByText("Transfer queued")).toBeVisible();
    expect(screen.queryByText("No transfer required")).not.toBeInTheDocument();
  });

  it.each([
    ["retryable_failed", "Retry required"],
    ["mismatched", "Transfer mismatch"],
    ["late", "Late confirmation"],
    ["manual_review", "Manual review"]
  ] as const)(
    "shows the %s payout leg explicitly in the creator entitlement list",
    (transferState, label) => {
      render(
        <SettlementSummary
          mode="creator"
          settlement={{
            state: "manual_review",
            totalDepositLuna: 10_000,
            totalPayoutLuna: 10_000
          }}
          occurrenceCount={1}
          entitlementCount={1}
          entitlements={[{
            displayName: "Builder",
            handle: "builder",
            state: "transfer_queued",
            principalLuna: 10_000,
            restorationLuna: 0,
            bonusLuna: 0,
            payoutLuna: 10_000,
            transferState
          }]}
        />
      );

      expect(screen.getByText(label)).toBeVisible();
    }
  );
});
