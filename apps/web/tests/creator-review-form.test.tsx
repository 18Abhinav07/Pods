import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace })
}));

import { CreatorReviewForm } from "../src/components/creator-review-form";

const podId = "430296c7-9554-43e6-9b43-bfd063391028";
const submissionId = "b5322c1c-4441-4f12-87ba-8fe6d68b20f5";
const decisionUrl =
  `/api/pods/${podId}/admin/reviews/${submissionId}/decision`;

describe("CreatorReviewForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    refresh.mockReset();
    replace.mockReset();
  });

  it("approves with only the decision and optional note", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ submission: { state: "approved" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    render(<CreatorReviewForm podId={podId} submissionId={submissionId} />);

    fireEvent.change(screen.getByLabelText("Approval note"), {
      target: { value: "The public artifact matches the locked task." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve proof" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(decisionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision: "approve",
        note: "The public artifact matches the locked task."
      })
    }));
    expect(await screen.findByText("Decision saved")).toBeVisible();
    expect(replace).toHaveBeenCalledWith(`/pods/${podId}/admin/reviews`);
    expect(refresh).toHaveBeenCalled();
  });

  it("reveals a required rejection reason and submits no approval note", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ submission: { state: "rejected" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    render(<CreatorReviewForm podId={podId} submissionId={submissionId} />);

    expect(screen.queryByLabelText("Rejection reason")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reject proof" }));
    const reason = screen.getByLabelText("Rejection reason");
    expect(reason).toBeRequired();
    expect(reason).toHaveAttribute("minLength", "12");
    expect(reason).toHaveAttribute("maxLength", "500");
    fireEvent.change(reason, {
      target: { value: "The artifact does not complete the locked task." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(decisionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision: "reject",
        reason: "The artifact does not complete the locked task."
      })
    }));
  });

  it("uses the intentional conflict copy for a final result", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Internal conflict detail" }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      })
    );
    render(<CreatorReviewForm podId={podId} submissionId={submissionId} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve proof" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This proof already has a final result"
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("disables both decision paths while a request is pending", async () => {
    let resolveRequest: ((value: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    render(<CreatorReviewForm podId={podId} submissionId={submissionId} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve proof" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Saving decision" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Reject proof" })).toBeDisabled();
    });
    resolveRequest?.(new Response(
      JSON.stringify({ submission: { state: "approved" } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));
  });
});
