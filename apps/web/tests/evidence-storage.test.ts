import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { sanitizeEvidenceImage } from "../src/lib/evidence-storage";

describe("sanitizeEvidenceImage", () => {
  it("detects actual image bytes, constrains dimensions, and emits metadata-free WebP", async () => {
    const source = await sharp({
      create: { width: 2200, height: 1200, channels: 3, background: "#23c483" }
    })
      .withMetadata({ exif: { IFD0: { Artist: "private participant" } } })
      .jpeg()
      .toBuffer();

    const result = await sanitizeEvidenceImage(source);
    const metadata = await sharp(result.bytes).metadata();

    expect(result.contentType).toBe("image/webp");
    expect(result.extension).toBe("webp");
    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBeLessThanOrEqual(1600);
    expect(metadata.exif).toBeUndefined();
  });

  it("rejects forged or unsupported image payloads", async () => {
    await expect(sanitizeEvidenceImage(Buffer.from("not an image")))
      .rejects.toThrow("Choose a valid JPG, PNG, HEIC, AVIF, or WebP image");
  });
});
