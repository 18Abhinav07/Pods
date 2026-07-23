import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listPodVisibleSubmissions } = vi.hoisted(() => ({
  listPodVisibleSubmissions: vi.fn()
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({
    userId: "member-1",
    profile: {
      displayName: "Current builder",
      avatar: { kind: "preset", preset: "ember" }
    }
  }))
}));

vi.mock("../src/components/app-header", () => ({
  AppHeader: () => <header>Proofs</header>
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { listPodVisibleSubmissions }
}));

import PodActivityPage from "../src/app/pods/[podId]/activity/page";

const proof = {
  submission: {
    id: "submission-1",
    state: "reviewing",
    resultSummary: "The responsive room is ready for review.",
    artifactUrl: "https://example.com/proof",
    submittedAt: new Date("2027-03-01T10:00:00.000Z")
  },
  commitment: { task: "Ship the polished activity trail", deliverableType: "pull_request" },
  occurrence: { ordinal: 1, localDate: "2027-03-01" },
  participant: {
    handle: "ryuk_builds",
    displayName: "Ryuk",
    avatar: { kind: "preset", preset: "moss" }
  },
  isViewer: false,
  sharedEvidenceAvailable: true
};

describe("PodActivityPage", () => {
  beforeEach(() => {
    listPodVisibleSubmissions.mockReset();
    listPodVisibleSubmissions.mockResolvedValue({ items: [proof], page: 1, hasNext: false });
  });

  it("identifies each participant and keeps the history searchable without repeating the Pod", async () => {
    const { container } = render(await PodActivityPage({
      params: Promise.resolve({ podId: "pod-1" }),
      searchParams: Promise.resolve({})
    }));

    expect(screen.getByRole("searchbox", { name: "Search proofs by member" })).toBeVisible();
    expect(screen.getByRole("link", { name: "All proofs" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "My proofs" })).toBeVisible();
    expect(container.querySelector(".proof-history-controls")).toHaveClass("is-compact-filter");
    expect(container.querySelector(".proof-history-entry")).toHaveClass("is-editorial-proof");
    expect(screen.getByRole("img", { name: "Ryuk avatar" })).toBeVisible();
    expect(screen.getByText("Ryuk")).toBeVisible();
    expect(screen.getByText("@ryuk_builds")).toBeVisible();
    expect(screen.getByText("Creator review")).toBeVisible();
    expect(screen.queryByText("Build in public")).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase 4 Build Lab/)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Pod-shared proof from Ryuk" }))
      .toHaveAttribute("src", "/api/pods/pod-1/submissions/submission-1/shared-evidence");
  });

  it("passes bounded member filters to the group-safe repository", async () => {
    render(await PodActivityPage({
      params: Promise.resolve({ podId: "pod-1" }),
      searchParams: Promise.resolve({ q: "ry", scope: "mine", page: "2" })
    }));

    expect(listPodVisibleSubmissions).toHaveBeenCalledWith({
      userId: "member-1",
      podId: "pod-1",
      memberQuery: "ry",
      viewerOnly: true,
      page: 2,
      limit: 20
    });
  });

  it("never renders reviewer-only media from a safe projection", async () => {
    listPodVisibleSubmissions.mockResolvedValue({
      items: [{ ...proof, sharedEvidenceAvailable: false }],
      page: 1,
      hasNext: false
    });
    render(await PodActivityPage({
      params: Promise.resolve({ podId: "pod-1" }),
      searchParams: Promise.resolve({})
    }));

    expect(screen.queryByRole("img", { name: "Pod-shared proof from Ryuk" })).not.toBeInTheDocument();
  });

  it.each([
    ["rejected", "Not verified"],
    ["timeout_protected", "Protected after review timeout"]
  ])("shows the group-safe %s status without a private decision note", async (state, label) => {
    const privateNote = "Only the participant and creator may read this note.";
    listPodVisibleSubmissions.mockResolvedValue({
      items: [{
        ...proof,
        submission: {
          ...proof.submission,
          state,
          reviewDecisionNote: privateNote
        }
      }],
      page: 1,
      hasNext: false
    });

    render(await PodActivityPage({
      params: Promise.resolve({ podId: "pod-1" }),
      searchParams: Promise.resolve({})
    }));

    expect(screen.getByText(label)).toBeVisible();
    expect(screen.queryByText(privateNote)).not.toBeInTheDocument();
  });
});
