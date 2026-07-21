import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  readStorageConfiguration,
  sanitizeEvidenceImage
} from "../src/lib/evidence-storage";

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

describe("readStorageConfiguration", () => {
  const configured = {
    PODS_S3_ENDPOINT: "https://storage.example",
    PODS_S3_REGION: "auto",
    PODS_S3_BUCKET: "pods-evidence",
    PODS_S3_ACCESS_KEY_ID: "access-key",
    PODS_S3_SECRET_ACCESS_KEY: "secret-key"
  };

  it("keeps local S3 compatibility defaults", () => {
    expect(readStorageConfiguration(configured)).toMatchObject({
      forcePathStyle: true,
      createBucketIfMissing: true
    });
  });

  it("supports Railway virtual-hosted buckets without runtime bucket creation", () => {
    expect(
      readStorageConfiguration({
        ...configured,
        PODS_S3_FORCE_PATH_STYLE: "false",
        PODS_S3_CREATE_BUCKET_IF_MISSING: "false"
      })
    ).toEqual({
      endpoint: "https://storage.example",
      region: "auto",
      bucket: "pods-evidence",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      forcePathStyle: false,
      createBucketIfMissing: false
    });
  });

  it("rejects ambiguous boolean configuration", () => {
    expect(() =>
      readStorageConfiguration({
        ...configured,
        PODS_S3_FORCE_PATH_STYLE: "sometimes"
      })
    ).toThrow("PODS_S3_FORCE_PATH_STYLE must be true or false");
  });
});
