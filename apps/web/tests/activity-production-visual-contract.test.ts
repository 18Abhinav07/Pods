import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function source(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function rule(css: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? "";
}

describe("production activity and review visual contract", () => {
  const css = source("src/components/activity-ritual/activity-ritual.module.css");
  const artifactCss = source("src/components/artifact-link-card.module.css");

  it("uses raised surfaces instead of report dividers for commitments and results", () => {
    const locked = rule(css, ".lockedRail");
    const proofRecord = rule(css, ".proofRecord");
    const context = rule(css, ".reviewContext");

    expect(locked).toContain("box-shadow");
    expect(locked).not.toContain("border-block");
    expect(proofRecord).toContain("border-radius");
    expect(proofRecord).toContain("box-shadow");
    expect(context).toContain("border-radius");
    expect(context).toContain("box-shadow");
  });

  it("presents review queue rows as spacious cards and decisions as a sticky action group", () => {
    const queue = rule(css, ".reviewQueue");
    const row = rule(css, ".reviewQueue > a");
    const decision = rule(css, ".decisionArea");

    expect(queue).toContain("gap:");
    expect(row).toContain("border-radius");
    expect(row).toContain("box-shadow");
    expect(decision).toContain("position: sticky");
    expect(decision).toContain("env(safe-area-inset-bottom)");
  });

  it("keeps proof records and review workspaces mobile fluid", () => {
    expect(css).toContain("@media (max-width: 430px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/font:\s*600 16px/);
    expect(rule(css, ".reviewRows > div")).toContain(
      "grid-template-columns: minmax(0, 1fr)"
    );
    expect(rule(css, ".recordGroup > div")).toContain(
      "grid-template-columns: minmax(0, 1fr)"
    );
    expect(rule(css, ".reviewContext")).toContain(
      "grid-template-columns: minmax(0, 1fr)"
    );
  });

  it("presents public artifacts as a raised action card instead of a naked link", () => {
    const card = rule(artifactCss, ".card");

    expect(card).toContain("border: 0");
    expect(card).toContain("box-shadow");
    expect(artifactCss).toContain(".card:focus-visible");
  });

  it("keeps commitment and proof wizards card-based with mobile-safe action docks", () => {
    const statusRail = rule(css, ".statusRail");
    const editor = rule(css, ".statementEditor");
    const artifactChoice = rule(css, ".artifactList label");
    const dock = rule(css, ".entryDock,\n.wizardDock");

    expect(statusRail).not.toContain("border-block");
    expect(statusRail).toContain("box-shadow");
    expect(editor).toContain("border: 0");
    expect(editor).toContain("box-shadow");
    expect(artifactChoice).toContain("border: 0");
    expect(artifactChoice).toContain("box-shadow");
    expect(dock).toContain("width: min(100%, 430px)");
    expect(dock).toContain("box-shadow");
  });
});
