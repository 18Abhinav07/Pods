import { describe, expect, it } from "vitest";

import { isUuidRouteParam } from "../src/lib/route-params";

describe("isUuidRouteParam", () => {
  it("accepts canonical UUIDs and rejects arbitrary public path text", () => {
    expect(isUuidRouteParam("430296c7-9554-43e6-9b43-bfd063391028")).toBe(true);
    expect(isUuidRouteParam("phase-zero-missing")).toBe(false);
    expect(isUuidRouteParam("430296C7-9554-43E6-9B43-BFD063391028")).toBe(true);
  });
});
