import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchPublicProfiles } = vi.hoisted(() => ({
  searchPublicProfiles: vi.fn()
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({
    userId: "user-1",
    profile: {
      displayName: "Ryuk",
      avatar: { kind: "preset", preset: "ember" }
    }
  }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { searchPublicProfiles }
}));

import PeopleSearchPage from "../src/app/people/search/page";

describe("PeopleSearchPage", () => {
  beforeEach(() => searchPublicProfiles.mockReset());

  it("does not enumerate members before a two-character query", async () => {
    render(await PeopleSearchPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Find people" })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Search by name or handle" })).toBeVisible();
    expect(screen.getByText("Type at least 2 characters.")).toBeVisible();
    expect(searchPublicProfiles).not.toHaveBeenCalled();
  });

  it("renders bounded public-profile results for a submitted query", async () => {
    searchPublicProfiles.mockResolvedValue([
      {
        handle: "mira_moves",
        displayName: "Mira",
        bio: "Running before sunrise.",
        avatar: { kind: "preset", preset: "moss" },
        activityStatusVisible: true
      }
    ]);
    const { container } = render(
      await PeopleSearchPage({
        searchParams: Promise.resolve({ q: "mi" })
      })
    );

    expect(searchPublicProfiles).toHaveBeenCalledWith({ query: "mi", limit: 20 });
    expect(screen.getByRole("link", { name: /Mira/ })).toHaveAttribute(
      "href",
      "/u/mira_moves"
    );
    expect(container.querySelector(".public-profile-card")).toHaveClass("is-search-result");
    expect(screen.queryByText("Running before sunrise.")).not.toBeInTheDocument();
    expect(screen.queryByText("View")).not.toBeInTheDocument();
  });
});
