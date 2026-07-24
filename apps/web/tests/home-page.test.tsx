import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
const wallet = vi.hoisted(() => ({ establishWalletSession: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation
}));

vi.mock("../src/lib/nimiq-wallet-client", () => ({
  establishWalletSession: wallet.establishWalletSession
}));

import { HomePage } from "../src/components/home-page";

describe("HomePage", () => {
  beforeEach(() => {
    navigation.replace.mockReset();
    navigation.refresh.mockReset();
    wallet.establishWalletSession.mockReset();
  });

  it("offers exactly the two approved entry actions", () => {
    const { container } = render(<HomePage />);

    const header = container.querySelector<HTMLElement>(".atlas-header");
    const hero = screen.getByRole("region", { name: "Make showing up feel real." });
    expect(header).not.toBeNull();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(within(header!).getByRole("link", { name: "Pods" })).toHaveAttribute(
      "href",
      "/discover"
    );
    expect(within(header!).getByRole("button", { name: "Wallet" })).toBeVisible();
    const actions = header!.querySelectorAll(".atlas-action");
    expect(actions).toHaveLength(2);
    expect(actions[0]).toHaveTextContent("Pods");
    expect(actions[1]).toHaveTextContent("Wallet");
    expect(within(hero).queryByRole("button")).not.toBeInTheDocument();
    expect(within(hero).queryByRole("link")).not.toBeInTheDocument();
  });

  it("connects the wallet from the landing header without a redundant route", async () => {
    wallet.establishWalletSession.mockResolvedValue({
      walletAddress: "NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6",
      needsProfile: false
    });
    render(<HomePage />);

    const connect = screen.getByRole("button", { name: "Wallet" });
    await waitFor(() => expect(connect).toBeEnabled());
    fireEvent.click(connect);

    await waitFor(() => expect(wallet.establishWalletSession).toHaveBeenCalledOnce());
    expect(navigation.replace).toHaveBeenCalledWith("/today");
    expect(navigation.refresh).toHaveBeenCalledOnce();
  });

  it("continues profile-less wallets into onboarding from the landing header", async () => {
    wallet.establishWalletSession.mockResolvedValue({
      walletAddress: "NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6",
      needsProfile: true
    });
    render(<HomePage />);

    const connect = screen.getByRole("button", { name: "Wallet" });
    await waitFor(() => expect(connect).toBeEnabled());
    fireEvent.click(connect);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/onboarding/profile?returnTo=%2Ftoday"
      )
    );
  });

  it("keeps wallet failures recoverable in place", async () => {
    wallet.establishWalletSession.mockRejectedValue(
      new Error("Open this page inside Nimiq Pay")
    );
    render(<HomePage />);

    const connect = screen.getByRole("button", { name: "Wallet" });
    await waitFor(() => expect(connect).toBeEnabled());
    fireEvent.click(connect);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Open this page inside Nimiq Pay"
    );
    expect(screen.getByRole("button", { name: "Wallet" })).toBeEnabled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("explains the complete Pods experience without unsupported claims", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Make showing up feel real." })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "The accountability loop." })).toBeVisible();
    expect(screen.getByRole("heading", { name: "One engine. Five rituals." })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Inside a Pod." })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "NIM makes commitment visible." })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Public when you want reach. Private when you want focus."
      })
    ).toBeVisible();
    expect(screen.queryByText(/guaranteed rewards/i)).not.toBeInTheDocument();
  });

  it("names every fixed activity and the real proof privacy choices", () => {
    render(<HomePage />);

    const ribbon = screen.getByLabelText("Five activity templates");
    for (const label of [
      "Build & Ship",
      "Fitness & Movement",
      "Reading",
      "Study & Focus",
      "Practice & Create"
    ]) {
      expect(within(ribbon).getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("Creator only")).toBeVisible();
    expect(screen.getByText("Share with Pod")).toBeVisible();
  });

  it("uses the participant-facing NIM funding sequence", () => {
    render(<HomePage />);

    for (const state of [
      "Wallet confirmation",
      "Transaction submitted",
      "Chain finalized",
      "Ledger credited",
      "Place secured"
    ]) {
      expect(screen.getByText(state)).toBeVisible();
    }
  });

  it("uses the Pods identity without an invented platform badge or symbol", () => {
    const { container } = render(<HomePage />);

    expect(screen.queryByText("Built for Nimiq Pay")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".atlas-identity-mark .pod-mark")).toHaveLength(2);
    expect(container.querySelector(".atlas-frame-build img")).toHaveAttribute(
      "src",
      expect.stringContaining("build-workspace.jpg")
    );
    const footerCard = container.querySelector<HTMLElement>(".atlas-footer-card");
    const footerWordmark = container.querySelector<HTMLElement>(".atlas-footer-wordmark");
    expect(footerCard).toBeInTheDocument();
    expect(footerWordmark).toHaveTextContent("pods");
    expect(footerCard).not.toContainElement(footerWordmark);
    expect(screen.getAllByText("Testnet beta")).toHaveLength(2);
  });
});
