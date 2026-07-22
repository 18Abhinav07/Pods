import { afterEach, describe, expect, it, vi } from "vitest";

const { getOptionalProfileSession, requireSession } = vi.hoisted(() => ({
  getOptionalProfileSession: vi.fn(),
  requireSession: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getOptionalProfileSession, requireSession }));

import { alphaAwarePageSession } from "../src/lib/alpha-access-server";

afterEach(() => {
  vi.unstubAllEnvs();
  getOptionalProfileSession.mockReset();
  requireSession.mockReset();
});
describe("alphaAwarePageSession", () => {
  it("keeps the persisted profile on an optional local session", async () => {
    vi.stubEnv("APP_ENV", "local");
    const session = {
      userId: "user-1",
      profile: {
        displayName: "Ryuk",
        avatar: { kind: "preset", preset: "ember" }
      }
    };
    getOptionalProfileSession.mockResolvedValue(session);

    await expect(alphaAwarePageSession("/discover")).resolves.toEqual(session);
    expect(getOptionalProfileSession).toHaveBeenCalledOnce();
    expect(requireSession).not.toHaveBeenCalled();
  });
});
