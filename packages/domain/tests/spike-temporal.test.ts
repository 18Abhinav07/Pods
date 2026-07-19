import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

function localDayLengthHours(date: string, timeZone: string) {
  const start = Temporal.PlainDate.from(date).toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from("00:00")
  });
  const end = start.add({ days: 1 });
  return Number(end.epochMilliseconds - start.epochMilliseconds) / 3_600_000;
}

describe("Temporal schedule spike", () => {
  it("keeps a normal UTC occurrence at 24 hours", () => {
    expect(localDayLengthHours("2026-03-08", "UTC")).toBe(24);
  });

  it("freezes the New York spring DST occurrence at 23 real hours", () => {
    expect(localDayLengthHours("2026-03-08", "America/New_York")).toBe(23);
  });
});
