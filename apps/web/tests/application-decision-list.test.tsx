import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh })
}));

vi.mock("../src/lib/creator-enrollment-client", () => ({
  decidePodApplication: vi.fn(async () => undefined)
}));

import { decidePodApplication } from "../src/lib/creator-enrollment-client";
import { ApplicationDecisionList } from "../src/components/application-decision-list";

const applications = [
  {
    id: "application-1",
    applicant: {
      handle: "ryuk",
      displayName: "Ryuk",
      bio: "Building Pods with the Nimiq community.",
      avatar: { kind: "preset" as const, preset: "moss" as const }
    },
    answers: [
      {
        question: "What will you build?",
        answer: "A reliable visitor room."
      }
    ]
  }
];

describe("ApplicationDecisionList", () => {
  it("keeps the queue compact and opens one applicant review at a time", () => {
    const { rerender } = render(
      <ApplicationDecisionList applications={applications} podId="pod-1" />
    );

    expect(
      screen.getByRole("link", { name: "Review Ryuk application" })
    ).toHaveAttribute(
      "href",
      "/pods/pod-1/admin/applications?application=application-1"
    );
    expect(screen.getByText("1 response")).toBeVisible();
    expect(screen.queryByText("A reliable visitor room.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept applicant" }))
      .not.toBeInTheDocument();

    rerender(
      <ApplicationDecisionList
        applications={applications}
        podId="pod-1"
        selectedApplicationId="application-1"
      />
    );

    expect(screen.getByText("A reliable visitor room.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Accept applicant" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Decline applicant" })).toBeVisible();
    expect(screen.getByRole("link", { name: "All applications" })).toHaveAttribute(
      "href",
      "/pods/pod-1/admin/applications"
    );
  });

  it("protects a terminal decision from duplicate taps", async () => {
    let resolveDecision!: () => void;
    vi.mocked(decidePodApplication).mockImplementationOnce(
      () => new Promise<{ state: string }>((resolve) => {
        resolveDecision = () => resolve({ state: "accepted_unfunded" });
      })
    );
    render(
      <ApplicationDecisionList
        applications={applications}
        podId="pod-1"
        selectedApplicationId="application-1"
      />
    );

    const accept = screen.getByRole("button", { name: "Accept applicant" });
    fireEvent.click(accept);
    fireEvent.click(accept);

    expect(decidePodApplication).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving decision" })).toBeDisabled();

    resolveDecision();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
