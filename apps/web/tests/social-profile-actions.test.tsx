import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SocialProfileActions } from "../src/components/social-profile-actions";

describe("public profile actions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })));
  });

  it("follows and sends friend requests without exposing user IDs", async () => {
    render(<SocialProfileActions handle="builder" initial={{ following: false, friend: false, request: null }} />);
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Add friend" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Request sent" })).toBeDisabled());
    expect(fetch).toHaveBeenCalledWith("/api/social/follows", expect.objectContaining({
      body: JSON.stringify({ handle: "builder" })
    }));
  });

  it("uses a controlled safety tray instead of a native details dropdown", () => {
    render(<SocialProfileActions handle="builder" initial={{ following: false, friend: false, request: null }} />);
    expect(document.querySelector("details")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More profile actions" }));
    expect(screen.getByRole("group", { name: "Profile safety actions" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Block profile" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Report profile" })).toHaveAttribute("href", "/report/builder");
  });

  it("accepts an incoming request and unlocks the message action", async () => {
    render(<SocialProfileActions handle="builder" initial={{
      following: true,
      friend: false,
      request: { id: "request-1", direction: "incoming" }
    }} />);
    fireEvent.click(screen.getByRole("button", { name: "Accept friend request" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Message" })).toHaveAttribute(
      "href",
      "/messages/new?handle=builder"
    ));
  });
});
