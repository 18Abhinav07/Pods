import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("Next LAN development contract", () => {
  it("allows the configured phone origin so client components hydrate", () => {
    expect(nextConfig.allowedDevOrigins).toContain("192.168.29.244");
  });

  it("keeps Nimiq Core external so its Node WASM asset resolves", () => {
    expect(nextConfig.serverExternalPackages).toContain("@nimiq/core");
  });

  it("does not let the development indicator cover bottom-mounted mobile controls", () => {
    expect(nextConfig.devIndicators).toBe(false);
  });
});
