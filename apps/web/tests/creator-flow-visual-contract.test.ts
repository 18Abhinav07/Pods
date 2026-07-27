import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const productionFiles = [
  "src/components/creator-shell.tsx",
  "src/components/template-picker.tsx",
  "src/components/activity-form.tsx",
  "src/components/community-form.tsx",
  "src/components/commitment-form.tsx",
  "src/components/publish-client.tsx",
  "src/app/pods/create/review/page.tsx"
];

describe("production creator journey visual contract", () => {
  it("uses the approved mobile creator system without legacy report layouts", () => {
    const sources = productionFiles.map((file) =>
      readFileSync(resolve(process.cwd(), file), "utf8")
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/creator-flow.module.css"),
      "utf8"
    );
    const combined = `${sources.join("\n")}\n${styles}`;

    expect(
      sources.every((source) => source.includes("creator-flow.module.css"))
    ).toBe(true);
    expect(combined).toContain("/media/nimiq-signet.svg");
    expect(combined).toContain("/brand/pods-mark.svg");
    expect(combined).not.toContain("wordmarkMark");
    expect(styles).toContain("#d9ed72");
    expect(styles).toContain("#1d211d");
    expect(styles).toMatch(
      /\.actionDock\s*\{[^}]*position:\s*sticky;[^}]*bottom:\s*0;/s
    );
    expect(combined).toContain("formActionDock");
    expect(styles).toMatch(
      /\.formActionDock\s*\{[^}]*position:\s*static;/s
    );
    expect(styles).toMatch(
      /\.choiceIndicator\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.compactChoice\s*\{[^}]*grid-template-columns:\s*32px minmax\(0,\s*1fr\) 24px;/s
    );
    expect(styles).toMatch(
      /\.deliverableIndicator\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px;/s
    );
    expect(styles).toMatch(
      /\.compactChoice:has\(input:checked\) \.deliverableIndicator\s*\{[^}]*background:\s*var\(--creator-lime\);/s
    );
    expect(combined).toContain("GitPullRequest");
    expect(combined).toContain("ArrowSquareOut");
    expect(styles).toMatch(
      /\.switchControl\s*\{[^}]*width:\s*52px;[^}]*height:\s*32px;/s
    );
    expect(styles).toMatch(
      /input,[\s\S]*?textarea,[\s\S]*?select\s*\{[^}]*font-size:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.templateCard:focus-visible,[\s\S]*?\.consentPanel:focus-within\s*\{[^}]*outline:\s*3px solid #1d211d;/s
    );
    expect(styles).not.toMatch(/border-(?:top|bottom)\s*:/);
    expect(styles).not.toMatch(/#(?:3b5ccc|4f46e5|6366f1)/i);
    expect(combined).not.toContain("\u2014");
  });

  it("uses a real visitor switch and progressive financial disclosure", () => {
    const community = readFileSync(
      resolve(process.cwd(), "src/components/community-form.tsx"),
      "utf8"
    );
    const commitment = readFileSync(
      resolve(process.cwd(), "src/components/commitment-form.tsx"),
      "utf8"
    );
    const review = readFileSync(
      resolve(process.cwd(), "src/app/pods/create/review/page.tsx"),
      "utf8"
    );
    const publish = readFileSync(
      resolve(process.cwd(), "src/components/publish-client.tsx"),
      "utf8"
    );

    expect(community).toContain('role="switch"');
    expect(community).toContain('name="roomAudience"');
    expect(commitment).toContain("<details");
    expect(commitment).toContain("How settlement works");
    expect(review).toContain("contractReceipt");
    expect(publish).toContain("consentPanel");
    expect(publish).toContain("publishSuccess");
  });
});
