import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePage } from "../src/components/home-page";

describe("HomePage", () => {
  it("states the Phase 0 boundary without exposing unfinished product actions", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Momentum starts with a clear commitment." })).toBeVisible();
    expect(screen.getByText("Phase 0 foundation")).toBeVisible();
    expect(screen.queryByRole("button", { name: /fund|join|connect/i })).not.toBeInTheDocument();
  });
});
