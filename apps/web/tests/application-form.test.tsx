import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { push, refresh, submitPublicApplication } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  submitPublicApplication: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh })
}));

vi.mock("../src/lib/enrollment-client", () => ({
  submitPublicApplication
}));

import { ApplicationForm } from "../src/components/application-form";

afterEach(() => {
  push.mockReset();
  refresh.mockReset();
  submitPublicApplication.mockReset();
});

describe("ApplicationForm", () => {
  it("shows one question at a time and keeps answers when moving back", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationForm
        podId="pod-1"
        questions={["What will you ship?", "Why does this cadence fit?"]}
        visitorConsent={null}
      />
    );

    const firstAnswer = screen.getByLabelText("What will you ship?");
    expect(firstAnswer).toBeVisible();
    expect(screen.queryByLabelText("Why does this cadence fit?")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/I understand that applying/)).not.toBeInTheDocument();

    await user.type(firstAnswer, "A tested mobile enrollment flow");
    await user.click(screen.getByRole("button", { name: "Next question" }));

    const secondAnswer = screen.getByLabelText("Why does this cadence fit?");
    expect(secondAnswer).toBeVisible();
    expect(screen.queryByLabelText("What will you ship?")).not.toBeInTheDocument();
    await user.type(secondAnswer, "The cadence matches my build week");
    await user.click(screen.getByRole("button", { name: "Review application" }));

    expect(screen.getByRole("heading", { name: "Review and consent" })).toBeVisible();
    expect(screen.getByLabelText(/I understand that applying/)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Why does this cadence fit?")).toHaveValue(
      "The cadence matches my build week"
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("What will you ship?")).toHaveValue(
      "A tested mobile enrollment flow"
    );
  });

  it("submits the original answer payload with the required visitor consent", async () => {
    submitPublicApplication.mockResolvedValue({
      id: "application-1",
      state: "applied"
    });
    const user = userEvent.setup();
    render(
      <ApplicationForm
        podId="pod-visitor"
        questions={["What will you contribute?"]}
        visitorConsent={{ contractHash: "frozen-contract" }}
      />
    );

    await user.type(
      screen.getByLabelText("What will you contribute?"),
      "A weekly reading reflection"
    );
    await user.click(screen.getByRole("button", { name: "Review application" }));
    await user.click(screen.getByLabelText(/I understand that applying/));
    await user.click(screen.getByLabelText(/I accept this frozen contract/));
    await user.click(screen.getByRole("button", { name: "Send application" }));

    await waitFor(() => {
      expect(submitPublicApplication).toHaveBeenCalledWith(
        "pod-visitor",
        ["A weekly reading reflection"],
        {
          acceptedContractHash: "frozen-contract",
          visitorDisclosureAccepted: true
        }
      );
      expect(push).toHaveBeenCalledWith("/applications?sent=1&pod=pod-visitor");
      expect(refresh).toHaveBeenCalledOnce();
    });
  });

  it("keeps the review step actionable when submission fails", async () => {
    submitPublicApplication.mockRejectedValue(new Error("Application already exists"));
    const user = userEvent.setup();
    render(
      <ApplicationForm
        podId="pod-error"
        questions={["Why join?"]}
        visitorConsent={null}
      />
    );

    await user.type(screen.getByLabelText("Why join?"), "To keep a steady cadence");
    await user.click(screen.getByRole("button", { name: "Review application" }));
    await user.click(screen.getByLabelText(/I understand that applying/));
    await user.click(screen.getByRole("button", { name: "Send application" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Application already exists"
    );
    expect(screen.getByRole("button", { name: "Send application" })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });
});
