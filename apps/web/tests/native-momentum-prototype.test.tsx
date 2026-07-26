import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  NativeMomentumPrototype,
  type NativeMomentumPreviewData
} from "../src/components/design-preview/native-momentum-prototype";

const previewData: NativeMomentumPreviewData = {
  databaseStatus: "connected",
  generatedAt: "2026-07-25T16:30:00.000Z",
  viewer: {
    displayName: "Ryuk",
    handle: "visual_47f390",
    avatarSeed: "Ryuk"
  },
  pods: [
    {
      id: "pod-1",
      name: "Pods in Pods",
      purpose: "Build the accountability product in public with the team.",
      templateId: "build",
      state: "active",
      stage: "live",
      totalNim: 0.3,
      occurrenceCount: 3,
      minParticipants: 2,
      maxParticipants: 5,
      visibility: "public",
      visitorsAllowed: true
    },
    {
      id: "pod-2",
      name: "Night Run Club",
      purpose: "Three focused evening runs with visible proof.",
      templateId: "fitness",
      state: "enrollment_open",
      stage: "open",
      totalNim: 0.6,
      occurrenceCount: 6,
      minParticipants: 3,
      maxParticipants: 12,
      visibility: "public",
      visitorsAllowed: true
    }
  ],
  people: [
    {
      displayName: "Ari Vale",
      handle: "arivale",
      avatarSeed: "Ari Vale",
      bio: "Shipping small products with careful craft."
    },
    {
      displayName: "Noah Mercer",
      handle: "noahmercer",
      avatarSeed: "Noah Mercer",
      bio: "Builder, runner, and public-work enthusiast."
    }
  ],
  roomEntries: [
    {
      id: "message-1",
      kind: "message",
      author: "Ari Vale",
      handle: "arivale",
      body: "The mobile proof flow is ready for a final pass.",
      time: "10:42 PM"
    },
    {
      id: "activity-1",
      kind: "activity",
      author: "Ryuk",
      handle: "visual_47f390",
      body: "Ship the compact Pod room and proof entry flow.",
      result: "The responsive room and submission path are ready.",
      status: "approved",
      time: "10:47 PM",
      artifactLabel: "Pull request 184"
    }
  ],
  finance: {
    commitmentNim: 0.3,
    returnedNim: 0.1,
    payoutNim: 0.4,
    bonusNim: 0.1,
    transactionHash: "a8f91d42f0c57f16d06e91125cbe18bfc52d58c1"
  }
};

describe("NativeMomentumPrototype", () => {
  it("renders current database content in the visitor discovery flow", () => {
    render(<NativeMomentumPrototype data={previewData} />);

    expect(screen.getByText("Live database preview")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Discover Pods" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Open Pods in Pods/ })).toBeVisible();
    expect(screen.getByText("Night Run Club")).toBeVisible();
  });

  it("walks through the participant commitment and proof flow using prototype actions", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(screen.getByRole("button", { name: "Participant" }));
    const startCommitment = await screen.findByRole("button", { name: "Start commitment" });
    await waitFor(() => expect(startCommitment).toBeVisible());
    fireEvent.click(startCommitment);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Name today’s ship" })).toBeVisible()
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue to proof type" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Choose the clearest proof" })).toBeVisible()
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Add what the creator can verify" })).toBeVisible()
    );

    fireEvent.click(screen.getByRole("button", { name: "Review submission" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ready for creator review" })).toBeVisible()
    );
  });

  it("exposes every actor flow and its independent screen inventory", () => {
    render(<NativeMomentumPrototype data={previewData} />);

    const actorNav = screen.getByRole("navigation", { name: "Preview actors" });
    for (const actor of [
      "Visitor",
      "Participant",
      "Creator",
      "Social",
      "Operations",
      "Onboarding"
    ]) {
      expect(within(actorNav).getByRole("button", { name: actor })).toBeVisible();
    }

    fireEvent.click(within(actorNav).getByRole("button", { name: "Creator" }));
    expect(screen.getByRole("button", { name: "Command center" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Applications" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Funding" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Review queue" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Review proof" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Settlement" })).toBeVisible();

    fireEvent.click(within(actorNav).getByRole("button", { name: "Operations" }));
    expect(screen.getByRole("button", { name: "Transfer queue" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Transfer detail" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Public safety" })).toBeVisible();
  });
});
