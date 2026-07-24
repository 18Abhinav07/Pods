import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  getProfileForUser: vi.fn(),
  getSubmissionForOwner: vi.fn()
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "member-1" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: repositoryMocks
}));

import ParticipantSubmissionPage from "../src/app/pods/[podId]/submissions/[submissionId]/page";

const submissionResult = {
  submission: {
    id: "submission-1",
    state: "reviewing",
    resultSummary: "Shipped a responsive proof flow with public and reviewer-only evidence controls.",
    artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
    evidenceObjectKey: "private/evidence.webp",
    proofShareMode: "reviewer_only",
    submittedAt: new Date("2027-04-05T08:00:00.000Z"),
    reviewTargetAt: new Date("2027-04-05T20:00:00.000Z"),
    reviewHardDeadlineAt: new Date("2027-04-06T08:00:00.000Z")
  },
  commitment: {
    task: "Ship the complete proof experience.",
    deliverableType: "pull_request"
  },
  occurrence: { ordinal: 4 },
  pod: {
    id: "pod-1",
    creatorUserId: "creator-1",
    contractData: {
      templateId: "build",
      activity: {
        name: "Build Pods in public",
        timeZone: "Asia/Kolkata",
        config: { projectTheme: "Pods activity proof" }
      }
    }
  },
  reviewDecision: null
};

describe("ParticipantSubmissionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.getSubmissionForOwner.mockResolvedValue(submissionResult);
    repositoryMocks.getProfileForUser.mockResolvedValue({
      handle: "ryuk",
      displayName: "Abhinav",
      avatar: { kind: "preset", preset: "ember" }
    });
  });

  it("renders one editorial proof record and one chronological review timeline", async () => {
    const { container } = render(await ParticipantSubmissionPage({
      params: Promise.resolve({ podId: "pod-1", submissionId: "submission-1" })
    }));

    expect(container.querySelector(".submission-detail-card")).toHaveClass("is-editorial-submission");
    expect(container.querySelector(".review-timing-card")).toHaveClass("is-review-timeline");
    expect(container.querySelectorAll(".review-timing-card > div")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Open public artifact" })).toHaveAttribute(
      "href",
      "https://github.com/18Abhinav07/Pods/pull/42"
    );
    expect(screen.getByRole("img", { name: "Your optional evidence" })).toHaveAttribute(
      "src",
      "/api/pods/pod-1/submissions/submission-1/evidence"
    );
    expect(screen.getByText("Abhinav")).toBeVisible();
    expect(screen.getByText("@ryuk")).toBeVisible();
    expect(screen.getByText("Creator only")).toBeVisible();
    expect(screen.getByText("Principal remains protected while review is open")).toBeVisible();
  });

  it("labels an unsent submission draft without implying creator review", async () => {
    repositoryMocks.getSubmissionForOwner.mockResolvedValue({
      ...submissionResult,
      submission: {
        ...submissionResult.submission,
        state: "draft",
        submittedAt: null,
        reviewTargetAt: null,
        reviewHardDeadlineAt: null
      }
    });

    render(await ParticipantSubmissionPage({
      params: Promise.resolve({ podId: "pod-1", submissionId: "submission-1" })
    }));

    expect(screen.getByRole("heading", { name: "Proof draft" })).toBeVisible();
    expect(screen.getByText(
      "This proof has not been sent to the Pod creator yet."
    )).toBeVisible();
    expect(screen.queryByText("Creator review in progress")).not.toBeInTheDocument();
  });

  it("shows the owner's private rejection decision without an appeal control", async () => {
    const privateNote = "The artifact does not complete the locked commitment.";
    repositoryMocks.getSubmissionForOwner.mockResolvedValue({
      ...submissionResult,
      submission: { ...submissionResult.submission, state: "rejected" },
      reviewDecision: {
        action: "rejected",
        note: privateNote
      }
    });

    render(await ParticipantSubmissionPage({
      params: Promise.resolve({ podId: "pod-1", submissionId: "submission-1" })
    }));

    expect(screen.getByRole("heading", { name: "Not verified" })).toBeVisible();
    expect(screen.getByText(privateNote)).toBeVisible();
    expect(screen.queryByRole("button", { name: /appeal|dispute/i }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /appeal|dispute/i }))
      .not.toBeInTheDocument();
  });

  it("explains that timeout-protected work counts toward progress and streak", async () => {
    repositoryMocks.getSubmissionForOwner.mockResolvedValue({
      ...submissionResult,
      submission: {
        ...submissionResult.submission,
        state: "timeout_protected"
      }
    });

    render(await ParticipantSubmissionPage({
      params: Promise.resolve({ podId: "pod-1", submissionId: "submission-1" })
    }));

    expect(screen.getByRole("heading", {
      name: "Protected after review timeout"
    })).toBeVisible();
    expect(screen.getByText(
      "The creator did not decide within 24 hours. This occurrence counts toward your progress and streak."
    )).toBeVisible();
  });
});
