import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.queryByText("Testnet beta")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Search people" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open updates" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open wallet profile" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Open page actions" }));

    expect(screen.getByRole("dialog", { name: "Page actions" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Search people" })).toHaveAttribute(
      "href",
      "/people/search"
    );
    expect(screen.getByRole("link", { name: "Open updates" })).toBeVisible();
  });

  it("keeps the Pods wordmark for the Today home", () => {
    render(<AppHeader profile={profile} />);

    expect(screen.getByRole("link", { name: "Pods Today" })).toHaveTextContent("pods");
    expect(screen.queryByText("Testnet beta")).not.toBeInTheDocument();
  });

  it("moves the route action into the same compact bottom sheet", () => {
    render(
      <AppHeader
        action={{
          description: "Start a new accountability activity",
          href: "/pods/create/template",
          label: "Create a Pod"
        }}
        profile={profile}
        title="My Pods"
      />
    );

    expect(screen.queryByRole("link", { name: "Create a Pod" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open page actions" }));
    expect(screen.getByRole("link", { name: "Create a Pod" })).toHaveAttribute(
      "href",
      "/pods/create/template"
    );
    expect(screen.getByText("Start a new accountability activity")).toBeVisible();
  });

  it("contains keyboard focus inside the page-actions sheet and restores it on close", () => {
    render(<AppHeader profile={profile} title="Messages" />);

    const trigger = screen.getByRole("button", { name: "Open page actions" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Page actions" });
    const close = screen.getByRole("button", { name: "Close page actions" });
    const updates = screen.getByRole("link", { name: "Open updates" });
    expect(dialog).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(updates).toHaveFocus();

    updates.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(updates).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveFocus();
  });
});
