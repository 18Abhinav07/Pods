import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

vi.mock("../src/lib/enrollment-guards", () => ({
  requireEnrollmentOwner: vi.fn(async () => ({
    session: { userId: "creator-1" },
    pod: {
      id: "pod-1",
      contractData: {
        activity: { name: "Pods in Pods" },
        community: { visibility: "public" }
      }
    }
  }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    listApplicationsForCreator: vi.fn(async () => [
      {
        application: {
          id: "application-1",
          applicantUserId: "64cbc2dc-73bf-4ff5-af72-0a18be9e92c9",
          state: "applied",
          answers: [
            { question: "What will you build?", answer: "A reliable visitor room." }
          ]
        },
        applicantProfile: {
          handle: "ryuk",
          displayName: "Ryuk",
          bio: "Building Pods with the Nimiq community.",
          avatar: { kind: "preset", preset: "moss" }
        },
        pod: { id: "pod-1" }
      }
    ])
  }
}));

import AdminApplicationsPage from "../src/app/pods/[podId]/admin/applications/page";

describe("AdminApplicationsPage", () => {
  it("shows the applicant profile instead of a wallet-derived builder label", async () => {
    render(
      await AdminApplicationsPage({
        params: Promise.resolve({ podId: "pod-1" })
      })
    );

    expect(screen.getByText("Ryuk")).toBeVisible();
    expect(screen.getByText("@ryuk")).toBeVisible();
    expect(screen.getByText("Building Pods with the Nimiq community.")).toBeVisible();
    expect(screen.getByLabelText("Ryuk avatar")).toBeVisible();
    expect(screen.queryByText("Builder 64CBC2")).not.toBeInTheDocument();
  });
});
