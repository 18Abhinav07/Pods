import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { listPublicPodDirectory, listMembershipsForUser } = vi.hoisted(() => ({
  listPublicPodDirectory: vi.fn(async () => [
    {
      id: "pod-1",
      creatorUserId: "creator-1",
      templateId: "build",
      stage: "open",
      contractData: {
        activity: {
          name: "Ship Together",
          purpose: "Build one visible improvement.",
          startDate: "2027-03-01",
          endDate: "2027-03-07"
        },
        commitment: { occurrenceCount: 3, totalLuna: 300_000 },
        community: { visibility: "public", minParticipants: 2, maxParticipants: 8 }
      }
    }
  ]),
  listMembershipsForUser: vi.fn(async () => [])
}));

vi.mock("../src/lib/alpha-access-server", () => ({
  alphaAwarePageSession: vi.fn(async () => ({
    userId: "viewer-1",
    profile: {
      displayName: "Ryuk",
      avatar: { kind: "preset", preset: "ember" }
    }
  }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { listPublicPodDirectory, listMembershipsForUser }
}));

import DiscoverPage from "../src/app/discover/page";

describe("DiscoverPage", () => {
  it("is Pod-only and preserves the connected profile identity", async () => {
    render(await DiscoverPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Discover" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Ryuk avatar" })).toBeVisible();
    expect(screen.getByText(/Apply to open groups or watch visitor-enabled Pods/)).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "Discover sections" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "People" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Following" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pod lifecycle" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Ship Together" })).toBeVisible();
  });
});
