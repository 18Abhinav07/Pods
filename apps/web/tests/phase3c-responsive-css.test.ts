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
});
