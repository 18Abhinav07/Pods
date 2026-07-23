import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() })
}));

import { CommunityForm } from "../src/components/community-form";

describe("CommunityForm room audience", () => {
  it("renders clean audience rows with the copy first and the radio control at the right", async () => {
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

    const membersOnly = screen.getByLabelText("Members only");
    const membersRow = membersOnly.closest("label");
    expect(membersRow).toHaveClass("visitor-audience-row", "is-selected");
    expect(membersRow?.lastElementChild).toBe(membersOnly);
    expect(
      within(membersRow as HTMLElement).getByText(
        "Only locked members can read the room and public proof record."
      )
    ).toBeVisible();

    const visitors = screen.getByLabelText("Let visitors follow along");
    await user.click(visitors);
    expect(visitors.closest("label")).toHaveClass("visitor-audience-row", "is-selected");
    expect(membersRow).not.toHaveClass("is-selected");
    expect(container.querySelectorAll(".visitor-audience-row")).toHaveLength(2);
    expect(screen.getByText(
      "The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds."
    )).toBeVisible();
  });
});
