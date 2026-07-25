import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ActivityOccurrence } from "../src/components/activity-occurrence";

const shared = {
  podId: "pod-1",
  occurrenceId: "occurrence-1",
  podName: "A truthful activity",
  occurrenceOrdinal: 3,
  opensAt: "2027-05-03T00:00:00.000Z",
  initiallyOpen: true,
  closesAt: "2027-05-03T23:59:59.999Z",
  stakeNim: 0.1,
  settlementMode: "proportional" as const,
  currentStreak: 2,
  timeZone: "UTC",
  effectiveNowAt: "2027-05-03T08:00:00.000Z",
  submission: null
};

describe("template activity editors", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.restoreAllMocks();
  });

  it("renders Fitness evidence directly with no participant lock step", () => {
    render(
      <ActivityOccurrence
        {...shared}
        allowedDeliverables={[]}
        commitment={null}
        commitmentDeadlineAt={null}
        projectTheme="Strength training"
        templateConfig={{
          activityType: "Strength training",
          measurableMinimum: "Complete a 45 minute session"
        }}
        templateId="fitness"
      />
    );

    expect(screen.getByLabelText("Completion note")).toBeInTheDocument();
    expect(screen.getByText("Complete a 45 minute session")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lock/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to evidence" }))
      .toBeDisabled();
  });

  it("renders Reading quantity in the frozen unit with no lock step", () => {
    render(
      <ActivityOccurrence
        {...shared}
        allowedDeliverables={[]}
        commitment={null}
        commitmentDeadlineAt={null}
        projectTheme="Systems reading"
        templateConfig={{
          bookOrTheme: "Designing Data-Intensive Applications",
          targetAmount: 20,
          targetType: "pages"
        }}
        templateId="reading"
      />
    );

    expect(screen.getByLabelText("Reading title")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount completed")).toBeInTheDocument();
    expect(screen.getByText("pages", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lock/i })).not.toBeInTheDocument();
  });

  it("renders Study topic, duration, image, and takeaway with no lock step", () => {
    render(
      <ActivityOccurrence
        {...shared}
        allowedDeliverables={[]}
        commitment={null}
        commitmentDeadlineAt={null}
        projectTheme="Distributed systems"
        templateConfig={{
          subject: "Distributed systems",
          minimumKind: "minutes",
          minimumMinutes: 60
        }}
        templateId="study"
      />
    );

    expect(screen.getByLabelText("Study topic")).toBeInTheDocument();
    expect(screen.getByLabelText("Focus duration")).toBeInTheDocument();
    expect(screen.getByLabelText("Takeaway")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lock/i })).not.toBeInTheDocument();
  });

  it("keeps the Build task lock before its result editor", () => {
    render(
      <ActivityOccurrence
        {...shared}
        allowedDeliverables={["pull_request", "commit"]}
        commitment={null}
        commitmentDeadlineAt="2027-05-03T09:00:00.000Z"
        projectTheme="Pods"
        templateConfig={{
          projectTheme: "Pods",
          allowedDeliverables: ["pull_request", "commit"],
          commitmentCutoff: "09:00"
        }}
        templateId="build"
      />
    );

    expect(screen.getByRole("heading", {
      name: "Choose the one thing you will ship."
    })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start commitment" }));
    expect(screen.getByLabelText("Today I will")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose proof" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lock this commitment" }))
      .not.toBeInTheDocument();
    expect(screen.queryByLabelText("Result summary")).not.toBeInTheDocument();
  });

  it("names the effective Pods Team reviewer throughout a legacy Build commitment", () => {
    render(
      <ActivityOccurrence
        {...shared}
        allowedDeliverables={["pull_request", "commit"]}
        commitment={null}
        commitmentDeadlineAt="2027-05-03T09:00:00.000Z"
        projectTheme="Pods"
        reviewerKind="pods_team"
        templateConfig={{
          projectTheme: "Pods",
          allowedDeliverables: ["pull_request", "commit"],
          commitmentCutoff: "09:00"
        }}
        templateId="build"
      />
    );

    expect(screen.getByText(
      "Lock one concrete finish line now. The Pods Team reviews the proof later."
    )).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start commitment" }));
    fireEvent.change(screen.getByLabelText("Today I will"), {
      target: { value: "Ship the effective reviewer copy across the commitment ritual." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Choose proof" }));
    fireEvent.click(screen.getByRole("button", { name: "Review commitment" }));

    expect(screen.getByText(
      "The Pods Team reviews your proof. The locked promise cannot be changed for this occurrence."
    )).toBeInTheDocument();
  });

  it("uses a distinct Practice goal lock instead of Build deliverables", () => {
    render(
      <ActivityOccurrence
        {...shared}
        allowedDeliverables={[]}
        commitment={null}
        commitmentDeadlineAt="2027-05-03T09:00:00.000Z"
        projectTheme="Illustration"
        templateConfig={{
          discipline: "Illustration",
          minimumExpectation: "Complete one character study",
          commitmentCutoff: "09:00"
        }}
        templateId="create"
      />
    );

    expect(screen.getByRole("heading", {
      name: "Choose the one thing you will make."
    })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start commitment" }));
    expect(screen.getByLabelText("Today I will make")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check promise" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lock this commitment" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("names the effective Pods Team reviewer in the legacy Practice check", () => {
    render(
      <ActivityOccurrence
        {...shared}
        allowedDeliverables={[]}
        commitment={null}
        commitmentDeadlineAt="2027-05-03T09:00:00.000Z"
        projectTheme="Illustration"
        reviewerKind="pods_team"
        templateConfig={{
          discipline: "Illustration",
          minimumExpectation: "Complete one character study",
          commitmentCutoff: "09:00"
        }}
        templateId="create"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Start commitment" }));
    fireEvent.change(screen.getByLabelText("Today I will make"), {
      target: { value: "Finish one expressive character study with a clear silhouette." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Check promise" }));

    expect(screen.getByText(
      "The Pods Team compares your finished proof with this exact locked output."
    )).toBeInTheDocument();
  });
});
