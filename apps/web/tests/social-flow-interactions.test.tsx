import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace })
}));

import { DirectRequestList } from "../src/components/direct-request-list";
import { DirectStartForm } from "../src/components/direct-start-form";
import { FriendRequestList } from "../src/components/friend-request-list";
import { SocialProfileActions } from "../src/components/social-profile-actions";
import { TargetedInvitationList } from "../src/components/targeted-invitation-list";

const avatar = { kind: "preset", preset: "moss" } as const;

describe("social flow interactions", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    vi.unstubAllGlobals();
  });

  it("prevents duplicate friend decisions and reports a failed decision inline", async () => {
    let resolveRequest!: (response: Response) => void;
    const response = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn<typeof fetch>(() => response);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <FriendRequestList
        initialRequests={[{
          id: "friend-1",
          direction: "incoming",
          profile: { handle: "mina", displayName: "Mina Sol", avatar }
        }]}
      />
    );

    const accept = screen.getByRole("button", { name: "Accept Mina Sol" });
    await user.click(accept);
    fireEvent.click(accept);
    expect(accept).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveRequest(new Response(JSON.stringify({ error: "Try again" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(
      "Friend request could not be updated."
    ));
    expect(screen.getByText("Mina Sol")).toBeVisible();
  });

  it("keeps message request actions explicit and preserves the card on failure", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "Try again" }), {
        status: 500,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <DirectRequestList
        initialRequests={[{
          conversationId: "conversation-1",
          introduction: "I would like to compare build notes.",
          sender: { handle: "noah", displayName: "Noah Mercer", avatar }
        }]}
      />
    );

    expect(screen.getByRole("button", { name: "Accept Noah Mercer" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Discard Noah Mercer" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Block Noah Mercer" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Discard Noah Mercer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Message request could not be updated."
    );
    expect(screen.getByText("Noah Mercer")).toBeVisible();
  });

  it("shows a sender-safe sent state for a pending introduction", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        conversation: { id: "conversation-2" },
        visibleState: "pending"
      }), {
        status: 201,
        headers: { "content-type": "application/json" }
      })
    ));
    const user = userEvent.setup();
    render(<DirectStartForm friend={false} handle="noah" />);

    await user.type(screen.getByRole("textbox", { name: "Introduction" }), "I would like to compare build notes.");
    await user.click(screen.getByRole("button", { name: "Send request" }));

    expect(await screen.findByRole("heading", { name: "Request sent" })).toBeVisible();
    expect(screen.getByText(/You will not be told if they discard it/)).toBeVisible();
    expect(replace).not.toHaveBeenCalled();
  });

  it("opens profile safety actions as an accessible tray and restores focus", async () => {
    const user = userEvent.setup();
    render(
      <SocialProfileActions
        handle="builder"
        initial={{ following: false, friend: false, request: null }}
      />
    );

    const trigger = screen.getByRole("button", { name: "More profile actions" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Profile safety actions" })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Profile safety actions" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("shows targeted invitation progress and failure without removing the request", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "Unavailable" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      })
    ));
    const user = userEvent.setup();
    render(
      <TargetedInvitationList
        initialInvitations={[{
          invitationId: "invite-1",
          podId: "pod-1",
          activityName: "Build Pods in public",
          purpose: "Ship one visible improvement.",
          totalLuna: 30_000,
          occurrenceCount: 3
        }]}
      />
    );
    await user.click(screen.getByRole("button", { name: "Accept and fund Build Pods in public" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invitation could not be accepted."
    );
    expect(screen.getByText("Build Pods in public")).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });
});
