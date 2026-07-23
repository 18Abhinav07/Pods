import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

function rule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

describe("Phase 3C narrow mobile contract", () => {
  it("keeps core funding outcomes inside the viewport", () => {
    expect(rule(".outcome-table-wrap")).toMatch(/overflow-x:\s*visible/);
    expect(rule(".outcome-table-wrap table")).not.toMatch(/min-width:\s*360px/);
    expect(css).toMatch(/@media \(max-width:\s*360px\)[\s\S]*\.outcome-table-wrap tbody tr/);
  });

  it.each([".wallet-chip", ".bottom-nav a", ".quiet-link"])(
    "gives %s a 44 pixel touch target",
    (selector) => {
      expect(rule(selector)).toMatch(/min-height:\s*44px/);
    }
  );

  it("keeps the final creator review phone overrides after their base rules", () => {
    const responsiveIndex = css.lastIndexOf("@media (max-width: 480px)");
    const timingBaseIndex = css.indexOf(
      ".occurrence-context-grid,\n.active-pod-metrics,\n.review-timing-card {"
    );
    const queueBaseIndex = css.indexOf(
      ".review-queue-row {\n  display: grid;"
    );
    const responsive = css.slice(responsiveIndex);

    expect(responsiveIndex).toBeGreaterThan(timingBaseIndex);
    expect(responsiveIndex).toBeGreaterThan(queueBaseIndex);
    expect(responsive).toMatch(
      /\.review-timing-card\s*\{[^}]*grid-template-columns:\s*1fr/
    );
    expect(responsive).toMatch(
      /\.creator-review-queue-row\s*\{[^}]*grid-template-columns:\s*auto minmax\(0,\s*1fr\)/
    );
    expect(responsive).toMatch(
      /\.creator-review-queue-copy\s*\{[^}]*min-width:\s*0/
    );
    expect(responsive).toMatch(
      /\.creator-review-queue-row time\s*\{[^}]*grid-column:\s*2[^}]*white-space:\s*normal/
    );
  });

  it.each([".locked-task-panel strong", ".review-contract-card strong"])(
    "contains long locked task values in %s",
    (selector) => {
      expect(rule(selector)).toMatch(/min-width:\s*0/);
      expect(rule(selector)).toMatch(/overflow-wrap:\s*anywhere/);
    }
  );
});
