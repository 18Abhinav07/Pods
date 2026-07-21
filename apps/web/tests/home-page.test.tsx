import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePage } from "../src/components/home-page";

describe("HomePage", () => {
  it("presents both product entry actions with the current Testnet status", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Momentum starts with a clear commitment." })).toBeVisible();
    expect(screen.getAllByText("Nimiq Testnet").length).toBeGreaterThan(0);
    expect(screen.getByText("Core lifecycle active")).toBeVisible();
    expect(screen.getByRole("link", { name: "Connect wallet" })).toHaveAttribute(
      "href",
      "/connect?returnTo=%2Ftoday"
    );
    expect(screen.getByRole("link", { name: "Create a Pod" })).toHaveClass(
      "secondary-action"
    );
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });
});
