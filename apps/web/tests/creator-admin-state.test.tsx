import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireEnrollmentOwner = vi.hoisted(() => vi.fn());
const repository = vi.hoisted(() => ({
  listApplicationsForCreator: vi.fn(),
  listInvitationsForCreator: vi.fn(),
  listPendingReviewsForCreator: vi.fn()
}));

vi.mock("../src/lib/enrollment-guards", () => ({
  requireEnrollmentOwner
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: repository
}));

import PodAdminPage from "../src/app/pods/[podId]/admin/page";

describe("PodAdminPage lifecycle state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireEnrollmentOwner.mockResolvedValue({
    session: { userId: "creator-1" },
    pod: {
      id: "pod-1",
      state: "locked_scheduled",
      contractHash: "a".repeat(64),
      contractData: {
        activity: { name: "Ship together" },
        community: { visibility: "public" },
        verification: { verifier: "creator" }
      }
    }
    });
    repository.listApplicationsForCreator.mockResolvedValue([]);
    repository.listInvitationsForCreator.mockResolvedValue([]);
    repository.listPendingReviewsForCreator.mockResolvedValue([]);
  });

  it("replaces enrollment controls with the locked Pod destination after cutoff", async () => {
    render(await PodAdminPage({ params: Promise.resolve({ podId: "pod-1" }) }));

    expect(screen.getByText("Roster locked")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open Pod room" }))
      .toHaveAttribute("href", "/pods/pod-1/today");
    expect(screen.queryByText("Share and recruit")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open public preview" })).not.toBeInTheDocument();
  });

  it.each(["active", "final_review"])(
    "keeps the %s creator page as a proof command center",
    async (state) => {
      requireEnrollmentOwner.mockResolvedValue({
        session: { userId: "creator-1" },
        pod: {
          id: "pod-1",
          state,
          contractHash: "a".repeat(64),
          contractData: {
            activity: { name: "Ship together" },
            community: { visibility: "public" },
            verification: { verifier: "creator" }
          }
        }
      });
      repository.listPendingReviewsForCreator.mockResolvedValue([
        { submission: { id: "proof-1", state: "reviewing" } },
        { submission: { id: "proof-2", state: "reviewing" } }
      ]);

      render(await PodAdminPage({ params: Promise.resolve({ podId: "pod-1" }) }));

      expect(screen.getByText("Creator command center")).toBeVisible();
      expect(screen.getByRole("link", { name: "Review 2 proofs" }))
        .toHaveAttribute("href", "/pods/pod-1/admin/reviews");
      expect(screen.getByRole("link", { name: "Open Pod room" }))
        .toHaveAttribute("href", "/pods/pod-1/room");
      expect(screen.getByRole("link", { name: "View activity" }))
        .toHaveAttribute("href", "/pods/pod-1/activity");
      expect(screen.getByRole("link", { name: "View participant funding stages" }))
        .toHaveAttribute("href", "/pods/pod-1/admin/funding");
      expect(screen.getByRole("link", { name: "Review frozen rules" }))
        .toHaveAttribute("href", "/pods/pod-1/rules");
      expect(screen.queryByRole("link", { name: /fund your|fund commitment/i }))
        .not.toBeInTheDocument();
      expect(repository.listPendingReviewsForCreator).toHaveBeenCalledWith({
        creatorUserId: "creator-1",
        podId: "pod-1"
      });
    }
  );

  it("does not send a legacy verifier Pod to a creator-only review queue", async () => {
    requireEnrollmentOwner.mockResolvedValue({
      session: { userId: "creator-1" },
      pod: {
        id: "pod-1",
        state: "active",
        contractHash: "a".repeat(64),
        contractData: {
          activity: { name: "Ship together" },
          community: { visibility: "public" },
          verification: { verifier: "pods_team" }
        }
      }
    });
    repository.listPendingReviewsForCreator.mockResolvedValue(null);

    render(await PodAdminPage({ params: Promise.resolve({ podId: "pod-1" }) }));

    expect(screen.getByText("Creator command center")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Review \d+ proofs?/ }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Pod room" }))
      .toHaveAttribute("href", "/pods/pod-1/room");
    expect(repository.listPendingReviewsForCreator).not.toHaveBeenCalled();
  });
});
