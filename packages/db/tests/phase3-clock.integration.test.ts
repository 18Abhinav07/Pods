import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/index";
import { runPodsMigrations } from "../src/migration-runner";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const repository = createPodsRepository(databaseUrl);
const actor = "test:phase3-clock";

beforeAll(async () => {
  await runPodsMigrations(databaseUrl);
});

afterAll(async () => {
  await repository.close();
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query("DELETE FROM clock_events WHERE actor = $1", [actor]);
  } finally {
    await pool.end();
  }
});

describe("Phase 3 audited Clock persistence", () => {
  it("defaults to real time, advances monotonically, and retains immutable audit rows", async () => {
    const initialRealTime = new Date("2026-07-20T10:00:00.000Z");
    const baseline = await repository.getEffectiveTime(initialRealTime);
    expect(baseline.getTime()).toBeGreaterThanOrEqual(initialRealTime.getTime());
    const firstTime = new Date(baseline.getTime() + 60 * 60 * 1000);
    const secondTime = new Date(firstTime.getTime() + 5 * 60 * 1000);

    const first = await repository.advanceClock({
      effectiveTime: firstTime,
      reason: "Reach the Phase 3B cutoff",
      actor,
      realNow: initialRealTime
    });
    const second = await repository.advanceClock({
      effectiveTime: secondTime,
      reason: "Verify monotonic follow-up",
      actor,
      realNow: new Date("2026-07-20T10:02:00.000Z")
    });

    expect(first.previousTime).toEqual(baseline);
    expect(second.previousTime).toEqual(first.effectiveTime);
    expect(await repository.getEffectiveTime(new Date("2026-07-20T10:03:00.000Z")))
      .toEqual(second.effectiveTime);

    await expect(
      repository.advanceClock({
        effectiveTime: new Date(secondTime.getTime() - 1_000),
        reason: "Attempt backwards movement",
        actor,
        realNow: new Date("2026-07-20T10:04:00.000Z")
      })
    ).rejects.toThrow("Clock can only advance beyond the current effective time");

    const events = await repository.listClockEvents(actor);
    expect(events).toHaveLength(2);
    expect(events.map((event) => ({
      previousTime: event.previousTime.toISOString(),
      effectiveTime: event.effectiveTime.toISOString(),
      reason: event.reason
    }))).toEqual([
      {
        previousTime: baseline.toISOString(),
        effectiveTime: firstTime.toISOString(),
        reason: "Reach the Phase 3B cutoff"
      },
      {
        previousTime: firstTime.toISOString(),
        effectiveTime: secondTime.toISOString(),
        reason: "Verify monotonic follow-up"
      }
    ]);
  });
});
