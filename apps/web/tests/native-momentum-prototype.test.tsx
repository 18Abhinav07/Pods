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
      visitorsAllowed: true,
      source: "live"
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
      visitorsAllowed: true,
      source: "live"
    }
  ],
  people: [
    {
      displayName: "Ari Vale",
      handle: "arivale",
      avatarSeed: "Ari Vale",
      bio: "Shipping small products with careful craft.",
      source: "live"
    },
    {
      displayName: "Noah Mercer",
      handle: "noahmercer",
      avatarSeed: "Noah Mercer",
      bio: "Builder, runner, and public-work enthusiast.",
      source: "live"
    }
  ],
  roomEntries: [
    {
      id: "message-1",
      kind: "message",
      author: "Ari Vale",
      handle: "arivale",
      body: "The mobile proof flow is ready for a final pass.",
      time: "10:42 PM",
      source: "live"
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
      artifactLabel: "Pull request 184",
      source: "live"
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
    expect(screen.getByRole("button", { name: "Application detail" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Funding" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Review queue" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Review proof" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Settlement" })).toBeVisible();

    fireEvent.click(within(actorNav).getByRole("button", { name: "Operations" }));
    expect(screen.getByRole("button", { name: "Transfer queue" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Transfer detail" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Public safety" })).toBeVisible();
  });

  it("keeps creator application decisions on a focused detail screen", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    const actorNav = screen.getByRole("navigation", { name: "Preview actors" });
    fireEvent.click(within(actorNav).getByRole("button", { name: "Creator" }));
    fireEvent.click(screen.getByRole("button", { name: "Applications" }));

    expect(screen.queryByRole("button", { name: "Accept applicant" })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /Review Ari Vale/ }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ari Vale" })).toBeVisible()
    );
    expect(screen.getByText("Why do you want to join?")).toBeVisible();
    expect(screen.getByRole("button", { name: "Accept application" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Decline application" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Applications" }));
    fireEvent.click(await screen.findByRole("button", { name: /Review Noah Mercer/ }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Noah Mercer" })).toBeVisible()
    );
  });

  it("keeps onboarding choices explicit and interactive", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    const actorNav = screen.getByRole("navigation", { name: "Preview actors" });
    fireEvent.click(within(actorNav).getByRole("button", { name: "Onboarding" }));
    fireEvent.click(screen.getByRole("button", { name: "Avatar" }));

    const firstPortrait = await screen.findByRole("button", { name: "Choose portrait 1" });
    const secondPortrait = screen.getByRole("button", { name: "Choose portrait 2" });
    expect(firstPortrait).toHaveAttribute("aria-pressed", "true");
    expect(secondPortrait).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(secondPortrait);
    expect(firstPortrait).toHaveAttribute("aria-pressed", "false");
    expect(secondPortrait).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Upload your own photo/ })).toBeInTheDocument();
  });

  it("carries proof visibility choices into the review screen", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    const actorNav = screen.getByRole("navigation", { name: "Preview actors" });
    fireEvent.click(within(actorNav).getByRole("button", { name: "Participant" }));
    fireEvent.click(screen.getByRole("button", { name: "Proof type" }));
    fireEvent.click(await screen.findByRole("button", { name: /Image evidence/ }));

    fireEvent.click(screen.getByRole("button", { name: "Evidence" }));
    fireEvent.click(await screen.findByRole("button", { name: "Share with Pod" }));

    fireEvent.click(screen.getByRole("button", { name: "Review proof" }));
    expect(await screen.findByText("Image evidence")).toBeInTheDocument();
    expect(screen.getByText("1 Pod-shared image")).toBeInTheDocument();
  });

  it("keeps creation choices and live NIM math connected to publish review", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    const actorNav = screen.getByRole("navigation", { name: "Preview actors" });
    fireEvent.click(within(actorNav).getByRole("button", { name: "Onboarding" }));
    fireEvent.click(screen.getByRole("button", { name: "Template" }));
    fireEvent.click(await screen.findByRole("button", { name: /Fitness & Movement/ }));

    fireEvent.click(screen.getByRole("button", { name: "Community" }));
    fireEvent.click(await screen.findByRole("button", { name: /Private Pod/ }));

    fireEvent.click(screen.getByRole("button", { name: "NIM commitment" }));
    const amount = await screen.findByRole("textbox", { name: "Per occurrence" });
    fireEvent.change(amount, { target: { value: "0.2" } });
    expect(screen.getByText("0.6 NIM")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publish review" }));
    expect(await screen.findByText("Fitness & Movement")).toBeInTheDocument();
    expect(screen.getByText("Private · Invitations · Members only")).toBeInTheDocument();
    expect(screen.getByText("0.6 NIM maximum per participant")).toBeInTheDocument();
  });
});
