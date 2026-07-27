import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const routeFiles = [
  "src/app/pods/[podId]/fund/page.tsx",
  "src/app/pods/[podId]/fund/status/page.tsx",
  "src/app/pods/[podId]/today/page.tsx"
];

describe("production financial visual contract", () => {
  it("uses the financial production module across every route shell", () => {
    const routes = routeFiles.map((file) =>
      readFileSync(resolve(process.cwd(), file), "utf8")
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/financial-flow.module.css"),
      "utf8"
    );

    expect(routes.every((source) => source.includes("financial-flow.module.css")))
      .toBe(true);
    expect(routes[0]).toContain("Funding window closed");
    expect(routes[0]).toContain("No new wallet request will be opened");
    expect(routes[0]).toContain("getMembershipForUser");
    expect(routes[0]).toContain("depositIntentId");
    expect(routes[0]).toContain("Open funding tracker");
    expect(routes[0]).not.toContain("Your wallet was not charged here");
    expect(routes.join("\n")).not.toContain("design-preview");
    expect(styles).toContain("#d9ed72");
    expect(styles).toContain("#20241f");
    expect(styles).not.toMatch(/#(?:394fc2|4f46e5|6366f1)/i);
    expect(`${routes.join("\n")}\n${styles}`).not.toContain("\u2014");
  });

  it("provides mobile-safe actions, focus, and reduced-motion handling", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/financial-flow.module.css"),
      "utf8"
    );

    expect(styles).toMatch(
      /\.actionDock\s*\{[^}]*position:\s*sticky;[^}]*env\(safe-area-inset-bottom\)/s
    );
    expect(styles).toMatch(/\.primaryAction:focus-visible,[\s\S]*outline:\s*3px solid #20241f/s);
    expect(styles).toContain("@media (max-width: 359px)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses progressive funding disclosure and one compact status rail", () => {
    const component = readFileSync(
      resolve(process.cwd(), "src/components/funding-commitment.tsx"),
      "utf8"
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/financial-flow.module.css"),
      "utf8"
    );

    expect(component).toContain("data-funding-step");
    expect(component).toContain("Review protection");
    expect(component).toContain("Continue to wallet");
    expect(styles).toMatch(
      /\.fundingProgress ol\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s
    );
    expect(styles).toMatch(
      /\.compactRail\s*\{[^}]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\);/s
    );
    expect(styles).toMatch(
      /\.compactStep\s*\{[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s
    );
  });
});
