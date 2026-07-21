import { describe, expect, it } from "vitest";

import { formatZonedMoment } from "../src/lib/format-moment";

describe("formatZonedMoment", () => {
  it("constructs stable punctuation from an explicit timezone", () => {
    expect(formatZonedMoment("2027-03-08T01:00:00.000Z", {
      timeZone: "UTC",
      includeYear: true,
      includeZone: true
    })).toBe("Mar 8, 2027 · 1:00 AM UTC");
    expect(formatZonedMoment("2027-03-08T01:00:00.000Z", {
      timeZone: "Asia/Kolkata",
      includeZone: false
    })).toBe("Mar 8 · 6:30 AM");
  });
});
