import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function source(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("production room visual contract", () => {
  it("isolates the room presentation from the legacy global stylesheet", () => {
    const room = source("src/components/pod-room.tsx");
    const header = source("src/components/pod-room-header.tsx");
    const strip = source("src/components/pod-occurrence-strip.tsx");
    const visitor = source("src/components/public-visitor-room.tsx");

    expect(room).toContain('from "./pod-room.module.css"');
    expect(header).toContain('from "./pod-room.module.css"');
    expect(strip).toContain('from "./pod-room.module.css"');
    expect(visitor).toContain('from "./pod-room.module.css"');
  });

  it("defines a full-width safe-area composer and fluid room canvas", () => {
    const css = source("src/components/pod-room.module.css");

    expect(css).toContain("min-width: 320px");
    expect(css).toContain("max-width: 430px");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toMatch(/\.composer\s*\{[\s\S]*position:\s*fixed/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps activity cards concise and visitor mode explicitly read only", () => {
    const room = source("src/components/pod-room.tsx");
    const roomCss = source("src/components/pod-room.module.css");
    const artifactCss = source("src/components/artifact-link-card.module.css");
    const visitor = source("src/components/public-visitor-room.tsx");

    expect(room).toContain("data-room-activity-card");
    expect(room).not.toContain('tone="inverse"');
    expect(roomCss).toMatch(
      /\.activityCard\s*\{[^}]*gap:\s*10px;[^}]*padding:\s*12px 13px 13px;/s
    );
    expect(artifactCss).toMatch(
      /\[data-room-public-artifact\]\s*\{[^}]*color:\s*var\(--color-ink\);[^}]*background:[^;]*var\(--activity-build\)/s
    );
    expect(visitor).toContain("data-read-only-room");
    expect(visitor).toContain("Read-only");
  });

  it("keeps a creator's own announcement readable on its light authoritative card", () => {
    const css = source("src/components/pod-room.module.css");

    expect(css).toMatch(
      /\.announcement\s*\{[^}]*color:\s*var\(--room-ink\);/
    );
  });
});
