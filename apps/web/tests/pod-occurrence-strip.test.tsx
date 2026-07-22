import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { formatRemainingTime, PodOccurrenceStrip } from "../src/components/pod-occurrence-strip";

describe("PodOccurrenceStrip", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows exact remaining time without duplicating the composer action", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-03-01T10:00:01.000Z"));

    render(
      <PodOccurrenceStrip
        initialNow="2027-03-01T10:00:00.000Z"
        progressLabel="Occurrence 2 of 6"
        stateLabel="Proof due"
        targetAt="2027-03-01T11:02:03.000Z"
        targetLabel="remaining"
      />
    );

    expect(screen.getByText("1h 02m 03s remaining")).toBeVisible();
    expect(screen.getByText("Occurrence 2 of 6")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(formatRemainingTime(new Date("2027-03-01T11:02:03.000Z").getTime(), new Date("2027-03-01T10:00:00.000Z").getTime()))
      .toBe("1h 02m 03s");
  });

  it("renders a terminal schedule without a fake timer", () => {
    render(
      <PodOccurrenceStrip
        initialNow="2027-03-01T10:00:00.000Z"
        progressLabel="1 of 1 occurrences finished"
        stateLabel="Schedule complete"
        targetAt={null}
        targetLabel={null}
      />
    );

    expect(screen.getByText("Schedule complete")).toBeVisible();
    expect(screen.getByText("1 of 1 occurrences finished")).toBeVisible();
    expect(screen.queryByText("Activity in progress")).not.toBeInTheDocument();
  });
});
