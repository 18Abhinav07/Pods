import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublishClient } from "../src/components/publish-client";
import { publishPodDraft } from "../src/lib/wizard-client";

vi.mock("../src/lib/wizard-client", () => ({
  publishPodDraft: vi.fn()
}));

describe("PublishClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an explicit published state before the creator continues", async () => {
    const user = userEvent.setup();
    vi.mocked(publishPodDraft).mockResolvedValue({} as never);
    render(<PublishClient podId="pod-1" />);

    const publish = screen.getByRole("button", { name: "Publish Pod" });
    expect(publish).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /Freeze this contract/ }));
    await user.click(publish);

    expect(await screen.findByText("Pod published", { exact: true })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Open frozen contract" })
    ).toHaveAttribute("href", "/pods/pod-1/rules");
  });
});
