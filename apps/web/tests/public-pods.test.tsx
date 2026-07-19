import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicPodCard } from "../src/components/public-pod-card";

describe("PublicPodCard", () => {
  it("renders the frozen public enrollment terms without exposing a wallet", () => {
    render(
      <PublicPodCard
        pod={{
          id: "pod-public",
          templateId: "build",
          name: "Build Pods in Public",
          purpose: "Ship one concrete product improvement at every occurrence.",
          startDate: "2027-03-01",
          endDate: "2027-03-05",
          occurrenceCount: 3,
          totalLuna: 150_000,
          minParticipants: 2,
          maxParticipants: 4
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Build Pods in Public" })).toBeVisible();
    expect(screen.getByText("1.5 NIM upfront")).toBeVisible();
    expect(screen.getByText("3 occurrences")).toBeVisible();
    expect(screen.getByRole("link", { name: "Apply to join" })).toHaveAttribute(
      "href",
      "/pods/pod-public"
    );
    expect(screen.queryByText(/NQ[A-Z0-9 ]{20,}/)).not.toBeInTheDocument();
  });

  it("routes the creator to enrollment management instead of self-application", () => {
    render(
      <PublicPodCard
        pod={{
          id: "pod-owned",
          templateId: "build",
          name: "My public Pod",
          purpose: "A creator-owned public activity with a clear enrollment path.",
          startDate: "2027-03-01",
          endDate: "2027-03-05",
          occurrenceCount: 3,
          totalLuna: 150_000,
          minParticipants: 2,
          maxParticipants: 4
        }}
        viewerRole="creator"
      />
    );

    expect(screen.getByRole("link", { name: "Manage enrollment" })).toHaveAttribute(
      "href",
      "/pods/pod-owned/admin"
    );
    expect(screen.queryByRole("link", { name: "Apply to join" })).not.toBeInTheDocument();
  });
});
