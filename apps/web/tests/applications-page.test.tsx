import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "participant-1" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    listApplicationsForUser: vi.fn(async () => [{
      application: {
        id: "application-1",
        podId: "pod-1",
        state: "application_expired",
        updatedAt: new Date("2027-03-08T00:00:00.000Z")
      },
      pod: {
        id: "pod-1",
        state: "cancelled",
        contractData: { activity: { name: "Refunded builders" } }
      }
    }]),
    listMembershipsForUser: vi.fn(async () => [{
      membership: {
        id: "membership-1",
        podId: "pod-1",
        applicationId: "application-1",
        state: "refunded",
        depositIntentId: "intent-1"
      },
      pod: { id: "pod-1" }
    }])
  }
}));

import ApplicationsPage from "../src/app/applications/page";

describe("ApplicationsPage", () => {
  it("uses the authoritative refunded membership outcome after cutoff cancellation", async () => {
    render(await ApplicationsPage({ searchParams: Promise.resolve({ pod: "pod-1" }) }));

    expect(screen.getByText("Refund completed")).toBeVisible();
    expect(screen.getByText("Your commitment was returned")).toBeVisible();
    expect(screen.getByRole("link", { name: "View receipt" }))
      .toHaveAttribute("href", "/pods/pod-1/today");
    expect(screen.queryByText(/creator cancelled this Pod before funding/i)).not.toBeInTheDocument();
  });
});
