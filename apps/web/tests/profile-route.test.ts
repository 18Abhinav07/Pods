import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession, getProfileForUser, saveProfile } = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getProfileForUser: vi.fn(),
  saveProfile: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { getProfileForUser, saveProfile }
}));

import { GET, PUT } from "../src/app/api/profile/route";

const validProfile = {
  handle: "abhinav_07",
  displayName: "Abhinav",
  bio: "Building Pods in public.",
  avatar: { kind: "preset", preset: "ember" },
  visibility: "public",
  dmPolicy: "requests",
  activityStatusVisible: true
};

describe("profile API", () => {
  beforeEach(() => {
    getCurrentSession.mockReset();
    getProfileForUser.mockReset();
    saveProfile.mockReset();
    getCurrentSession.mockResolvedValue({ userId: "user-1" });
  });

  it("requires a wallet session", async () => {
    getCurrentSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(
      (
        await PUT(
          new Request("http://localhost/api/profile", {
            method: "PUT",
            body: JSON.stringify(validProfile)
          })
        )
      ).status
    ).toBe(401);
  });

  it("returns a field error contract for invalid onboarding data", async () => {
    const response = await PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...validProfile, handle: "A!" })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      errors: {
        handle: "Use 3 to 20 lowercase letters, numbers, or underscores"
      }
    });
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("persists a validated profile and maps a handle collision", async () => {
    saveProfile.mockResolvedValueOnce({ userId: "user-1", ...validProfile });
    const saved = await PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validProfile)
      })
    );
    expect(saved.status).toBe(200);
    expect(saveProfile).toHaveBeenCalledWith("user-1", validProfile);

    saveProfile.mockRejectedValueOnce(new Error("Profile handle is already taken"));
    const collision = await PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validProfile)
      })
    );
    expect(collision.status).toBe(409);
    await expect(collision.json()).resolves.toEqual({
      errors: { handle: "Profile handle is already taken" }
    });
  });

  it("returns only the connected user's private profile", async () => {
    getProfileForUser.mockResolvedValue({ userId: "user-1", ...validProfile });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      profile: { userId: "user-1", ...validProfile }
    });
  });
});
