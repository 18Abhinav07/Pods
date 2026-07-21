import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh })
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({
    walletAddress: "NQ00 HAPPY PATH WALLET"
  }))
}));

import ProfilePage from "../src/app/profile/page";

afterEach(() => {
  push.mockReset();
  refresh.mockReset();
  vi.unstubAllGlobals();
});

describe("ProfilePage", () => {
  it("offers an explicit wallet-session switch action", async () => {
    render(await ProfilePage());

    expect(
      screen.getByRole("button", { name: "Sign out and switch wallet" })
    ).toBeVisible();
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
