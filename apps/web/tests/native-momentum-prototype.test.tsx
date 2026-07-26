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

    expect(
      screen.getByText("Live public data with simulated journey fixtures")
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Discover Pods" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Open Pods in Pods/ })).toBeVisible();
    expect(screen.getByText("Night Run Club")).toBeVisible();
  });

  it.each([320, 390])(
    "exposes actor and scenario controls from the compact mobile companion at %ipx",
    (width) => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width
    });
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open preview controls" })
    );
    const companion = screen.getByRole("dialog", {
      name: "Preview controls"
    });
    expect(
      within(companion).getByRole("group", { name: "Preview actor" })
    ).toBeVisible();
    expect(
      within(companion).getByRole("combobox", { name: "Mobile visual state" })
    ).toBeVisible();

    fireEvent.click(
      within(companion).getByRole("button", { name: "Creator" })
    );
    expect(
      screen.getByRole("heading", { name: "Creator journey" })
    ).toBeVisible();
    }
  );

  it("renders wallet signature and onboarding completion handoffs", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(screen.getByRole("button", { name: "Onboarding" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Wallet" })
      ).toBeVisible()
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Connect Nimiq wallet" })
    );
    expect(
      screen.getByRole("heading", { name: "Signature Waiting" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Profile Privacy" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Choose what people can discover"
        })
      ).toBeVisible()
    );
    fireEvent.click(screen.getByRole("button", { name: "Enter Pods" }));
    expect(
      screen.getByRole("heading", { name: "Setup Complete" })
    ).toBeVisible();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Enter Pods" })
      ).toBeVisible()
    );
    fireEvent.click(screen.getByRole("button", { name: "Enter Pods" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Today" })
    ).toBeVisible();
  });

  it("renders the complete applicant to Pod room actor handoff", () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(screen.getByRole("button", { name: "Applicant" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Application Pending" })
    );

    for (const actionId of ["accepted", "review-contract"]) {
      fireEvent.click(
        screen.getByRole("button", {
          name: `Run transition ${actionId}`
        })
      );
    }
    expect(
      screen.getByRole("heading", { name: "Accepted journey" })
    ).toBeVisible();

    for (const actionId of [
      "accept-contract",
      "continue",
      "confirm",
      "submitted",
      "observed",
      "finalized",
      "credited",
      "wait-cutoff"
    ]) {
      fireEvent.click(
        screen.getByRole("button", {
          name: `Run transition ${actionId}`
        })
      );
    }
    expect(
      screen.getByRole("heading", { name: "Waiting journey" })
    ).toBeVisible();

    for (const actionId of ["cutoff-locked", "enter-room"]) {
      fireEvent.click(
        screen.getByRole("button", {
          name: `Run transition ${actionId}`
        })
      );
    }
    expect(
      screen.getByRole("heading", { name: "Participant journey" })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Pod Room" })).toBeVisible();
  });

  it("renders creator approval and rejection outcomes", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(screen.getByRole("button", { name: "Creator" }));
    fireEvent.click(screen.getByRole("button", { name: "Review proof" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Review proof" })
      ).toBeVisible()
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve proof" }));
    expect(
      screen.getByRole("heading", { name: "Proof Approved" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Review proof" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Reject proof" })
      ).toBeVisible()
    );
    fireEvent.click(screen.getByRole("button", { name: "Reject proof" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Proof Rejected" })
    ).toBeVisible();
  });

  it("keeps invented journey records on fictional actors when live people exist", async () => {
    const liveData = {
      ...previewData,
      people: [
        {
          displayName: "Real Builder",
          handle: "realbuilder",
          avatarSeed: "Real Builder",
          bio: "This is a live public profile.",
          source: "live" as const
        }
      ]
    } as NativeMomentumPreviewData;
    render(<NativeMomentumPrototype data={liveData} />);

    fireEvent.click(screen.getByRole("button", { name: "Creator" }));
    fireEvent.click(screen.getByRole("button", { name: "Review queue" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Review queue" })
      ).toBeVisible()
    );

    expect(screen.queryByText("Real Builder")).not.toBeInTheDocument();
    expect(screen.getByText("Noah Mercer")).toBeVisible();
    expect(screen.getByText("Simulated journey actors")).toBeVisible();
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

  it("opens the exact non-first Pod selected from discovery", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open Night Run Club" })
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Night Run Club" })
      ).toBeVisible()
    );
  });

  it("opens the exact non-first person selected from search", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(screen.getByRole("button", { name: "Social" }));
    fireEvent.click(screen.getByRole("button", { name: "People search" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Find people" })
      ).toBeVisible()
    );

    fireEvent.click(screen.getByRole("button", { name: /Noah Mercer/ }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Noah Mercer" })
      ).toBeVisible()
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "@noahmercer" })
    ).toBeVisible();
  });

  it("opens the exact non-first application selected from the creator queue", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(screen.getByRole("button", { name: "Creator" }));
    fireEvent.click(screen.getByRole("button", { name: "Applications" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Applications" })
      ).toBeVisible()
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Review Noah Mercer's application"
      })
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Noah Mercer's application" })
      ).toBeVisible()
    );
    expect(
      screen.getByText(
        "I want to make public activity rooms easier to follow."
      )
    ).toBeVisible();
  });

  it("opens the exact non-first submission selected from the review queue", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(screen.getByRole("button", { name: "Creator" }));
    fireEvent.click(screen.getByRole("button", { name: "Review queue" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Review queue" })
      ).toBeVisible()
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Review Noah Mercer's submission"
      })
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Review proof" })
      ).toBeVisible()
    );
    expect(
      screen.getByText(
        "Funding-state audit is published with clear state transitions."
      )
    ).toBeVisible();
    expect(screen.getByText("Pull request 219")).toBeVisible();
  });

  it("opens the exact non-first transfer selected from operations", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.click(screen.getByRole("button", { name: "Operations" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Transfer operations" })
      ).toBeVisible()
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open Retry required transfer for Night Run Club"
      })
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Transfer detail" })
      ).toBeVisible()
    );
    expect(screen.getByText("0.2 NIM")).toBeVisible();
    expect(screen.getByText("9b420c14...f219")).toBeVisible();
  });

  it("renders the selected scenario at its registered state", async () => {
    render(<NativeMomentumPrototype data={previewData} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Visual state" }), {
      target: { value: "wrong-network" }
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Wallet Confirmation" })
      ).toBeVisible()
    );
    await waitFor(() =>
      expect(screen.getByTestId("legacy-scenario-renderer")).toHaveAttribute(
        "data-preview-scenario",
        "wrong-network"
      )
    );
  });
});
