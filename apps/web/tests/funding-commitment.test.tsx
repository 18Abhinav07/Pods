import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FundingCommitment } from "../src/components/funding-commitment";
import {
  createDepositIntent,
  recordDepositTransactionHint,
  recordDepositWalletAttempt
} from "../src/lib/funding-client";
import { sendNimCommitment } from "../src/lib/nimiq-wallet-client";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh })
}));

vi.mock("../src/lib/funding-client", () => ({
  createDepositIntent: vi.fn(),
  recordDepositTransactionHint: vi.fn(),
  recordDepositWalletAttempt: vi.fn()
}));

vi.mock("../src/lib/nimiq-wallet-client", () => ({
  sendNimCommitment: vi.fn()
}));

const props = {
  podId: "pod-1",
  activityName: "Ship Pods in public",
  templateName: "Build & Ship",
  occurrenceCount: 5,
  lunaPerOccurrence: 10_000,
  totalLuna: 50_000
};

describe("FundingCommitment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the complete frozen financial contract before enabling the wallet", async () => {
    const user = userEvent.setup();
    render(<FundingCommitment {...props} />);

    expect(screen.getByText("5 scheduled occurrences")).toBeInTheDocument();
    expect(screen.getByText("0.1 NIM per occurrence")).toBeInTheDocument();
    expect(screen.getAllByText("0.5 NIM", { selector: "strong" })).toHaveLength(2);
    expect(screen.getByText("Maximum amount at risk")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Verification is performed by the Pods team. Pod creators and participants do not vote on evidence or financial outcomes."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "If Pods does not review within 24 hours, your occurrence deposit is protected but is not eligible for a bonus."
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/shared Pods-controlled treasury/i)).toBeInTheDocument();

    for (const outcome of ["Approved", "Timeout-protected", "Grace", "Rejected", "Missed"]) {
      expect(screen.getByRole("row", { name: new RegExp(outcome, "i") })).toBeInTheDocument();
    }

    const button = screen.getByRole("button", { name: "Commit 0.5 NIM" });
    expect(button).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /I accept the frozen terms/i }));
    expect(button).toBeEnabled();
  });

  it("records only wallet progress and the returned hash before routing to status", async () => {
    const user = userEvent.setup();
    vi.mocked(createDepositIntent).mockResolvedValue({
      id: "intent-1",
      podId: "pod-1",
      state: "intent_created",
      recipient: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
      amountLuna: 50_000,
      network: "testnet",
      reference: "pods-00112233445566778899aabb",
      transactionHash: null,
      exceptionCode: null,
      observedAt: null,
      finalizedAt: null,
      creditedAt: null,
      expiresAt: "2027-03-08T00:00:00.000Z"
    });
    vi.mocked(sendNimCommitment).mockResolvedValue("a".repeat(64));
    vi.mocked(recordDepositWalletAttempt).mockResolvedValue(undefined as never);
    vi.mocked(recordDepositTransactionHint).mockResolvedValue(undefined as never);
    render(<FundingCommitment {...props} />);

    await user.click(screen.getByRole("checkbox", { name: /I accept the frozen terms/i }));
    await user.click(screen.getByRole("button", { name: "Commit 0.5 NIM" }));

    expect(createDepositIntent).toHaveBeenCalledWith("pod-1");
    expect(recordDepositWalletAttempt).toHaveBeenCalledWith("intent-1", "open");
    expect(sendNimCommitment).toHaveBeenCalledWith({
      recipient: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
      valueLuna: 50_000,
      reference: "pods-00112233445566778899aabb"
    });
    expect(recordDepositTransactionHint).toHaveBeenCalledWith("intent-1", "a".repeat(64));
    expect(push).toHaveBeenCalledWith("/pods/pod-1/fund/status?intent=intent-1");
    expect(refresh).toHaveBeenCalled();
  });

  it("records wallet rejection without claiming a transaction", async () => {
    const user = userEvent.setup();
    vi.mocked(createDepositIntent).mockResolvedValue({
      id: "intent-1",
      podId: "pod-1",
      state: "intent_created",
      recipient: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
      amountLuna: 50_000,
      network: "testnet",
      reference: "pods-00112233445566778899aabb",
      transactionHash: null,
      exceptionCode: null,
      observedAt: null,
      finalizedAt: null,
      creditedAt: null,
      expiresAt: "2027-03-08T00:00:00.000Z"
    });
    vi.mocked(sendNimCommitment).mockRejectedValue(new Error("Wallet closed"));
    vi.mocked(recordDepositWalletAttempt).mockResolvedValue(undefined as never);
    render(<FundingCommitment {...props} />);

    await user.click(screen.getByRole("checkbox", { name: /I accept the frozen terms/i }));
    await user.click(screen.getByRole("button", { name: "Commit 0.5 NIM" }));

    expect(recordDepositWalletAttempt).toHaveBeenNthCalledWith(1, "intent-1", "open");
    expect(recordDepositWalletAttempt).toHaveBeenNthCalledWith(2, "intent-1", "rejected");
    expect(recordDepositTransactionHint).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Wallet closed");
  });

  it("resumes an existing intent through status without requesting a second payment", async () => {
    const user = userEvent.setup();
    vi.mocked(createDepositIntent).mockResolvedValue({
      id: "intent-1",
      podId: "pod-1",
      state: "transaction_submitted",
      recipient: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
      amountLuna: 50_000,
      network: "testnet",
      reference: "pods-00112233445566778899aabb",
      transactionHash: "a".repeat(64),
      exceptionCode: null,
      observedAt: null,
      finalizedAt: null,
      creditedAt: null,
      expiresAt: "2027-03-08T00:00:00.000Z"
    });
    render(<FundingCommitment {...props} />);

    await user.click(screen.getByRole("checkbox", { name: /I accept the frozen terms/i }));
    await user.click(screen.getByRole("button", { name: "Commit 0.5 NIM" }));

    expect(sendNimCommitment).not.toHaveBeenCalled();
    expect(recordDepositWalletAttempt).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/pods/pod-1/fund/status?intent=intent-1");
  });
});
