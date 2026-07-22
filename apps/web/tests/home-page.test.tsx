import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePage } from "../src/components/home-page";

describe("HomePage", () => {
  it("offers exactly the two approved entry actions", () => {
    render(<HomePage />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Connect wallet" })).toHaveAttribute(
      "href",
      "/connect?returnTo=%2Ftoday"
    );
    expect(screen.getByRole("link", { name: "Discover Pods" })).toHaveAttribute(
      "href",
      "/discover"
    );
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
    expect(screen.getByText("Pods reviewer only")).toBeVisible();
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
  });
});
