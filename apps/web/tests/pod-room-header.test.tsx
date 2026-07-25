import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PodRoomHeader } from "../src/components/pod-room-header";

describe("PodRoomHeader", () => {
  it("keeps the room primary and reveals Pod reference tools on demand", () => {
    render(
      <PodRoomHeader
        isCreator={false}
        memberCount={4}
        name="Pods Build Room"
        podId="pod-1"
        thumbnail="/media/build.jpg"
      />
    );

    expect(screen.getByRole("heading", { name: "Pods Build Room" })).toBeVisible();
    expect(screen.queryByText("Testnet beta")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Back to My Pods" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Proofs" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open updates" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Pod tools" }));

    const dialog = screen.getByRole("dialog", { name: "Pod tools" });
    expect(dialog).toBeVisible();
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(screen.getByRole("link", { name: "Proofs" })).toHaveAttribute("href", "/pods/pod-1/activity");
    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute("href", "/pods/pod-1/members");
    expect(screen.getByRole("link", { name: "Contract" })).toHaveAttribute("href", "/pods/pod-1/rules");
    expect(screen.getByRole("link", { name: "Open updates" })).toHaveAttribute("href", "/updates");
    expect(screen.queryByRole("link", { name: "Creator controls" })).not.toBeInTheDocument();
  });

  it("adds creator controls only for the creator", () => {
    render(
      <PodRoomHeader
        isCreator
        memberCount={3}
        name="Run at Night"
        podId="pod-2"
        thumbnail="/media/fitness.jpg"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Pod tools" }));
    expect(screen.getByRole("link", { name: "Creator controls" })).toHaveAttribute("href", "/pods/pod-2/admin");
  });

  it("contains keyboard focus inside Pod tools and restores it to the trigger", () => {
    render(
      <PodRoomHeader
        isCreator={false}
        memberCount={4}
        name="Pods Build Room"
        podId="pod-1"
        thumbnail="/media/build.jpg"
      />
    );

    const trigger = screen.getByRole("button", { name: "Open Pod tools" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Pod tools" });
    const close = screen.getByRole("button", { name: "Close Pod tools" });
    const share = screen.getByRole("button", { name: "Share Pod" });
    expect(dialog).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(share).toHaveFocus();

    share.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(share).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveFocus();
  });
});
