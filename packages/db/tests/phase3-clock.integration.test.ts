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
    expect(await repository.getEffectiveTime(initialRealTime)).toEqual(initialRealTime);

    const first = await repository.advanceClock({
      effectiveTime: new Date("2026-07-21T00:00:00.000Z"),
      reason: "Reach the Phase 3B cutoff",
      actor,
      realNow: new Date("2026-07-20T10:01:00.000Z")
    });
    const second = await repository.advanceClock({
      effectiveTime: new Date("2026-07-21T00:05:00.000Z"),
      reason: "Verify monotonic follow-up",
      actor,
      realNow: new Date("2026-07-20T10:02:00.000Z")
    });

    expect(first.previousTime).toEqual(new Date("2026-07-20T10:01:00.000Z"));
    expect(second.previousTime).toEqual(first.effectiveTime);
    expect(await repository.getEffectiveTime(new Date("2026-07-20T10:03:00.000Z")))
      .toEqual(second.effectiveTime);

    await expect(
      repository.advanceClock({
        effectiveTime: new Date("2026-07-21T00:04:59.000Z"),
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
        previousTime: "2026-07-20T10:01:00.000Z",
        effectiveTime: "2026-07-21T00:00:00.000Z",
        reason: "Reach the Phase 3B cutoff"
      },
      {
        previousTime: "2026-07-21T00:00:00.000Z",
        effectiveTime: "2026-07-21T00:05:00.000Z",
        reason: "Verify monotonic follow-up"
      }
    ]);
  });
});
