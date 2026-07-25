import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FlowProgress } from "../src/components/activity-editor/flow-progress";

const foundationCss = () => readFileSync(
  resolve(process.cwd(), "src/components/activity-ritual/activity-ritual.module.css"),
  "utf8"
);

describe("FlowProgress", () => {
  it("renders a compact count, segmented rail, and current label inside navigation", () => {
    render(
      <FlowProgress
        ariaLabel="Proof progress"
        labels={["Result", "Evidence", "Review"]}
        step={1}
      />
    );

    const navigation = screen.getByRole("navigation", { name: "Proof progress" });
    expect(within(navigation).getByText("02 / 03"))
      .toHaveAttribute("aria-hidden", "true");
    expect(within(navigation).getByText("Evidence"))
      .toHaveAttribute("aria-hidden", "true");
    expect(within(navigation).getByText("Step 2 of 3, Evidence"))
      .not.toHaveAttribute("aria-hidden");

    const segments = navigation.querySelectorAll("[data-progress-segment]");
    expect(segments[0]?.parentElement).toHaveAttribute("aria-hidden", "true");
    expect(segments).toHaveLength(3);
    expect(segments[0]).toHaveAttribute("data-state", "complete");
    expect(segments[1]).toHaveAttribute("data-state", "current");
    expect(segments[2]).toHaveAttribute("data-state", "upcoming");
  });

  it("keeps all progress styling inside the activity ritual module", () => {
    const css = foundationCss();

    expect(css).toMatch(/\.flowProgress\s*\{/);
    expect(css).toMatch(
      /\.visuallyHidden\s*\{[\s\S]*position:\s*absolute[\s\S]*width:\s*1px[\s\S]*overflow:\s*hidden/
    );
    expect(css).toMatch(/\.progressRail\s*\{[\s\S]*display:\s*flex/);
    expect(css).toMatch(/\.progressSegment\s*\{[\s\S]*height:\s*4px/);
    expect(css).toMatch(
      /\.progressSegment\[data-state="current"\]\s*\{[\s\S]*var\(--theme-accent/
    );
  });
});
