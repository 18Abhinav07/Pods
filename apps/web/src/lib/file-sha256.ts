function toHex(bytes: Uint8Array) {
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(
  source: ArrayBuffer,
  subtle: SubtleCrypto | null | undefined = globalThis.crypto?.subtle
) {
  if (subtle) {
    const digest = await subtle.digest("SHA-256", source);
    return toHex(new Uint8Array(digest));
  }

  // Local HTTP WebViews may omit SubtleCrypto. Noble supplies an audited,
  // browser-safe digest without pulling WebAssembly into the client bundle.
  const { sha256 } = await import("@noble/hashes/sha2.js");
  return toHex(sha256(new Uint8Array(source)));
}
