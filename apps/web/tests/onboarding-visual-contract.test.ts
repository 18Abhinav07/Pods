import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("first-run experience", () => {
  it("does not repeat wallet or identity status after authentication", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/onboarding/profile/page.tsx"), "utf8");
    const form = readFileSync(resolve(process.cwd(), "src/components/profile-onboarding-flow.tsx"), "utf8");
    expect(page).not.toContain("Wallet verified");
    expect(form).not.toContain("Your Pods identity");
    expect(form).not.toContain("Wallet verified");
  });

  it("keeps the handle control on one visual boundary while focused", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/entry-flow.module.css"),
      "utf8"
    );
    expect(styles).toMatch(
      /\.handleField input:focus\s*\{[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s
    );
  });
});
