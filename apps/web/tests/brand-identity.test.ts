import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { metadata } from "../src/app/layout";

const webRoot = process.cwd();

describe("Pods brand identity", () => {
  it("ships the approved transparent Signal Bloom SVG for small catalog surfaces", async () => {
    const mark = await readFile(join(webRoot, "public/brand/pods-mark.svg"), "utf8");

    expect(Buffer.byteLength(mark)).toBeLessThan(100_000);
    expect(mark).toContain('viewBox="0 0 120 120"');
    expect(mark).toContain('fill="#20241F"');
    expect(mark).not.toMatch(/<rect[^>]+(?:width="120"|width="100%")/);
    expect(mark).not.toContain("<image");
  });

  it("uses the mark for browser and Nimiq Pay WebView metadata", () => {
    expect(metadata.applicationName).toBe("pods");
    expect(metadata.icons).toEqual({
      icon: [{ url: "/brand/pods-mark.svg", type: "image/svg+xml" }],
      shortcut: "/brand/pods-mark.svg"
    });
  });
});
