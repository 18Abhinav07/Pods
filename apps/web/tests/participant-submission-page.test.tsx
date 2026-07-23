import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "member-1" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getSubmissionForOwner: vi.fn(async () => ({
      submission: {
        id: "submission-1",
        state: "reviewing",
        resultSummary: "Shipped a responsive proof flow with public and reviewer-only evidence controls.",
        artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
        evidenceObjectKey: "private/evidence.webp",
        submittedAt: new Date("2027-04-05T08:00:00.000Z"),
        reviewTargetAt: new Date("2027-04-05T20:00:00.000Z"),
        reviewHardDeadlineAt: new Date("2027-04-06T08:00:00.000Z")
      },
      commitment: { task: "Ship the complete proof experience." },
      occurrence: { ordinal: 4 },
      pod: { id: "pod-1", contractData: { activity: { name: "Build Pods in public" } } }
    }))
  }
}));

import ParticipantSubmissionPage from "../src/app/pods/[podId]/submissions/[submissionId]/page";

describe("ParticipantSubmissionPage", () => {
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
    expect(screen.getByText("Principal remains protected while review is open")).toBeVisible();
  });
});
