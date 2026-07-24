import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const notFound = vi.hoisted(() => vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
}));
const requireSession = vi.hoisted(() => vi.fn());
const repository = vi.hoisted(() => ({
  getReviewSubmissionForCreator: vi.fn(),
  listPendingReviewsForCreator: vi.fn()
}));

vi.mock("next/navigation", () => ({
  notFound,
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() })
}));
vi.mock("../src/lib/session", () => ({ requireSession }));
vi.mock("../src/lib/server-db", () => ({ podsRepository: repository }));

import CreatorReviewQueuePage from "../src/app/pods/[podId]/admin/reviews/page";
import CreatorReviewWorkspacePage from "../src/app/pods/[podId]/admin/reviews/[submissionId]/page";

const podId = "430296c7-9554-43e6-9b43-bfd063391028";
const submissionId = "b5322c1c-4441-4f12-87ba-8fe6d68b20f5";
const occurrenceId = "5c195050-5b5b-4145-ad90-df57fd5ed12d";

const queueRecord = {
  timeZone: "Asia/Kolkata",
  submission: {
    id: submissionId,
    state: "reviewing",
    submittedAt: new Date("2027-04-05T11:00:00.000Z"),
    reviewTargetAt: new Date("2027-04-05T23:00:00.000Z"),
    reviewHardDeadlineAt: new Date("2027-04-06T11:00:00.000Z")
  },
  occurrence: {
    id: occurrenceId,
    ordinal: 4,
    localDate: "2027-04-05"
  },
  commitment: {
    task: "Ship the creator review flow",
    deliverableType: "pull_request"
  },
  participant: {
    handle: "pods-builder",
    displayName: "Pods Builder",
    avatar: { kind: "preset", preset: "indigo" }
  }
};

const workspaceRecord = {
  ...queueRecord,
  submission: {
    ...queueRecord.submission,
    resultSummary: "Shipped the creator proof queue and final decision workspace.",
    artifactUrl: "https://github.com/example/pods/pull/42",
    evidenceObjectKey: "private/pods/review-secret.webp",
    membershipId: "secret-membership-id"
  },
  pod: {
    id: podId,
    creatorUserId: "secret-creator-user-id",
    contractData: {
      templateId: "build",
      activity: {
        name: "Pods in Pods",
        timeZone: "Asia/Kolkata",
        config: {
          projectTheme: "Build Pods in public"
        }
      }
    }
  },
  participant: {
    ...queueRecord.participant,
    userId: "secret-user-id",
    walletAddress: "NQ00 SECRET WALLET"
  },
  reviewDecision: null
};

