import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh })
}));

import { ConnectClient } from "../src/components/connect-client";
import { ProfileOnboardingForm } from "../src/components/profile-onboarding-flow";

afterEach(() => {
  replace.mockReset();
  refresh.mockReset();
  vi.unstubAllGlobals();
});

describe("ProfileOnboardingForm", () => {
  it("keeps wallet connection concise and separate from profile setup", () => {
    render(<ConnectClient returnTo="/today" />);

    expect(screen.getByRole("heading", { name: "Connect your wallet" })).toBeVisible();
    expect(screen.getByText("One signature creates your Pods account.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeVisible();
    expect(screen.queryByText(/private key/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no password/i)).not.toBeInTheDocument();
  });

  it("collects identity and privacy choices before entering Pods", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          profile: {
            handle: "abhinav_07",
            displayName: "Abhinav"
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ProfileOnboardingForm returnTo="/today" />);

    expect(screen.getByRole("heading", { name: "Make your work recognizable" })).toBeVisible();
    expect(screen.getByLabelText("Step 1 of 3")).toBeVisible();
    expect(screen.queryByText("Your Pods identity")).not.toBeInTheDocument();
    expect(screen.queryByText("Identity")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Handle"), "Abhinav_07");
    await user.type(screen.getByLabelText("Display name"), "Abhinav");
    await user.type(
      screen.getByLabelText("Short bio"),
      "Building Pods in public with the Nimiq community."
    );
    await user.click(screen.getByRole("button", { name: "Choose an avatar" }));

    expect(
      screen.getByRole("heading", { name: "Choose a signal that feels like you" })
    ).toBeVisible();
    expect(screen.getByLabelText("Step 2 of 3")).toBeVisible();
    expect(screen.getAllByRole("button", { name: /^Choose .+ avatar$/ })).toHaveLength(12);
    expect(screen.getByRole("button", { name: "Upload your own photo" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Choose moss avatar" }));
    await user.click(screen.getByRole("button", { name: "Set boundaries" }));

    expect(
      screen.getByRole("heading", { name: "Choose what people can discover" })
    ).toBeVisible();
    expect(screen.getByLabelText("Step 3 of 3")).toBeVisible();
    await user.click(screen.getByLabelText("Public profile"));
    await user.click(screen.getByLabelText("Allow message requests"));
    await user.click(screen.getByRole("button", { name: "Enter Pods" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle: "Abhinav_07",
          displayName: "Abhinav",
          bio: "Building Pods in public with the Nimiq community.",
          avatar: { kind: "preset", preset: "moss" },
          visibility: "public",
          dmPolicy: "requests",
          activityStatusVisible: true
        })
      });
      expect(replace).toHaveBeenCalledWith("/today");
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("keeps a handle collision on the identity step with a field error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({ errors: { handle: "Profile handle is already taken" } }),
          { status: 409, headers: { "content-type": "application/json" } }
        )
      )
    );
    const user = userEvent.setup();
    render(<ProfileOnboardingForm returnTo="/today" />);

    await user.type(screen.getByLabelText("Handle"), "abhinav_07");
    await user.type(screen.getByLabelText("Display name"), "Abhinav");
    await user.click(screen.getByRole("button", { name: "Choose an avatar" }));
    await user.click(screen.getByRole("button", { name: "Set boundaries" }));
    await user.click(screen.getByRole("button", { name: "Enter Pods" }));

    expect(await screen.findByText("Profile handle is already taken")).toBeVisible();
    expect(screen.getByLabelText("Handle")).toBeVisible();
  });

  it("uses a save action when editing an existing profile", async () => {
    const user = userEvent.setup();
    render(
      <ProfileOnboardingForm
        initialProfile={{
          handle: "pods_builder",
          displayName: "Pods Builder",
          bio: "Building in public.",
          avatar: { kind: "preset", preset: "ember" },
          visibility: "public",
          dmPolicy: "requests",
          activityStatusVisible: true
        }}
        returnTo="/profile"
      />
    );

    await user.click(screen.getByRole("button", { name: "Choose an avatar" }));
    await user.click(screen.getByRole("button", { name: "Set boundaries" }));

    expect(screen.getByRole("button", { name: "Save profile" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Enter Pods" })).not.toBeInTheDocument();
  });
});
