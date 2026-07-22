import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listMembershipsForUser: vi.fn(),
  listApplicationsForCreator: vi.fn(),
  listPodsForOwner: vi.fn(),
  listCurrentActivitiesForUser: vi.fn(),
  getEffectiveTime: vi.fn()
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({
    userId: "user-1",
    walletAddress: "NQ00 HAPPY PATH WALLET"
  }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: repositoryMocks
}));

import TodayPage from "../src/app/today/page";

describe("TodayPage wallet identity", () => {
  beforeEach(() => {
    repositoryMocks.listMembershipsForUser.mockResolvedValue([]);
    repositoryMocks.listApplicationsForCreator.mockResolvedValue([]);
    repositoryMocks.listPodsForOwner.mockResolvedValue([]);
    repositoryMocks.listCurrentActivitiesForUser.mockResolvedValue([]);
    repositoryMocks.getEffectiveTime.mockResolvedValue(new Date("2027-04-05T08:00:00.000Z"));
  });

  it("opens the private profile from the wallet chip", async () => {
    render(await TodayPage());

    expect(screen.getByRole("link", { name: "Open wallet profile" })).toHaveAttribute(
      "href",
      "/profile"
    );
  });

  it("opens a roster-locked creator Pod instead of returning to enrollment funding", async () => {
    repositoryMocks.listPodsForOwner.mockResolvedValue([{
      id: "pod-locked",
      state: "locked_scheduled",
      templateId: "build",
      contractData: { activity: { name: "Ship together" } }
    }]);

    render(await TodayPage());

    expect(screen.getByRole("link", { name: "Open Pod room" }))
      .toHaveAttribute("href", "/pods/pod-locked/room");
    expect(screen.queryByRole("link", { name: "View all My Pods" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Pods" }))
      .toHaveAttribute("href", "/my-pods");
    expect(screen.queryByText("Open funding overview")).not.toBeInTheDocument();
  });
});