describe("creator proof review pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue({ userId: "creator-user-id" });
    repository.listPendingReviewsForCreator.mockResolvedValue([queueRecord]);
    repository.getReviewSubmissionForCreator.mockResolvedValue(workspaceRecord);
  });

  it("shows only pending creator reviews with participant identity and timing", async () => {
    repository.listPendingReviewsForCreator.mockResolvedValue([
      queueRecord,
      {
        ...queueRecord,
        submission: {
          ...queueRecord.submission,
          id: "7476718d-277e-49e0-9446-b5cfae12788f",
          state: "approved"
        },
        participant: {
          ...queueRecord.participant,
          displayName: "Already Decided",
          handle: "already-decided"
        }
      }
    ]);

    render(await CreatorReviewQueuePage({
      params: Promise.resolve({ podId })
    }));

    expect(screen.getByLabelText("Pods Builder avatar")).toBeVisible();
    expect(screen.getByText("Pods Builder")).toBeVisible();
    expect(screen.getByText("@pods-builder")).toBeVisible();
    expect(screen.getByText("Occurrence 4")).toBeVisible();
    expect(screen.getByText(
      "Submitted Apr 5 · 4:30 PM Asia/Kolkata"
    )).toBeVisible();
    expect(screen.getByText(
      "Target Apr 6 · 4:30 AM Asia/Kolkata"
    )).toBeVisible();
    expect(screen.getByRole("link", { name: /Review Pods Builder proof/i }))
      .toHaveAttribute("href", `/pods/${podId}/admin/reviews/${submissionId}`);
    expect(screen.queryByText("Already Decided")).not.toBeInTheDocument();
  });

  it("renders an intentional empty queue", async () => {
    repository.listPendingReviewsForCreator.mockResolvedValue([]);

    render(await CreatorReviewQueuePage({
      params: Promise.resolve({ podId })
    }));

    expect(screen.getByText("No proofs are waiting.")).toBeVisible();
    expect(screen.getByText(
      "New member proofs will appear here automatically."
    )).toBeVisible();
  });

  it("validates the queue Pod id before repository access", async () => {
    await expect(CreatorReviewQueuePage({
      params: Promise.resolve({ podId: "not-a-uuid" })
    })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(requireSession).toHaveBeenCalledWith("/pods/not-a-uuid/admin/reviews");
    expect(repository.listPendingReviewsForCreator).not.toHaveBeenCalled();
  });

  it("keeps a missing or unauthorized queue behind notFound", async () => {
    repository.listPendingReviewsForCreator.mockResolvedValue(null);

    await expect(CreatorReviewQueuePage({
      params: Promise.resolve({ podId })
    })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(repository.listPendingReviewsForCreator).toHaveBeenCalledWith({
      creatorUserId: "creator-user-id",
      podId
    });
    expect(notFound).toHaveBeenCalled();
  });

  it("shows the creator-safe proof workspace and creator-only evidence URL", async () => {
    const { container } = render(await CreatorReviewWorkspacePage({
      params: Promise.resolve({ podId, submissionId })
    }));

    expect(screen.getByRole("heading", { name: "Pods in Pods" })).toBeVisible();
    expect(screen.getByLabelText("Pods Builder avatar")).toBeVisible();
    expect(screen.getByText("Pods Builder")).toBeVisible();
    expect(screen.getByText("@pods-builder")).toBeVisible();
    expect(screen.getByText("Ship the creator review flow")).toBeVisible();
    expect(screen.getByText("GitHub pull request")).toBeVisible();
    expect(screen.getByText("Frozen Pod rule")).toBeVisible();
    expect(screen.getByText("Build Pods in public")).toBeVisible();
    expect(screen.getByText(
      "Shipped the creator proof queue and final decision workspace."
    )).toBeVisible();
    expect(screen.getByRole("link", { name: "Open public artifact" }))
      .toHaveAttribute("href", "https://github.com/example/pods/pull/42");
    expect(screen.getByRole("img", { name: "Creator-only evidence" }))
      .toHaveAttribute(
        "src",
        `/api/pods/${podId}/admin/reviews/${submissionId}/evidence`
      );
    expect(screen.getByText("Submitted")).toBeVisible();
    expect(screen.getByText("Review target")).toBeVisible();
    expect(screen.getByText("Hard deadline")).toBeVisible();
    expect(screen.getByText(
      "Apr 5, 2027 · 4:30 PM Asia/Kolkata"
    )).toBeVisible();
    expect(screen.getByText(
      "Apr 6, 2027 · 4:30 AM Asia/Kolkata"
    )).toBeVisible();
    expect(screen.getByText(
      "Apr 6, 2027 · 4:30 PM Asia/Kolkata"
    )).toBeVisible();
    expect(screen.getByRole("button", { name: "Approve proof" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reject proof" })).toBeVisible();

    const html = container.innerHTML;
    expect(html).not.toContain("review-secret.webp");
    expect(html).not.toContain("secret-membership-id");
    expect(html).not.toContain("secret-user-id");
    expect(html).not.toContain("NQ00 SECRET WALLET");
  });

  it("renders exact Reading evidence beside its frozen target", async () => {
    repository.getReviewSubmissionForCreator.mockResolvedValue({
      ...workspaceRecord,
      commitment: {
        task: "Read 20 pages of the selected book",
        deliverableType: null
      },
      submission: {
        ...workspaceRecord.submission,
        templateEvidence: {
          kind: "reading",
          title: "The Design of Everyday Things",
          amountCompleted: 12,
          unit: "pages",
          note: "Finished the chapter on discoverability."
        }
      },
      pod: {
        ...workspaceRecord.pod,
        contractData: {
          ...workspaceRecord.pod.contractData,
          templateId: "reading",
          activity: {
            ...workspaceRecord.pod.contractData.activity,
            config: {
              bookOrTheme: "The Design of Everyday Things",
              targetAmount: 20,
              targetType: "pages"
            }
          }
        }
      }
    });

    render(await CreatorReviewWorkspacePage({
      params: Promise.resolve({ podId, submissionId })
    }));

    expect(screen.getByText("Reading", { exact: true })).toBeVisible();
    expect(screen.getByText("20 pages")).toBeVisible();
    expect(screen.getByText("12 pages")).toBeVisible();
    expect(screen.getByText("Finished the chapter on discoverability."))
      .toBeVisible();
    expect(screen.getByText("Attached for creator review")).toBeVisible();
    expect(screen.queryByRole("link", { name: /artifact/i }))
      .not.toBeInTheDocument();
  });

  it("validates both workspace ids before repository access", async () => {
    await expect(CreatorReviewWorkspacePage({
      params: Promise.resolve({ podId, submissionId: "not-a-uuid" })
    })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(requireSession).toHaveBeenCalledWith(
      `/pods/${podId}/admin/reviews/not-a-uuid`
    );
    expect(repository.getReviewSubmissionForCreator).not.toHaveBeenCalled();
  });

  it("keeps a missing or unauthorized submission behind notFound", async () => {
    repository.getReviewSubmissionForCreator.mockResolvedValue(null);

    await expect(CreatorReviewWorkspacePage({
      params: Promise.resolve({ podId, submissionId })
    })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(repository.getReviewSubmissionForCreator).toHaveBeenCalledWith({
      creatorUserId: "creator-user-id",
      podId,
      submissionId
    });
  });

  it.each([
    ["approved", "Approved"],
    ["rejected", "Not verified"],
    ["timeout_protected", "Protected after review timeout"]
  ])(
    "renders the terminal %s result with a human label and no action",
    async (state, label) => {
      repository.getReviewSubmissionForCreator.mockResolvedValue({
        ...workspaceRecord,
        submission: { ...workspaceRecord.submission, state }
      });

      render(await CreatorReviewWorkspacePage({
        params: Promise.resolve({ podId, submissionId })
      }));

      expect(screen.getByText("Decision recorded")).toBeVisible();
      expect(screen.getByText(label, { exact: true })).toBeVisible();
      expect(screen.queryByText(state, { exact: true })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Approve proof" }))
        .not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Reject proof" }))
        .not.toBeInTheDocument();
      expect(screen.queryByText(/appeal|clarification|peer vote/i))
        .not.toBeInTheDocument();
    }
  );

  it("shows the creator the private note recorded with a rejection", async () => {
    const privateNote = "The submitted artifact does not complete the locked commitment.";
    repository.getReviewSubmissionForCreator.mockResolvedValue({
      ...workspaceRecord,
      submission: { ...workspaceRecord.submission, state: "rejected" },
      reviewDecision: {
        action: "rejected",
        note: privateNote
      }
    });

    render(await CreatorReviewWorkspacePage({
      params: Promise.resolve({ podId, submissionId })
    }));

    expect(screen.getByText(privateNote)).toBeVisible();
    expect(screen.getByText("Private decision note")).toBeVisible();
  });
});
