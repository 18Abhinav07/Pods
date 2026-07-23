import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listMembershipsForUser: vi.fn(),
  listApplicationsForCreator: vi.fn(),
  listPodsForOwner: vi.fn(),
  listCurrentActivitiesForUser: vi.fn(),
  listPendingReviewsForCreator: vi.fn(),
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
    repositoryMocks.listPendingReviewsForCreator.mockResolvedValue([]);
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

  it("prioritizes the first owned creator-verifier Pod with pending proofs", async () => {
    repositoryMocks.listPodsForOwner.mockResolvedValue([
      {
        id: "legacy-verifier",
        state: "active",
        templateId: "build",
        contractData: {
          activity: { name: "Legacy review" },
          verification: { verifier: "pods_team" }
        }
      },
      {
        id: "creator-proof-pod",
        state: "active",
        templateId: "build",
        contractData: {
          activity: { name: "Pods in Pods" },
          verification: { verifier: "creator" }
        }
      },
      {
        id: "later-proof-pod",
        state: "final_review",
        templateId: "build",
        contractData: {
          activity: { name: "Later Pod" },
          verification: { verifier: "creator" }
        }
      }
    ]);
    repositoryMocks.listPendingReviewsForCreator.mockResolvedValueOnce([
      { submission: { id: "proof-1", state: "reviewing" } }
    ]);

    render(await TodayPage());

    expect(screen.getByText("Proofs waiting")).toBeVisible();
    expect(screen.getByText("Members are waiting for your review.")).toBeVisible();
    expect(screen.getByText(
      "Compare each proof with its locked commitment and record one final result."
    )).toBeVisible();
    expect(screen.getByRole("link", { name: "Review proofs" }))
      .toHaveAttribute("href", "/pods/creator-proof-pod/admin/reviews");
    expect(repositoryMocks.listPendingReviewsForCreator).toHaveBeenCalledTimes(1);
    expect(repositoryMocks.listPendingReviewsForCreator).toHaveBeenCalledWith({
      creatorUserId: "user-1",
      podId: "creator-proof-pod"
    });
  });
});
