import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/session", () => ({
  getCurrentSession: vi.fn(async () => ({ userId: "viewer" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getSocialProfilePresence: vi.fn(async () => ({
      kind: "public",
      profile: {
        handle: "ryuk_builds",
        displayName: "Ryuk",
        bio: "Building Pods in public.",
        avatar: { kind: "preset", preset: "ember" },
        activityStatusVisible: true
      },
      counts: { followers: 17, following: 9 },
      relationship: { self: true, following: false, friend: false, request: null },
      messageRequestsAllowed: false
    }))
  }
}));

import PublicProfilePage from "../src/app/u/[handle]/page";

describe("PublicProfilePage", () => {
  it("uses an image-led searched profile with identity, stats, and actions in one hierarchy", async () => {
    const { container } = render(await PublicProfilePage({ params: Promise.resolve({ handle: "ryuk_builds" }) }));

    expect(container.querySelector(".public-profile-cover")).toHaveClass("is-profile-showcase");
    expect(screen.getByRole("img", { name: "Ryuk avatar" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ryuk" })).toBeVisible();
    expect(screen.getByText("17")).toBeVisible();
    expect(container.querySelectorAll(".public-profile-stats article")).toHaveLength(0);
    expect(container.querySelector(".public-profile-cover .public-profile-stats")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find people" })).toHaveAttribute("href", "/people/search");
  });
});
