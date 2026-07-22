import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
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
  useRouter: () => ({ push, refresh })
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
  refresh.mockReset();
  vi.unstubAllGlobals();
});

describe("ProfilePage", () => {
  it("owns following and friends without exposing a global member directory", async () => {
    render(await ProfilePage());

    expect(screen.getByRole("heading", { name: "Your people" })).toBeVisible();
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
});
