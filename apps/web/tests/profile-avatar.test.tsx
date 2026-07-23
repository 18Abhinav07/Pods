import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileAvatar } from "../src/components/profile-avatar";

describe("ProfileAvatar", () => {
  it("renders preset identities as illustrated people instead of Pod tiles", () => {
    render(
      <ProfileAvatar
        avatar={{ kind: "preset", preset: "ember" }}
        displayName="Ryuk"
        size="large"
      />
    );

    const avatar = screen.getByRole("img", { name: "Ryuk avatar" });
    expect(avatar).toHaveClass("avatar-ember");
    expect(avatar).toHaveAttribute("data-avatar-kind", "preset");
    expect(avatar).toHaveAttribute("data-portrait", "ember");
    expect(avatar.querySelector("svg")).toBeInTheDocument();
    expect(avatar).not.toHaveTextContent("R");
    expect(avatar.querySelector("img")).not.toBeInTheDocument();
  });
});
