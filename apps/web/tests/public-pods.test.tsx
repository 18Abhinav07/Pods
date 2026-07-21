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
    expect(screen.getByText("Open to apply")).toBeVisible();
    expect(screen.getByRole("link", { name: "View Pod" })).toHaveAttribute(
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
        relationship={{ kind: "creator" }}
      />
    );

    expect(screen.getByText("Creator")).toBeVisible();
    expect(screen.getByRole("link", { name: "Manage enrollment" })).toHaveAttribute(
      "href",
      "/pods/pod-owned/admin"
    );
    expect(screen.queryByRole("link", { name: "Apply to join" })).not.toBeInTheDocument();
  });

  it("shows an existing application instead of offering another application", () => {
    render(
      <PublicPodCard
        pod={{
          id: "pod-applied",
          templateId: "reading",
          name: "Read Together",
          purpose: "Keep a shared reading cadence with visible weekly progress.",
          startDate: "2027-03-01",
          endDate: "2027-03-14",
          occurrenceCount: 6,
          totalLuna: 300_000,
          minParticipants: 2,
          maxParticipants: 8
        }}
        relationship={{ kind: "member", state: "applied", depositIntentId: null }}
      />
    );

    expect(screen.getByText("Application pending")).toBeVisible();
    expect(screen.getByRole("link", { name: "View application" })).toHaveAttribute(
      "href",
      "/applications?pod=pod-applied"
    );
    expect(screen.queryByText("Open to apply")).not.toBeInTheDocument();
  });

  it("shows the funding recovery action for an accepted participant", () => {
    render(
      <PublicPodCard
        pod={{
          id: "pod-funding",
          templateId: "build",
          name: "Pods MVP C1",
          purpose: "Ship the Pods product through one visible commitment at a time.",
          startDate: "2027-03-01",
          endDate: "2027-03-14",
          occurrenceCount: 6,
          totalLuna: 600_000,
          minParticipants: 2,
          maxParticipants: 8
        }}
        relationship={{ kind: "member", state: "funding_failed", depositIntentId: null }}
      />
    );

    expect(screen.getByText("Funding needs attention")).toBeVisible();
    expect(screen.getByRole("link", { name: "Retry funding" })).toHaveAttribute(
      "href",
      "/pods/pod-funding/fund"
    );
    expect(screen.queryByText("Open to apply")).not.toBeInTheDocument();
  });
});
