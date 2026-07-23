import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicPodCard } from "../src/components/public-pod-card";

describe("PublicPodCard", () => {
  it("opens the Pod from one clean card target without exposing a wallet", () => {
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
    expect(screen.getByRole("article")).toHaveClass("is-compact-row");
    expect(screen.getByRole("img", { name: "Build & Ship activity cover" })).toHaveAttribute(
      "data-template-art",
      "build"
    );
    expect(document.querySelector("details")).toBeNull();
    expect(screen.queryByLabelText("Show Pod details")).not.toBeInTheDocument();
    expect(screen.queryByText("1.5 NIM upfront")).not.toBeInTheDocument();
    expect(screen.queryByText("Open to apply")).not.toBeInTheDocument();
    const apply = screen.getByRole("link", { name: "Open Build Pods in Public" });
    expect(apply).toHaveAttribute(
      "href",
      "/pods/pod-public"
    );
    expect(apply).toHaveClass("adaptive-card-hit-area");
    expect(document.querySelector(".discover-apply-orb")).toBeNull();
    expect(screen.getByText("Build & Ship")).toHaveClass("adaptive-pod-type");
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
    expect(screen.getByRole("link", { name: "Open My public Pod" })).toHaveAttribute(
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
    expect(screen.getByRole("link", { name: "Open Read Together" })).toHaveAttribute(
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
    expect(screen.getByRole("link", { name: "Open Pods MVP C1" })).toHaveAttribute(
      "href",
      "/pods/pod-funding/fund"
    );
    expect(screen.queryByText("Open to apply")).not.toBeInTheDocument();
  });
});
