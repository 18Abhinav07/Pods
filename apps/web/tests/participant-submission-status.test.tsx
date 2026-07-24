import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ParticipantSubmissionStatus } from "../src/components/participant-submission-status";

const initial = {
  state: "reviewing" as const,
  proofShareMode: "reviewer_only" as const,
  submittedAt: "2027-04-05T08:00:00.000Z",
  reviewTargetAt: "2027-04-05T20:00:00.000Z",
  reviewHardDeadlineAt: "2027-04-06T08:00:00.000Z",
  reviewDecisionNote: null,
  creator: {
    handle: "ryuk",
    displayName: "Abhinav",
    avatar: { kind: "preset" as const, preset: "ember" as const }
  }
};

describe("ParticipantSubmissionStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("shows the real creator, proof audience, and live terminal decision", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        status: {
          ...initial,
          state: "approved",
          reviewDecisionNote: "The pull request visibly completes the locked task."
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    render(
      <ParticipantSubmissionStatus
        endpoint="/api/pods/pod-1/submissions/submission-1"
        initial={initial}
      />
    );

    expect(screen.getByText("Abhinav")).toBeVisible();
    expect(screen.getByText("@ryuk")).toBeVisible();
    expect(screen.getByText("Creator only")).toBeVisible();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Work approved" })).toBeVisible();
    });
    expect(screen.getByText(
      "The pull request visibly completes the locked task."
    )).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops polling after the submission reaches a terminal state", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        status: { ...initial, state: "timeout_protected" }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    render(
      <ParticipantSubmissionStatus
        endpoint="/api/pods/pod-1/submissions/submission-1"
        initial={initial}
      />
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
