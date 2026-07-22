import { describe, expect, it } from "vitest";

import {
  normalizeProfileHandle,
  publicProfileProjection,
  validateProfileInput
} from "../src/social";

describe("profile identity contract", () => {
  it("normalizes a handle and accepts the complete onboarding contract", () => {
    expect(normalizeProfileHandle("  Abhinav_07 ")).toBe("abhinav_07");
    expect(
      validateProfileInput({
        handle: "  Abhinav_07 ",
        displayName: "Abhinav",
        bio: "Building Pods in public with a focused Nimiq community.",
        avatar: { kind: "preset", preset: "ember" },
        visibility: "public",
        dmPolicy: "requests",
        activityStatusVisible: true
      })
    ).toEqual({
      success: true,
      value: {
        handle: "abhinav_07",
        displayName: "Abhinav",
        bio: "Building Pods in public with a focused Nimiq community.",
        avatar: { kind: "preset", preset: "ember" },
        visibility: "public",
        dmPolicy: "requests",
        activityStatusVisible: true
      }
    });
  });

  it("rejects invalid handles and profile fields with stable field errors", () => {
    expect(
      validateProfileInput({
        handle: "A!",
        displayName: "",
        bio: "x".repeat(161),
        avatar: { kind: "preset", preset: "unknown" },
        visibility: "everyone",
        dmPolicy: "open",
        activityStatusVisible: "yes"
      })
    ).toEqual({
      success: false,
      errors: {
        handle: "Use 3 to 20 lowercase letters, numbers, or underscores",
        displayName: "Add a display name in 2 to 40 characters",
        bio: "Keep your bio within 160 characters",
        avatar: "Choose a Pods avatar or upload a supported image",
        visibility: "Choose whether your profile is public or private",
        dmPolicy: "Choose who can send you a message request",
        activityStatusVisible: "Choose whether your activity status is visible"
      }
    });
  });

  it("projects a public profile without wallet or internal identity fields", () => {
    const projection = publicProfileProjection({
      userId: "user-secret",
      walletAddress: "NQ00 SECRET WALLET",
      handle: "abhinav_07",
      displayName: "Abhinav",
      bio: "Building in public.",
      avatar: { kind: "preset", preset: "ember" },
      visibility: "public",
      dmPolicy: "requests",
      activityStatusVisible: true,
      createdAt: new Date("2026-07-21T00:00:00.000Z"),
      updatedAt: new Date("2026-07-21T00:00:00.000Z")
    });

    expect(projection).toEqual({
      handle: "abhinav_07",
      displayName: "Abhinav",
      bio: "Building in public.",
      avatar: { kind: "preset", preset: "ember" },
      activityStatusVisible: true
    });
    expect(projection).not.toHaveProperty("userId");
    expect(projection).not.toHaveProperty("walletAddress");
    expect(projection).not.toHaveProperty("dmPolicy");
  });
});
