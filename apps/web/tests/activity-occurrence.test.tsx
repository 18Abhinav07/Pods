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
  settlementMode: "full_refund_alpha" as const,
  currentStreak: 0,
  timeZone: "UTC"
};

describe("Build and Ship occurrence", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.restoreAllMocks();
  });

  it("makes the frozen task lock the only primary action before commitment", () => {
    const { container } = render(<ActivityOccurrence {...base} commitment={null} submission={null} />);

    expect(screen.getByText("A polished accountability product")).toBeInTheDocument();
    expect(screen.getByText("Apr 5 · 11:59 PM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lock this task" })).toBeInTheDocument();
    expect(screen.getByText("Once locked, this task cannot be changed for this occurrence."))
      .toBeInTheDocument();
    expect(container.querySelector(".activity-contract-card")).toHaveClass("is-guided-flow");
    expect(container.querySelector(".commitment-studio-visual")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Commitment progress" })).toBeInTheDocument();
  });

  it("states the full-return alpha consequence without implying principal is at risk", () => {
    render(<ActivityOccurrence {...base} commitment={null} submission={null} />);

    expect(screen.getByText("Activity slice")).toBeInTheDocument();
    expect(screen.getByText("Your full Testnet principal remains returnable.")).toBeInTheDocument();
    expect(screen.queryByText("At risk")).not.toBeInTheDocument();
  });

  it("creates the draft and submits it through one final review action", async () => {
    const draft = {
      id: "submission-1",
      state: "draft",
      resultSummary: "Shipped the complete participant activity screen and tests.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
      evidenceObjectKey: null,
      proofShareMode: "reviewer_only"
    } as const;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      return new Response(JSON.stringify({
        submission: url.endsWith("/submit") ? { ...draft, state: "reviewing" } : draft
      }), { status: url.endsWith("/submit") ? 200 : 201, headers: { "Content-Type": "application/json" } });
    });
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
    fireEvent.click(screen.getByRole("button", { name: "Review and submit" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/pods/pod-1/occurrences/occurrence-1/draft",
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/pods/pod-1/submissions/submission-1/submit",
      { method: "POST" }
    ));
    expect(await screen.findByText("Your evidence is under review.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("shows evidence and privacy controls before a database draft exists", () => {
    const { container } = render(<ActivityOccurrence
      {...base}
      commitment={{
        id: "commitment-1",
        task: "Ship the participant activity screen and its tests.",
        deliverableType: "pull_request",
        lockedAt: "2027-04-05T08:00:00.000Z"
      }}
      submission={null}
    />);

    expect(screen.getByRole("radio", { name: /Pods reviewer only/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Share with Pod/i })).toBeInTheDocument();
    expect(container.querySelector(".activity-evidence-card")).toHaveClass("is-guided-flow");
    expect(screen.getByRole("navigation", { name: "Proof progress" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add evidence" }));
    expect(screen.getByRole("button", { name: /Camera/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Image/i })).toBeInTheDocument();
    expect(container.querySelectorAll("input.proof-file-input")).toHaveLength(2);
  });

  it("offers public image sharing only for a visitor-enabled frozen contract", () => {
    const commitment = {
      id: "commitment-1",
      task: "Ship the participant activity screen and its tests.",
      deliverableType: "pull_request" as const,
      lockedAt: "2027-04-05T08:00:00.000Z"
    };
    const first = render(
      <ActivityOccurrence {...base} commitment={commitment} submission={null} />
    );
    expect(screen.queryByRole("radio", { name: /Share publicly/i }))
      .not.toBeInTheDocument();
    first.unmount();

    render(
      <ActivityOccurrence
        {...base}
        commitment={commitment}
        publicVisitorSharingEnabled
        submission={null}
      />
    );
    expect(screen.getByRole("radio", { name: /Share publicly/i }))
      .toBeInTheDocument();
  });
});
