import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { push, replace, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn()
}));

const { listFollowingProfiles, listFriends } = vi.hoisted(() => ({
  listFollowingProfiles: vi.fn(async () => [
    {
      handle: "mira_moves",
      displayName: "Mira",
      bio: "Running before sunrise.",
      avatar: { kind: "preset", preset: "moss" },
      activityStatusVisible: true
    }
  ]),
  listFriends: vi.fn(async () => [
    {
      handle: "dev_ship",
      displayName: "Dev",
      bio: "Shipping daily.",
      avatar: { kind: "preset", preset: "indigo" },
      activityStatusVisible: true
    }
  ])
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh })
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({
    userId: "user-1",
    walletAddress: "NQ00 HAPPY PATH WALLET",
    profile: {
      handle: "pods_builder",
      displayName: "Pods Builder",
      bio: "Building in public.",
      avatar: { kind: "preset", preset: "ember" },
      visibility: "public",
      dmPolicy: "requests",
      activityStatusVisible: true
    }
  }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { listFollowingProfiles, listFriends }
}));

import ProfilePage from "../src/app/profile/page";

afterEach(() => {
  push.mockReset();
  replace.mockReset();
  refresh.mockReset();
  vi.unstubAllGlobals();
});

describe("ProfilePage", () => {
  it("owns following and friends without exposing a global member directory", async () => {
    const { container } = render(await ProfilePage());

    expect(screen.getByRole("heading", { name: "Your people" })).toBeVisible();
    expect(container.querySelector(".private-profile-cover")).toHaveClass("is-compact-identity");
    expect(container.querySelector(".profile-signal-strip")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Search people" })).toHaveAttribute(
      "href",
      "/people/search"
    );
    expect(screen.getByRole("link", { name: /Mira/ })).toHaveAttribute(
      "href",
      "/u/mira_moves"
    );
    expect(screen.getByRole("link", { name: /Dev/ })).toHaveAttribute(
      "href",
      "/u/dev_ship"
    );
    expect(listFollowingProfiles).toHaveBeenCalledWith("user-1");
    expect(listFriends).toHaveBeenCalledWith("user-1");
  });

  it("keeps profile controls behind one icon settings sheet", async () => {
    render(await ProfilePage());

    const trigger = screen.getByRole("button", { name: "Open profile settings" });
    expect(trigger).toBeVisible();
    expect(screen.queryByRole("button", { name: "Sign out and switch wallet" })).not.toBeInTheDocument();

    await userEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Profile settings" });
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Wallet and session" })).toBeVisible();
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Profile settings" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("ends the current session before opening the wallet connection gate", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ signedOut: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(await ProfilePage());

    await userEvent.click(screen.getByRole("button", { name: "Open profile settings" }));
    await userEvent.click(screen.getByRole("button", { name: "Wallet and session" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Sign out and switch wallet" })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
      expect(push).toHaveBeenCalledWith("/connect?returnTo=%2Ftoday");
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("shows progress while saving an edit and closes the sheet after success", async () => {
    let resolveSave!: (response: Response) => void;
    const saveResponse = new Promise<Response>((resolve) => {
      resolveSave = resolve;
    });
    const fetchMock = vi.fn<typeof fetch>(() => saveResponse);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(await ProfilePage());

    await user.click(screen.getByRole("button", { name: "Open profile settings" }));
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    await user.click(screen.getByRole("button", { name: "Continue to your story" }));
    await user.click(screen.getByRole("button", { name: "Continue to privacy" }));

    const saveButton = screen.getByRole("button", { name: "Save profile" });
    await user.click(saveButton);

    expect(screen.getByRole("button", { name: "Saving profile" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving profile" })).toHaveAttribute(
      "aria-busy",
      "true"
    );
    expect(screen.getByTestId("profile-save-spinner")).toBeVisible();

    resolveSave(
      new Response(JSON.stringify({ profile: { handle: "pods_builder" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Profile settings" })).not.toBeInTheDocument();
      expect(refresh).toHaveBeenCalled();
    });
  });
});
