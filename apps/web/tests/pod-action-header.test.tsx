import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PodActionHeader } from "../src/components/activity-ritual/pod-action-header";

const foundationCss = () => readFileSync(
  resolve(process.cwd(), "src/components/activity-ritual/activity-ritual.module.css"),
  "utf8"
);

const headerSource = () => readFileSync(
  resolve(process.cwd(), "src/components/activity-ritual/pod-action-header.tsx"),
  "utf8"
);

describe("PodActionHeader", () => {
  it("keeps Phosphor rendering behind an explicit client boundary", () => {
    expect(headerSource().trimStart()).toMatch(/^"use client";/);
  });

  it("keeps Today, occurrence context, and the live Pod room in one compact header", () => {
    const { container } = render(
      <PodActionHeader
        occurrenceNumber={4}
        podId="pod-4"
        podName="Morning Runners"
        templateLabel="Fitness"
      />
    );

    expect(screen.getByRole("link", { name: "Back to Today" }))
      .toHaveAttribute("href", "/today");
    const heading = screen.getByRole("heading", { name: "Morning Runners" });
    expect(heading).toBeVisible();
    expect(heading.nextElementSibling).toHaveTextContent("Fitness · Occurrence 04");
    expect(screen.getByRole("link", { name: "Open Morning Runners room" }))
      .toHaveAttribute("href", "/pods/pod-4/room");
    expect(screen.queryByText("Pod room")).not.toBeInTheDocument();
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("owns the mobile dimensions, centered title, and live room treatment", () => {
    const css = foundationCss();

    expect(css).toMatch(/\.actionHeader\s*\{[\s\S]*height:\s*76px/);
    expect(css).toMatch(/\.iconAction\s*\{[\s\S]*width:\s*44px[\s\S]*height:\s*44px/);
    expect(css).toMatch(/\.titleGroup\s*\{[\s\S]*left:\s*50%[\s\S]*translateX\(-50%\)/);
    expect(css).toMatch(/\.roomAction\s*\{[\s\S]*background:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.roomStatusDot\s*\{[\s\S]*background:\s*var\(--activity-build\)/);
    expect(css).toMatch(/\.mobileContent\s*\{[\s\S]*overflow-y:\s*auto/);
    expect(css).toMatch(
      /\.bottomActionDock\s*\{[\s\S]*bottom:\s*0[\s\S]*env\(safe-area-inset-bottom\)/
    );
  });

  it("keeps commitment controls touchable, keyboard-visible, and color changes instant", () => {
    const css = foundationCss();

    expect(css).toMatch(
      /\.promptHints button\s*\{[\s\S]*min-height:\s*44px/
    );
    expect(css).toMatch(
      /\.artifactList label:focus-within\s*\{[\s\S]*outline:/
    );
    expect(css).not.toMatch(
      /transition:\s*[^;]*(?:background|border-color)/
    );
  });
});
