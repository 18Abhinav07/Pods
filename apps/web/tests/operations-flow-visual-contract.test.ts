import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const routeFiles = [
  "src/app/ops/connect/page.tsx",
  "src/app/ops/public-safety/page.tsx",
  "src/app/ops/transfers/page.tsx",
  "src/app/report/[handle]/page.tsx"
];

const componentFiles = [
  "src/components/ops-connect-form.tsx",
  "src/components/public-moderation-controls.tsx",
  "src/components/payout-retry-controls.tsx",
  "src/components/report-profile-form.tsx"
];

describe("operations and reporting visual contract", () => {
  it("uses one scoped mobile-first operations system across every assigned surface", () => {
    const routes = routeFiles.map((file) =>
      readFileSync(resolve(process.cwd(), file), "utf8")
    );
    const components = componentFiles.map((file) =>
      readFileSync(resolve(process.cwd(), file), "utf8")
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/ops-flow.module.css"),
      "utf8"
    );
    const combined = `${routes.join("\n")}\n${components.join("\n")}\n${styles}`;

    expect(routes.every((source) => source.includes("ops-flow.module.css"))).toBe(true);
    expect(components.every((source) => source.includes("ops-flow.module.css"))).toBe(true);
    expect(styles).toContain("#d9ed72");
    expect(styles).toContain("#20241f");
    expect(styles).toMatch(/\.queueCard\s*\{[^}]*background:\s*#fff;/s);
    expect(styles).toMatch(
      /\.boundaryCard,[\s\S]*?\.queueCard,[\s\S]*?\{[^}]*box-shadow:/s
    );
    expect(styles).not.toMatch(/border-(?:top|bottom)\s*:/);
    expect(styles).not.toMatch(/#(?:394fc2|4f46e5|6366f1)/i);
    expect(styles).toContain("@media (max-width: 359px)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(combined).not.toContain("\u2014");
  });

  it("keeps every mandated transfer recovery category first class", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/ops/transfers/page.tsx"),
      "utf8"
    );

    for (const state of [
      "unknown",
      "retryable_failed",
      "mismatched",
      "late",
      "manual_review"
    ]) {
      expect(page).toContain(`"${state}"`);
    }
    expect(page).toContain("Transaction hash");
    expect(page).toContain("Recovery reason");
  });

  it("makes keyboard focus and compact mobile actions explicit", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/ops-flow.module.css"),
      "utf8"
    );

    expect(styles).toMatch(
      /\.primaryAction:focus-visible,[\s\S]*?\.secondaryAction:focus-visible[\s\S]*?outline:\s*3px solid #20241f/s
    );
    expect(styles).toMatch(/\.filterBar\s*\{[^}]*overflow-x:\s*auto;/s);
    expect(styles).toMatch(/\.formActions\s*\{[^}]*gap:\s*12px;/s);
  });
});
