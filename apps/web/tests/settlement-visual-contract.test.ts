import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("production settlement visual contract", () => {
  it("uses a dedicated mobile terminal-finance system", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/pods/[podId]/settlement/page.tsx"),
      "utf8"
    );
    const summary = readFileSync(
      resolve(process.cwd(), "src/components/settlement-summary.tsx"),
      "utf8"
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/settlement-flow.module.css"),
      "utf8"
    );

    expect(page).toContain("settlement-flow.module.css");
    expect(summary).toContain("settlement-flow.module.css");
    expect(page).toContain("profileForSession(session)");
    expect(styles).toContain("#d9ed72");
    expect(styles).toContain("#20241f");
    expect(styles).not.toMatch(/#(?:394fc2|4f46e5|6366f1)/i);
    expect(styles).not.toMatch(/border-(?:top|bottom)\s*:/);
    expect(`${page}\n${summary}\n${styles}`).not.toContain("\u2014");
  });

  it("keeps terminal actions mobile safe and keyboard visible", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/settlement-flow.module.css"),
      "utf8"
    );

    expect(styles).toMatch(
      /\.terminalActions\s*\{[^}]*padding-bottom:[^;]*env\(safe-area-inset-bottom\)/s
    );
    expect(styles).toMatch(
      /\.primaryAction:focus-visible,[\s\S]*?\.secondaryAction:focus-visible\s*\{[^}]*outline:\s*3px solid #20241f/s
    );
    expect(styles).toContain("@media (max-width: 359px)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
