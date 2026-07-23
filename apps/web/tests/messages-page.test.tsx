import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  listFriends: vi.fn(),
  listDirectConversationSummaries: vi.fn(),
  listFriendRequests: vi.fn(),
  listDirectConversationRequests: vi.fn(),
  listTargetedInvitations: vi.fn()
}));

vi.mock("../src/lib/server-db", () => ({ podsRepository: repository }));
vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({
    userId: "user-1",
    profile: {
      displayName: "Mira",
      handle: "mira",
      avatar: { kind: "preset", preset: "moss" }
    }
  }))
}));

import MessagesPage from "../src/app/messages/page";

describe("MessagesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.listFriends.mockResolvedValue([]);
    repository.listDirectConversationSummaries.mockResolvedValue([]);
    repository.listFriendRequests.mockResolvedValue([]);
    repository.listDirectConversationRequests.mockResolvedValue([]);
    repository.listTargetedInvitations.mockResolvedValue([]);
  });

  it("opens on people and requests without duplicating Pod inventory", async () => {
    const { container } = render(await MessagesPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Messages" })).toBeVisible();
    expect(screen.getByRole("link", { name: "People" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Requests" })).toBeVisible();
    expect(container.querySelector(".message-segments")).toHaveClass("is-compact-switch");
    expect(screen.queryByRole("link", { name: "Pod Rooms" })).not.toBeInTheDocument();
    expect(screen.getByText("No conversations yet.")).toBeVisible();
  });
});
