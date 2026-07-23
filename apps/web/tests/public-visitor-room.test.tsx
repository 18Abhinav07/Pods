import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PublicVisitorRoom,
  type PublicVisitorRoomData
} from "../src/components/public-visitor-room";

const room: PublicVisitorRoomData = {
  pod: {
    id: "11111111-1111-4111-8111-111111111111",
    stage: "live",
    state: "active",
    templateId: "build",
    name: "Build Pods in public",
    purpose: "Ship a working accountability room with the community watching.",
    roomState: "open",
    participantCount: 4,
    occurrenceCount: 8,
    creator: {
      handle: "abhinav",
      displayName: "Abhinav",
      avatar: { kind: "preset", preset: "ember" },
      profileVisibility: "public"
    }
  },
  changeCursor: 1,
  lastSequence: 1,
  messages: [{
    id: "message-1",
    sequence: 1,
    kind: "activity",
    body: null,
    reply: null,
    hidden: false,
    pinned: false,
    createdAt: "2026-07-23T08:00:00.000Z",
    sender: {
      handle: "abhinav",
      displayName: "Abhinav",
      avatar: { kind: "preset", preset: "ember" },
      profileVisibility: "public"
    },
    activity: {
      occurrenceOrdinal: 1,
      localDate: "2026-07-23",
      task: "Publish the visitor room",
      deliverableType: "Working route",
      state: "approved",
      submissionId: "22222222-2222-4222-8222-222222222222",
      resultSummary: "The room is live and read only.",
      artifactUrl: "https://example.com/build",
      supportingImageAvailable: false
    },
    reactions: [{ code: "support", count: 3 }]
  }]
};

describe("PublicVisitorRoom", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a visual read-only room without participant controls", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<PublicVisitorRoom initial={room} />);

    expect(screen.getByRole("img", { name: "Build & Ship activity" })).toHaveAttribute(
      "src",
      expect.stringContaining("build-workspace.jpg")
    );
    expect(screen.getByText("Public gallery")).toBeVisible();
    expect(screen.getByText("Publish the visitor room")).toBeVisible();
    expect(screen.getByText("Support 3")).toBeVisible();
    expect(screen.getByText("Visitors can watch, not participate")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Support/i })).not.toBeInTheDocument();
  });

  it("shows a terminal proof status without rendering a private rejection reason", () => {
    const privateReason = "The private reviewer evidence did not match the locked task.";
    const rejectedRoom = {
      ...room,
      messages: room.messages.map((message) => ({
        ...message,
        activity: message.activity ? {
          ...message.activity,
          state: "rejected",
          reviewDecisionNote: privateReason
        } : null
      }))
    } as unknown as PublicVisitorRoomData;
    vi.stubGlobal("fetch", vi.fn());

    render(<PublicVisitorRoom initial={rejectedRoom} />);

    expect(screen.getByText("Not verified")).toBeVisible();
    expect(screen.queryByText(privateReason)).not.toBeInTheDocument();
  });

  it("lets a signed visitor privately report public content without gaining room controls", async () => {
    const request = vi.fn(async () =>
      new Response(JSON.stringify({ report: { id: "report-1", state: "pending" } }), {
        status: 201
      })
    );
    vi.stubGlobal("fetch", request);
    render(<PublicVisitorRoom canReport initial={room} reportingEnabled />);

    fireEvent.click(screen.getByRole("button", { name: "Report proof by Abhinav" }));
    expect(screen.getByRole("dialog", { name: "Report public content" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("What happened?"), {
      target: { value: "This proof needs a safety review." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Send private report" }));

    await waitFor(() => expect(screen.getByText("Report received")).toBeVisible());
    expect(request).toHaveBeenCalledWith(
      `/api/public/pods/${room.pod.id}/reports`,
      expect.objectContaining({ method: "POST" })
    );
    expect(screen.queryByRole("textbox", { name: "Message" })).not.toBeInTheDocument();
  });
});
