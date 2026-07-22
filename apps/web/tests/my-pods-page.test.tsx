import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "creator-1" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    listPodsForOwner: vi.fn(async () => [{
      id: "pod-locked",
      state: "locked_scheduled",
      templateId: "build",
      contractData: { activity: { name: "Ship together" } },
      draftData: {}
    }]),
    listMembershipsForUser: vi.fn(async () => [])
  }
}));

import MyPodsPage from "../src/app/my-pods/page";

describe("MyPodsPage creator routing", () => {
  it("opens the Pod room for a locked activity", async () => {
    render(await MyPodsPage());

    expect(screen.getByRole("link", { name: /Ship together/i }))
      .toHaveAttribute("href", "/pods/pod-locked/room");
    expect(screen.getByText("Roster locked")).toBeVisible();
    expect(screen.getByRole("link", { name: "Create a Pod" }))
      .toHaveAttribute("href", "/pods/create/template");
  });
});
