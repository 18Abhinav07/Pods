import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("production home and history visual contract", () => {
  it("uses whole-card Pod navigation and card-based lifecycle history", () => {
    const myPodsPage = readFileSync(
      resolve(process.cwd(), "src/app/my-pods/page.tsx"),
      "utf8"
    );
    const myPodsList = readFileSync(
      resolve(process.cwd(), "src/components/my-pods-list.tsx"),
      "utf8"
    );
    const updatesPage = readFileSync(
      resolve(process.cwd(), "src/app/updates/page.tsx"),
      "utf8"
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/home-flow.module.css"),
      "utf8"
    );
    const combined = `${myPodsPage}\n${myPodsList}\n${updatesPage}\n${styles}`;

    expect(myPodsPage).toContain("home-flow.module.css");
    expect(myPodsList).toContain("home-flow.module.css");
    expect(updatesPage).toContain("home-flow.module.css");
    expect(myPodsList).not.toContain("my-pod-row");
    expect(updatesPage).not.toContain("inbox-event-index");
    expect(styles).toMatch(/\.podList\s*\{[^}]*gap:\s*14px;/s);
    expect(styles).toMatch(/\.podCard\s*\{[^}]*border-radius:\s*22px;/s);
    expect(styles).toMatch(/\.historyList\s*\{[^}]*gap:\s*14px;/s);
    expect(styles).not.toMatch(/border-(?:top|bottom)\s*:/);
    expect(styles).not.toMatch(/#(?:3b5ccc|4f46e5|6366f1)/i);
    expect(combined).not.toContain("\u2014");
  });
});
