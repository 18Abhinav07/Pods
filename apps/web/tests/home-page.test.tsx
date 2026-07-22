import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePage } from "../src/components/home-page";

describe("HomePage", () => {
  it("presents one clear entry path without technical lifecycle clutter", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Show up for what matters." })).toBeVisible();
    expect(screen.queryByText("Core lifecycle active")).not.toBeInTheDocument();
    expect(screen.queryByText("Five polished modes")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Connect wallet" })).toHaveAttribute(
      "href",
      "/connect?returnTo=%2Ftoday"
    );
    expect(screen.getByRole("link", { name: "Explore public Pods" })).toHaveClass(
      "secondary-action"
    );
  });
});
