import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const productionFiles = [
  "src/app/messages/page.tsx",
  "src/app/messages/new/page.tsx",
  "src/app/people/search/page.tsx",
  "src/app/profile/page.tsx",
  "src/app/u/[handle]/page.tsx",
  "src/components/direct-request-list.tsx",
  "src/components/direct-start-form.tsx",
  "src/components/friend-request-list.tsx",
  "src/components/profile-settings-sheet.tsx",
  "src/components/public-profile-card.tsx",
  "src/components/social-profile-actions.tsx",
  "src/components/targeted-invitation-list.tsx"
];

describe("production social and profile visual contract", () => {
  it("uses one scoped mobile system with raised cards and no separator layouts", () => {
    const sources = productionFiles.map((file) =>
      readFileSync(resolve(process.cwd(), file), "utf8")
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/components/social-flow.module.css"),
      "utf8"
    );
    const combined = `${sources.join("\n")}\n${styles}`;

    expect(sources.every((source) => source.includes("social-flow.module.css")))
      .toBe(true);
    expect(styles).toContain("#d9ed72");
    expect(styles).toContain("#1d211d");
    expect(styles).toMatch(/\.card\s*\{[^}]*border-radius:\s*22px;/s);
    expect(styles).toMatch(/@media \(max-width:\s*340px\)/);
    expect(styles).toMatch(/\.profileActions\s*\{[^}]*flex-wrap:\s*wrap;/s);
    expect(styles).not.toMatch(/border-(?:top|bottom)\s*:/);
    expect(styles).not.toMatch(/#(?:3b5ccc|4f46e5|6366f1)/i);
    expect(combined).not.toContain("\u2014");
  });

  it("keeps social request actions explicit and avoids removed discovery routes", () => {
    const friendRequests = readFileSync(
      resolve(process.cwd(), "src/components/friend-request-list.tsx"),
      "utf8"
    );
    const directRequests = readFileSync(
      resolve(process.cwd(), "src/components/direct-request-list.tsx"),
      "utf8"
    );
    const profileActions = readFileSync(
      resolve(process.cwd(), "src/components/social-profile-actions.tsx"),
      "utf8"
    );

    expect(friendRequests).toContain('"accept" | "decline" | "cancel"');
    expect(directRequests).toContain('"accept" | "discard" | "block"');
    expect(profileActions).not.toContain("/discover?view=people");
    expect(profileActions).toContain("/people/search");
  });
});
