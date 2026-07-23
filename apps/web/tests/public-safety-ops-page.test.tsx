import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireOpsSession = vi.hoisted(() => vi.fn());
const listPublicSafetyReports = vi.hoisted(() => vi.fn());
const listPublicModerationActions = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/ops-session", () => ({ requireOpsSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    listPublicSafetyReports,
    listPublicModerationActions
  }
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

import PublicSafetyPage from "../src/app/ops/public-safety/page";

describe("public safety operations page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOpsSession.mockResolvedValue({ reviewerId: "pods-safety" });
    listPublicSafetyReports.mockResolvedValue([{
      id: "430296c7-9554-43e6-9b43-bfd063391028",
      podId: "11111111-1111-4111-8111-111111111111",
      targetKind: "message",
      targetId: "22222222-2222-4222-8222-222222222222",
      reason: "unsafe_content",
      details: "This message needs a safety review.",
      state: "pending",
      createdAt: new Date("2027-04-05T12:00:00.000Z")
    }]);
    listPublicModerationActions.mockResolvedValue([{
      id: "action-1",
      action: "restore_room",
      reason: "Review complete.",
      actor: "pods-safety",
      createdAt: new Date("2027-04-05T11:00:00.000Z")
    }]);
  });

  it("shows pending reports and the append-only action history", async () => {
    render(await PublicSafetyPage());

    expect(screen.getByRole("heading", { name: "1 waiting." })).toBeVisible();
    expect(screen.getByText("This message needs a safety review.")).toBeVisible();
    expect(screen.getByText("restore room")).toBeVisible();
    expect(screen.getByRole("button", { name: "Apply action" })).toBeVisible();
  });
});
