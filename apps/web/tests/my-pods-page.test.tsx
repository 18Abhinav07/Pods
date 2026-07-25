import { fireEvent, render, screen } from "@testing-library/react";
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
    }, {
      id: "pod-completed",
      state: "completed",
      templateId: "reading",
      contractData: { activity: { name: "Reading archive" } },
      draftData: {}
    }]),
    listMembershipsForUser: vi.fn(async () => [{
      pod: {
        id: "pod-settling",
        state: "final_review",
        templateId: "build",
        contractData: {
          activity: { name: "Settlement build" },
          settlementMode: "proportional"
        }
      },
      membership: {
        id: "membership-settling",
        state: "active",
        depositIntentId: "intent-1"
      },
      settlement: { state: "executing" },
      entitlement: { state: "transfer_queued", payoutLuna: 20_000 },
      payoutTransfer: {
        type: "payout",
        state: "queued",
        amountLuna: 20_000
      }
    }])
  }
}));

import MyPodsPage from "../src/app/my-pods/page";

describe("MyPodsPage creator routing", () => {
  it("opens the Pod room for a locked activity", async () => {
    render(await MyPodsPage());

    expect(screen.getByRole("link", { name: /Ship together/i }))
      .toHaveAttribute("href", "/pods/pod-locked/room");
    expect(screen.getByText("Roster locked")).toBeVisible();
    expect(screen.getByRole("link", { name: /Reading archive/i }))
      .toHaveAttribute("href", "/pods/pod-completed/room");
    expect(screen.getByText("Completed")).toBeVisible();
    expect(screen.getByRole("link", { name: /Settlement build/i }))
      .toHaveAttribute("href", "/pods/pod-settling/settlement");
    expect(screen.getByText("Payout queued")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Create a Pod" }))
      .not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open page actions" }));
    expect(screen.getByRole("link", { name: "Create a Pod" }))
      .toHaveAttribute("href", "/pods/create/template");
  });
});
