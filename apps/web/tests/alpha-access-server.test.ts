import { afterEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession, getOptionalProfileSession, requireSession } = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getOptionalProfileSession: vi.fn(),
  requireSession: vi.fn()
}));

vi.mock("../src/lib/session", () => ({
  getCurrentSession,
  getOptionalProfileSession,
  requireSession
}));

import {
  alphaAwarePageSession,
  publicPodPageSession
} from "../src/lib/alpha-access-server";

afterEach(() => {
  vi.unstubAllEnvs();
  getCurrentSession.mockReset();
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

  it("never enforces alpha access or profile onboarding for a public Pod read", async () => {
    vi.stubEnv("APP_ENV", "alpha");
    getCurrentSession.mockResolvedValue(null);

    await expect(publicPodPageSession()).resolves.toBeNull();

    expect(getCurrentSession).toHaveBeenCalledOnce();
    expect(getOptionalProfileSession).not.toHaveBeenCalled();
    expect(requireSession).not.toHaveBeenCalled();
  });
});
