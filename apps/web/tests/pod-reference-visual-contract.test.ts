import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Pod reference visual contract", () => {
  it("uses scoped mobile surfaces for proof history, members, rules, and public contributors", () => {
    const activity = source("src/app/pods/[podId]/activity/page.tsx");
    const members = source("src/app/pods/[podId]/members/page.tsx");
    const rules = source("src/app/pods/[podId]/rules/page.tsx");
    const contributor = source("src/app/pods/[podId]/contributors/[handle]/page.tsx");
    const css = source("src/components/pod-reference-flow.module.css");

    expect(activity).toContain("pod-reference-flow.module.css");
    expect(members).toContain("pod-reference-flow.module.css");
    expect(rules).toContain("pod-reference-flow.module.css");
    expect(contributor).toContain("pod-reference-flow.module.css");
    expect(css).toMatch(/width:\s*min\(100%,\s*520px\)/);
    expect(css).toMatch(/@media \(max-width:\s*359px\)/);
    expect(css).toMatch(/box-shadow:/);
    expect(css).not.toMatch(/border:\s*1px solid/);
  });

  it("keeps secondary detail behind disclosure instead of presenting a wall of rows", () => {
    const rules = source("src/app/pods/[podId]/rules/page.tsx");

    expect(rules).toContain("<details");
    expect(rules).toContain("Financial and verification terms");
  });
});
