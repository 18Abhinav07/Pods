import { describe, expect, it } from "vitest";

import { sha256Hex } from "../src/lib/file-sha256";

describe("sha256Hex", () => {
  const expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

  it("uses Web Crypto when the WebView provides it", async () => {
    const subtle = {
      digest: async () => Uint8Array.from(Buffer.from(expected, "hex")).buffer
    } as unknown as SubtleCrypto;

    await expect(sha256Hex(new TextEncoder().encode("abc").buffer, subtle))
      .resolves.toBe(expected);
  });

  it("falls back to Nimiq core when local HTTP has no SubtleCrypto", async () => {
    await expect(sha256Hex(new TextEncoder().encode("abc").buffer, null))
      .resolves.toBe(expected);
  });
});
