import { render, screen } from "@testing-library/react";
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
    expect(screen.queryByText(/wallet/i)).not.toBeInTheDocument();
  });

  it("shows creator conservation without participant transfer identities", () => {
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
      />
    );

    expect(screen.getByText("Treasury conserved")).toBeVisible();
    expect(screen.getByText("2 participant entitlements")).toBeVisible();
    expect(screen.queryByText(/recipient/i)).not.toBeInTheDocument();
  });
});
