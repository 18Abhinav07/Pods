import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ActivityOccurrence } from "../src/components/activity-occurrence";

const base = {
  podId: "pod-1",
  occurrenceId: "occurrence-1",
  podName: "Build Pods in Public",
  projectTheme: "A polished accountability product",
  allowedDeliverables: ["pull_request", "commit"] as const,
  occurrenceOrdinal: 1,
  commitmentDeadlineAt: "2027-04-05T09:00:00.000Z",
  closesAt: "2027-04-05T23:59:59.999Z",
  stakeNim: 0.1,
  currentStreak: 0,
  timeZone: "UTC"
};

describe("Build and Ship occurrence", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.restoreAllMocks();
  });

  it("makes the frozen task lock the only primary action before commitment", () => {
    render(<ActivityOccurrence {...base} commitment={null} submission={null} />);

    expect(screen.getByText("A polished accountability product")).toBeInTheDocument();
    expect(screen.getByText("Apr 5 · 11:59 PM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lock this task" })).toBeInTheDocument();
    expect(screen.getByText("Once locked, this task cannot be changed for this occurrence."))
      .toBeInTheDocument();
  });

  it("saves a complete draft before exposing submission to review", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        submission: {
          id: "submission-1",
          state: "draft",
          resultSummary: "Shipped the complete participant activity screen and tests.",
          artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
          evidenceObjectKey: null
        }
      }), { status: 201, headers: { "Content-Type": "application/json" } })
    );
    render(<ActivityOccurrence
      {...base}
      commitment={{
        id: "commitment-1",
        task: "Ship the participant activity screen and its tests.",
        deliverableType: "pull_request",
        lockedAt: "2027-04-05T08:00:00.000Z"
      }}
      submission={null}
    />);
    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/18Abhinav07/Pods/pull/42" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save evidence draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/pods/pod-1/occurrences/occurrence-1/draft",
      expect.objectContaining({ method: "POST" })
    ));
    expect(await screen.findByRole("button", { name: "Submit for Pods review" }))
      .toBeInTheDocument();
  });
});
