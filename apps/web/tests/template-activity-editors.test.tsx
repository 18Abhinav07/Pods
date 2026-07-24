import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ActivityOccurrence } from "../src/components/activity-occurrence";

const shared = {
  podId: "pod-1",
  occurrenceId: "occurrence-1",
  podName: "A truthful activity",
  occurrenceOrdinal: 3,
  closesAt: "2027-05-03T23:59:59.999Z",
  stakeNim: 0.1,
  settlementMode: "proportional" as const,
  currentStreak: 2,
  timeZone: "UTC",
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
    expect(screen.getByRole("button", { name: "Review and submit" })).toBeDisabled();
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

    expect(screen.getByLabelText("Today's task")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lock this task" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Result summary")).not.toBeInTheDocument();
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

    expect(screen.getByLabelText("Output goal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lock this goal" })).toBeInTheDocument();
    expect(screen.queryByText("Visible deliverable")).not.toBeInTheDocument();
  });
});
