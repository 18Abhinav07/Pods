import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/enrollment-guards", () => ({
  requireEnrollmentOwner: vi.fn(async () => ({
    session: { userId: "creator-1" },
    pod: {
      id: "pod-1",
      state: "locked_scheduled",
      contractHash: "a".repeat(64),
      contractData: {
        activity: { name: "Ship together" },
        community: { visibility: "public" }
      }
    }
  }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    listApplicationsForCreator: vi.fn(async () => []),
    listInvitationsForCreator: vi.fn(async () => [])
  }
}));

import PodAdminPage from "../src/app/pods/[podId]/admin/page";

describe("PodAdminPage lifecycle state", () => {
  it("replaces enrollment controls with the locked Pod destination after cutoff", async () => {
    render(await PodAdminPage({ params: Promise.resolve({ podId: "pod-1" }) }));

    expect(screen.getByText("Roster locked")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open Pod room" }))
      .toHaveAttribute("href", "/pods/pod-1/today");
    expect(screen.queryByText("Share and recruit")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open public preview" })).not.toBeInTheDocument();
  });
});
