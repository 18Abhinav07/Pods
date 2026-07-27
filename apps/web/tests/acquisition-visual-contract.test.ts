import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const productionFiles = [
  "src/app/discover/page.tsx",
  "src/components/public-pod-card.tsx",
  "src/app/pods/[podId]/page.tsx",
  "src/app/pods/[podId]/apply/page.tsx",
  "src/components/application-form.tsx",
  "src/app/applications/page.tsx"
];

describe("production acquisition visual contract", () => {
  it("does not ship the obsolete design preview route", () => {
    expect(
      existsSync(resolve(process.cwd(), "src/app/design-preview/page.tsx"))
    ).toBe(false);
  });

  it("uses a dedicated production module without preview internals", () => {
    const sources = productionFiles.map((file) =>
      readFileSync(resolve(process.cwd(), file), "utf8")
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/acquisition-flow.module.css"),
      "utf8"
    );

    expect(sources.every((source) => source.includes("acquisition-flow.module.css")))
      .toBe(true);
    expect(sources.join("\n")).not.toContain("design-preview");
    expect(styles).toContain("#d9ed72");
    expect(styles).toContain("#1d211d");
    expect(styles).toMatch(
      /\.podCard\[data-template="build"\]\s*\{[^}]*--pod-accent:\s*#d9ed72;/s
    );
    expect(styles).toMatch(
      /\.shell\[data-template="build"\]\s*\{[^}]*--pod-accent:\s*#d9ed72;/s
    );
    expect(styles).toMatch(
      /\.podCard\[data-template="create"\]\s*\{[^}]*--pod-accent:\s*#82abd4;/s
    );
    expect(styles).toMatch(
      /\.shell\[data-template="create"\]\s*\{[^}]*--pod-accent:\s*#82abd4;/s
    );
    expect(styles).toMatch(
      /\.stageSelector a\[aria-current="page"\]\s*\{[^}]*background:\s*#fefff9;/s
    );
    expect(styles).toMatch(
      /\.stageSelector a\[aria-current="page"\]::after\s*\{[^}]*background:\s*#d9ed72;/s
    );
    expect(styles).toMatch(
      /\.templateFilters a\[aria-current="page"\]\s*\{[^}]*color:\s*#fff;[^}]*background:\s*#1d211d;/s
    );
    expect(styles).toMatch(
      /\.stickyAction\s*\{[^}]*position:\s*fixed;[^}]*bottom:\s*calc\(12px \+ env\(safe-area-inset-bottom\)\);/s
    );
    expect(styles).toMatch(
      /\.stickyAction\s*\{[^}]*left:\s*50%;[^}]*transform:\s*translateX\(-50%\);/s
    );
    expect(styles).toMatch(
      /\.formActions\s*\{[^}]*position:\s*sticky;/s
    );
    expect(styles).toMatch(
      /\.shell\s*\{[^}]*padding:[^;]*116px[^;]*safe-area-inset-bottom[^;]*;/s
    );
    expect(styles).not.toMatch(/#(?:3b5ccc|4f46e5|6366f1)/i);
    expect(styles).not.toMatch(/border-(?:top|bottom)\s*:/);
    expect(`${sources.join("\n")}\n${styles}`).not.toContain("\u2014");
  });

  it("uses opaque high-contrast keyboard focus treatments", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/acquisition-flow.module.css"),
      "utf8"
    );

    expect(styles).toMatch(
      /\.podCard:focus-within\s*\{[^}]*0 0 0 3px #1d211d,/s
    );
    expect(styles).toMatch(
      /\.cardHitArea:focus-visible\s*\{[^}]*outline:\s*3px solid #1d211d;[^}]*outline-offset:\s*-4px;/s
    );
    expect(styles).toMatch(
      /\.primaryAction:focus-visible,[\s\S]*?\.disclosureRow summary:focus-visible\s*\{[^}]*outline:\s*3px solid #1d211d;[^}]*outline-offset:\s*3px;/s
    );
    expect(styles).toMatch(
      /\.questionStep textarea:focus-visible\s*\{[^}]*outline:\s*3px solid #1d211d;[^}]*outline-offset:\s*2px;/s
    );
    expect(styles).toMatch(
      /\.consentRow input:focus-visible\s*\{[^}]*outline:\s*3px solid #1d211d;[^}]*outline-offset:\s*2px;/s
    );
  });

  it("keeps the three public Pod metrics aligned at narrow mobile widths", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/acquisition-flow.module.css"),
      "utf8"
    );

    expect(styles).toMatch(
      /\.facts\s*\{[^}]*align-items:\s*stretch;/s
    );
    expect(styles).toMatch(
      /\.fact\s*\{[^}]*display:\s*grid;[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\);/s
    );
    expect(styles).toMatch(
      /\.factValue\s*\{[^}]*font-variant-numeric:\s*tabular-nums;[^}]*white-space:\s*nowrap;/s
    );
  });
});
