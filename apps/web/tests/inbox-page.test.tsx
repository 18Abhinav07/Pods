import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "user-1" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    listInboxTimelineForUser: vi.fn(async () => [
      {
        membership: {
          id: "membership-1",
          podId: "pod-1",
          state: "roster_locked",
          admissionSource: "public_application",
          applicationId: "application-1",
          invitationId: null,
          depositIntentId: "deposit-1",
          acceptedAt: new Date("2027-03-07T00:00:00.000Z"),
          createdAt: new Date("2027-03-06T00:00:00.000Z"),
          updatedAt: new Date("2027-03-08T00:00:00.000Z")
        },
        pod: { id: "pod-1", contractData: { activity: { name: "Ship Pods in Public" } } },
        application: {
          id: "application-1",
          state: "application_expired",
          createdAt: new Date("2027-03-06T00:00:00.000Z"),
          decidedAt: new Date("2027-03-07T00:00:00.000Z"),
          updatedAt: new Date("2027-03-08T00:00:00.000Z")
        },
        deposit: {
          id: "deposit-1",
          state: "applied_to_roster",
          transactionHash: "a".repeat(64),
          createdAt: new Date("2027-03-07T01:00:00.000Z"),
          observedAt: new Date("2027-03-07T01:01:00.000Z"),
          finalizedAt: new Date("2027-03-07T01:05:00.000Z"),
          creditedAt: new Date("2027-03-07T01:06:00.000Z")
        },
        transfer: null
      },
      {
        membership: {
          id: "membership-2",
          podId: "pod-2",
          state: "accepted_unfunded",
          admissionSource: "public_application",
          applicationId: "application-2",
          invitationId: null,
          depositIntentId: null,
          acceptedAt: new Date("2027-03-07T00:00:00.000Z"),
          createdAt: new Date("2027-03-06T00:00:00.000Z"),
          updatedAt: new Date("2027-03-07T00:00:00.000Z")
        },
        pod: { id: "pod-2", contractData: { activity: { name: "Read Together" } } },
        application: {
          id: "application-2",
          state: "accepted_unfunded",
          createdAt: new Date("2027-03-06T00:00:00.000Z"),
          decidedAt: new Date("2027-03-07T00:00:00.000Z"),
          updatedAt: new Date("2027-03-07T00:00:00.000Z")
        },
        deposit: null,
        transfer: null
      }
    ])
  }
}));

import UpdatesPage from "../src/app/updates/page";

describe("UpdatesPage", () => {
  it("renders durable lifecycle events with canonical deep links", async () => {
    render(await UpdatesPage());

    expect(screen.getByRole("heading", { name: "Updates" })).toBeVisible();
    expect(screen.getByText("Place secured").closest("a"))
      .toHaveAttribute("href", "/pods/pod-1/today");
    expect(screen.getAllByText("Application accepted").at(-1)?.closest("a"))
      .toHaveAttribute("href", "/pods/pod-2/fund");
    expect(screen.queryByText("Nothing needs attention.")).not.toBeInTheDocument();
    expect(screen.queryByText("Funding submitted")).not.toBeInTheDocument();
    expect(screen.queryByText("Payment found")).not.toBeInTheDocument();
    expect(screen.queryByText("Payment finalized")).not.toBeInTheDocument();
  });
});
