import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireOpsSession = vi.hoisted(() => vi.fn());
const listPayoutTransferOperations = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/ops-session", () => ({ requireOpsSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { listPayoutTransferOperations }
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

import TransferOperationsPage from "../src/app/ops/transfers/page";

describe("payout transfer operations page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOpsSession.mockResolvedValue({ reviewerId: "pods-finance" });
    listPayoutTransferOperations.mockResolvedValue([{
      id: "430296c7-9554-43e6-9b43-bfd063391028",
      podId: "11111111-1111-4111-8111-111111111111",
      amountLuna: 20_000,
      network: "testnet",
      state: "late",
      errorCode: "validity_window_expired",
      updatedAt: new Date("2027-05-04T00:02:00.000Z"),
      attempt: {
        id: "530296c7-9554-43e6-9b43-bfd063391029",
        sequence: 1,
        state: "late",
        transactionHash: "a".repeat(64),
        validityStartHeight: 1_000,
        lastCheckedAt: new Date("2027-05-04T00:02:00.000Z")
      }
    }]);
  });

  it("shows the five recovery filters and safe retry control", async () => {
    render(await TransferOperationsPage({
      searchParams: Promise.resolve({ state: "late" })
    }));

    expect(screen.getByRole("heading", { name: "1 transfer needs attention." })).toBeVisible();
    for (const label of [
      "Unknown",
      "Retryable failed",
      "Mismatched",
      "Late",
      "Manual review"
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeVisible();
    }
    expect(screen.getByRole("button", { name: "Recheck and retry" })).toBeVisible();
    expect(screen.queryByText(/NQ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/raw/i)).not.toBeInTheDocument();
  });
});
