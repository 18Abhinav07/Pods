import { describe, expect, it, vi } from "vitest";

import { runClockAdvanceCommand } from "../src/clock/command";

function repository(current = new Date("2026-07-20T10:00:00.000Z")) {
  return {
    getEffectiveTime: vi.fn(async () => current),
    advanceClock: vi.fn(async (input) => ({
      id: "clock-event-1",
      previousTime: current,
      effectiveTime: input.effectiveTime,
      reason: input.reason,
      actor: input.actor,
      createdAt: input.realNow
    }))
  };
}

const allowedEnvironment = {
  APP_ENV: "local",
  NIMIQ_NETWORK: "testnet"
};

describe("audited Clock command", () => {
  it("advances local Testnet time and records a mandatory reason", async () => {
    const store = repository();

    const event = await runClockAdvanceCommand({
      argv: ["--to", "2026-07-21T00:00:00.000Z", "--reason", "Phase 3B cutoff test"],
      env: allowedEnvironment,
      repository: store,
      actor: "test:codex",
      realNow: () => new Date("2026-07-20T10:01:00.000Z")
    });

    expect(event.effectiveTime).toEqual(new Date("2026-07-21T00:00:00.000Z"));
    expect(store.advanceClock).toHaveBeenCalledWith({
      effectiveTime: new Date("2026-07-21T00:00:00.000Z"),
      reason: "Phase 3B cutoff test",
      actor: "test:codex",
      realNow: new Date("2026-07-20T10:01:00.000Z")
    });
  });

  it("rejects every environment except local Testnet", async () => {
    for (const env of [
      { APP_ENV: "production", NIMIQ_NETWORK: "testnet" },
      { APP_ENV: "local", NIMIQ_NETWORK: "mainnet" }
    ]) {
      const store = repository();
      await expect(
        runClockAdvanceCommand({
          argv: ["--to", "2026-07-21T00:00:00.000Z", "--reason", "Unsafe advance"],
          env,
          repository: store,
          actor: "test:codex"
        })
      ).rejects.toThrow("Clock overrides require APP_ENV=local and NIMIQ_NETWORK=testnet");
      expect(store.advanceClock).not.toHaveBeenCalled();
    }
  });

  it("rejects a missing reason, invalid time, and backwards movement", async () => {
    await expect(
      runClockAdvanceCommand({
        argv: ["--to", "2026-07-21T00:00:00.000Z"],
        env: allowedEnvironment,
        repository: repository(),
        actor: "test:codex"
      })
    ).rejects.toThrow("Clock advance requires a non-empty --reason");

    await expect(
      runClockAdvanceCommand({
        argv: ["--to", "not-a-time", "--reason", "Invalid target"],
        env: allowedEnvironment,
        repository: repository(),
        actor: "test:codex"
      })
    ).rejects.toThrow("Clock advance requires a valid --to timestamp");

    await expect(
      runClockAdvanceCommand({
        argv: ["--to", "2026-07-20T09:59:59.000Z", "--reason", "Backwards target"],
        env: allowedEnvironment,
        repository: repository(),
        actor: "test:codex"
      })
    ).rejects.toThrow("Clock can only advance beyond the current effective time");
  });
});
