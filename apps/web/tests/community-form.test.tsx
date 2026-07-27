import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() })
}));

import { CommunityForm } from "../src/components/community-form";

describe("CommunityForm room audience", () => {
  it("uses clear access choices and a conventional public visitor switch", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CommunityForm
        initial={{
          visibility: "public",
          minParticipants: 2,
          maxParticipants: 8,
          applicationQuestions: ["What will you build?"],
          roomAudience: "members_only"
        }}
        podId="pod-1"
      />
    );

    expect(screen.getByRole("radio", { name: /Public Pod/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Private Pod/ })).not.toBeChecked();

    const visitors = screen.getByRole("switch", {
      name: "Allow read-only visitors"
    });
    expect(visitors).toHaveAttribute("aria-checked", "false");
    expect(
      container.querySelector<HTMLInputElement>('input[name="roomAudience"]')
    ).toHaveValue("members_only");

    await user.click(visitors);
    expect(visitors).toHaveAttribute("aria-checked", "true");
    expect(
      container.querySelector<HTMLInputElement>('input[name="roomAudience"]')
    ).toHaveValue("public_read_only");

    const questions = screen.getByLabelText(/Questions for applicants/);
    await user.clear(questions);
    await user.type(questions, "What will you ship this week?");
    await user.click(screen.getByRole("radio", { name: /Private Pod/ }));
    expect(screen.queryByRole("switch", { name: "Allow read-only visitors" }))
      .not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Invitation expiry"), "72");

    await user.click(screen.getByRole("radio", { name: /Public Pod/ }));
    expect(screen.getByLabelText(/Questions for applicants/))
      .toHaveValue("What will you ship this week?");
    await user.click(screen.getByRole("radio", { name: /Private Pod/ }));
    expect(screen.getByLabelText("Invitation expiry")).toHaveValue("72");
    expect(screen.getByText("You review the work")).toBeVisible();
  });
});
