import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppHeader } from "../src/components/app-header";

const profile = {
  displayName: "Mira",
  avatar: { kind: "preset" as const, preset: "moss" as const }
};

describe("AppHeader", () => {
  it("uses the route title as the single utility-page heading", () => {
    render(<AppHeader profile={profile} title="Messages" />);

    expect(screen.getByRole("heading", { name: "Messages" })).toBeVisible();
    expect(screen.queryByText("PODS")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Search people" })).toHaveAttribute(
      "href",
      "/people/search"
    );
    expect(screen.getByRole("link", { name: "Open updates" })).toBeVisible();
  });

  it("keeps the Pods wordmark for the Today home", () => {
    render(<AppHeader profile={profile} />);

    expect(screen.getByRole("link", { name: "Pods Today" })).toHaveTextContent("PODS");
  });
});
