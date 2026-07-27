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
  contractHash: "contract-hash-1",
  activityName: "Ship Pods in public",
  templateName: "Build & Ship",
  occurrenceCount: 5,
  lunaPerOccurrence: 10_000,
  totalLuna: 50_000,
  settlementMode: "full_refund_alpha" as const
};

async function reachWalletStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Review protection" }));
  await user.click(screen.getByRole("button", { name: "Continue to wallet" }));
}

describe("FundingCommitment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reveals the frozen financial contract progressively before enabling the wallet", async () => {
    const user = userEvent.setup();
    render(<FundingCommitment {...props} />);

    expect(screen.getByText("Step 1 of 3")).toBeVisible();
    expect(screen.getByRole("img", { name: "NIM token" })).toBeVisible();
    expect(screen.getByText("5 × 0.1 NIM")).toBeVisible();
    expect(screen.getByText("0.5 NIM upfront")).toBeVisible();
    expect(screen.getByText("Maximum temporary custody")).toBeVisible();
    expect(screen.queryByText("How the financial contract works")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Review protection" }));

    expect(screen.getByText("Step 2 of 3")).toBeVisible();
    expect(screen.getByText("How the financial contract works")).toBeVisible();
    expect(screen.getByText("5 scheduled occurrences")).toBeInTheDocument();
    expect(screen.getByText("0.1 NIM per occurrence")).toBeInTheDocument();
    await user.click(screen.getByText("How the financial contract works"));
    expect(
      screen.getByText(
        "The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your complete Testnet commitment returns after roster lock. Review decisions affect progress only."
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/idempotent worker after roster lock/i)).toBeInTheDocument();
    expect(screen.queryByText(/server caps/i)).not.toBeInTheDocument();
    expect(screen.getByText("Full return queued")).toBeInTheDocument();
    expect(screen.getByText("Disabled in this contract")).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Rejected/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue to wallet" }));

    expect(screen.getByText("Step 3 of 3")).toBeVisible();
    expect(screen.getByText("0.5 NIM", { selector: "strong" })).toBeVisible();
    const button = screen.getByRole("button", { name: "Commit 0.5 NIM" });
    expect(button).toBeDisabled();
    expect(button.closest("[data-financial-action-dock]")).not.toBeNull();
    await user.click(screen.getByRole("checkbox", { name: /I accept the immutable full-return/i }));
    expect(button).toBeEnabled();
  });

  it("keeps alpha return and proportional redistribution as separate contracts", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FundingCommitment {...props} />);

    await user.click(screen.getByRole("button", { name: "Review protection" }));
    const details = screen.getByText("How the financial contract works")
      .closest("details") as HTMLDetailsElement;
    if (!details.open) await user.click(screen.getByText("How the financial contract works"));
    expect(screen.getByText("Full return, independent of outcome")).toBeVisible();
    expect(screen.queryByText("What each decision means")).not.toBeInTheDocument();

    rerender(<FundingCommitment {...props} settlementMode="proportional" />);

    if (!details.open) await user.click(screen.getByText("How the financial contract works"));
    expect(screen.getByText("What each decision means")).toBeVisible();
    expect(screen.queryByText("Full return, independent of outcome")).not.toBeInTheDocument();
  });

  it("discloses the public visitor room before wallet confirmation", async () => {
    const user = userEvent.setup();
    render(<FundingCommitment {...props} publicVisitorRoom />);

    await user.click(screen.getByRole("button", { name: "Review protection" }));
    await user.click(screen.getByText("How the financial contract works"));
    expect(screen.getByText("Public visitor room")).toBeVisible();
    expect(
      screen.getByText(
        "After roster lock, visitors can read the public room and explicitly public proof records. They cannot message, react, join activity, see creator-only evidence, or see financial details."
      )
    ).toBeVisible();
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

    await reachWalletStep(user);
    await user.click(screen.getByRole("checkbox", { name: /I accept the immutable full-return/i }));
    await user.click(screen.getByRole("button", { name: "Commit 0.5 NIM" }));

    expect(createDepositIntent).toHaveBeenCalledWith("pod-1", {
      contractHash: "contract-hash-1",
      settlementDisclosureAccepted: true
    });
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

    await reachWalletStep(user);
    await user.click(screen.getByRole("checkbox", { name: /I accept the immutable full-return/i }));
    await user.click(screen.getByRole("button", { name: "Commit 0.5 NIM" }));

    expect(recordDepositWalletAttempt).toHaveBeenNthCalledWith(1, "intent-1", "open");
    expect(recordDepositWalletAttempt).toHaveBeenNthCalledWith(2, "intent-1", "rejected");
    expect(recordDepositTransactionHint).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Wallet closed");
  });

  it("does not blame the wallet when funding fails before handoff", async () => {
    const user = userEvent.setup();
    vi.mocked(createDepositIntent).mockRejectedValue(
      new Error("Phase 3 funding is Testnet only")
    );
    render(<FundingCommitment {...props} />);

    await reachWalletStep(user);
    await user.click(screen.getByRole("checkbox", { name: /I accept the immutable full-return/i }));
    await user.click(screen.getByRole("button", { name: "Commit 0.5 NIM" }));

    expect(sendNimCommitment).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Funding unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your wallet was not opened or charged."
    );
    expect(screen.queryByText("Wallet handoff paused")).not.toBeInTheDocument();
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

    await reachWalletStep(user);
    await user.click(screen.getByRole("checkbox", { name: /I accept the immutable full-return/i }));
    await user.click(screen.getByRole("button", { name: "Commit 0.5 NIM" }));

    expect(sendNimCommitment).not.toHaveBeenCalled();
    expect(recordDepositWalletAttempt).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/pods/pod-1/fund/status?intent=intent-1");
  });
});
