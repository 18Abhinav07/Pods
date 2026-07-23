import { readFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";
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

  it("publishes native-friendly Pods identity metadata", () => {
    expect(metadata.applicationName).toBe("pods");
    expect(metadata.manifest).toBe("/manifest.webmanifest");
    expect(metadata.icons).toEqual({
      icon: [
        { url: "/brand/pods-mark.svg", type: "image/svg+xml" },
        { url: "/brand/pods-icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/brand/pods-icon-512.png", type: "image/png", sizes: "512x512" }
      ],
      shortcut: "/brand/pods-icon-192.png",
      apple: [{ url: "/brand/pods-apple-touch-icon.png", sizes: "180x180" }]
    });
    expect(metadata.appleWebApp).toEqual({
      capable: true,
      title: "pods",
      statusBarStyle: "default"
    });
  });

  it("ships a complete install manifest and correctly sized PNG icons", async () => {
    const manifestText = await readFile(
      join(webRoot, "public/manifest.webmanifest"),
      "utf8"
    ).catch(() => null);
    expect(manifestText).not.toBeNull();
    const manifest = JSON.parse(manifestText ?? "{}") as {
      name?: string;
      short_name?: string;
      icons?: Array<{ src?: string; sizes?: string; purpose?: string }>;
    };
    expect(manifest.name).toBe("pods");
    expect(manifest.short_name).toBe("pods");
    expect(manifest.icons).toEqual([
      {
        src: "/brand/pods-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/brand/pods-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]);

    for (const [file, size] of [
      ["pods-icon-192.png", 192],
      ["pods-icon-512.png", 512],
      ["pods-apple-touch-icon.png", 180]
    ] as const) {
      const image = await sharp(join(webRoot, "public/brand", file)).metadata();
      expect(image.format).toBe("png");
      expect(image.width).toBe(size);
      expect(image.height).toBe(size);
    }
  });
});
