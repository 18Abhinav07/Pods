import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const css = () => readFileSync(
  resolve(process.cwd(), "src/components/activity-ritual/activity-ritual.module.css"),
  "utf8"
);
const designSystemCss = () => readFileSync(
  resolve(process.cwd(), "src/app/design-system.css"),
  "utf8"
);

describe("activity ritual quality contract", () => {
  it("gives every proof and creator input a visible keyboard focus treatment", () => {
    const source = css();

    expect(source).toMatch(/\.statementEditor:focus-within\s*\{[\s\S]*outline:/);
    expect(source).toMatch(/\.linkEditor:focus-within\s*\{[\s\S]*outline:/);
    expect(source).toMatch(/\.linkEditor input:focus-visible\s*\{[\s\S]*outline:/);
    expect(source).toMatch(/\.privacyChoices label:focus-within\s*\{[\s\S]*outline:/);
    expect(source).toMatch(
      /\.approvalForm textarea:focus-visible,[\s\S]*\.rejectionPanel textarea:focus-visible\s*\{[\s\S]*outline:/
    );
  });

  it("uses no decorative side stripe on outcomes, decisions, or room activity", () => {
    const source = css();

    for (const className of [
      "outcomeNote",
      "decisionNote",
      "recordedDecision",
      "roomActivityArtifact"
    ]) {
      const block = source.match(
        new RegExp(`\\.${className}(?:,\\s*\\.[^{]+)?\\s*\\{([^}]+)\\}`)
      )?.[1] ?? "";
      expect(block, `${className} CSS block`).not.toBe("");
      expect(block, className).not.toMatch(/border-left/);
    }
  });

  it("keeps authoritative room activity content inset from the card edge", () => {
    const source = css();
    const block = source.match(/\.roomActivityArtifact\s*\{([^}]+)\}/)?.[1] ?? "";

    expect(block).toMatch(/padding:\s*12px 14px 14px/);
  });

  it("keeps legacy proof links from overriding structured artifact cards", () => {
    expect(designSystemCss()).toContain(
      ".proof-history-copy a:not([data-artifact-card])"
    );
  });
});
