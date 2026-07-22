import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.hoisted(() => vi.fn());
const repository = vi.hoisted(() => ({
  followProfile: vi.fn(),
  unfollowProfile: vi.fn(),
  sendFriendRequest: vi.fn(),
  respondToFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  blockProfile: vi.fn(),
  unblockProfile: vi.fn(),
  reportProfile: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({ podsRepository: repository }));

import { DELETE as unfollow, POST as follow } from "../src/app/api/social/follows/route";
import { POST as requestFriend } from "../src/app/api/social/friend-requests/route";
import { PATCH as decideRequest } from "../src/app/api/social/friend-requests/[requestId]/route";
import { DELETE as unfriend } from "../src/app/api/social/friendships/route";
import { DELETE as unblock, POST as block } from "../src/app/api/social/blocks/route";
import { POST as report } from "../src/app/api/social/reports/route";

describe("social APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue({ userId: "viewer-1" });
  });

  it("derives the social actor from the signed session", async () => {
    repository.followProfile.mockResolvedValue({ followedUserId: "target-1" });
    const response = await follow(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ handle: "builder", viewerUserId: "spoofed" })
    }));
    expect(response.status).toBe(201);
    expect(repository.followProfile).toHaveBeenCalledWith({
      viewerUserId: "viewer-1",
      handle: "builder"
    });
    repository.unfollowProfile.mockResolvedValue(true);
    expect((await unfollow(new Request("http://localhost", {
      method: "DELETE",
      body: JSON.stringify({ handle: "builder" })
    }))).status).toBe(204);
  });

  it("supports friend request creation and actor-specific decisions", async () => {
    repository.sendFriendRequest.mockResolvedValue({ id: "request-1", state: "pending" });
    expect((await requestFriend(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ handle: "builder" })
    }))).status).toBe(201);
    repository.respondToFriendRequest.mockResolvedValue({ id: "request-1", state: "accepted" });
    expect((await decideRequest(new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ action: "accept" })
    }), { params: Promise.resolve({ requestId: "request-1" }) })).status).toBe(200);
    expect(repository.respondToFriendRequest).toHaveBeenCalledWith(expect.objectContaining({
      requestId: "request-1",
      userId: "viewer-1",
      action: "accept"
    }));
  });

  it("supports unfriend, block, unblock, and bounded reporting", async () => {
    repository.removeFriend.mockResolvedValue(true);
    expect((await unfriend(new Request("http://localhost", {
      method: "DELETE",
      body: JSON.stringify({ handle: "builder" })
    }))).status).toBe(204);
    repository.blockProfile.mockResolvedValue({ blocked: true });
    expect((await block(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ handle: "builder" })
    }))).status).toBe(200);
    repository.unblockProfile.mockResolvedValue(true);
    expect((await unblock(new Request("http://localhost", {
      method: "DELETE",
      body: JSON.stringify({ handle: "builder" })
    }))).status).toBe(204);

    const invalid = await report(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ handle: "builder", reason: "", details: "" })
    }));
    expect(invalid.status).toBe(400);
    repository.reportProfile.mockResolvedValue({ id: "report-1" });
    expect((await report(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ handle: "builder", reason: "spam", details: "Repeated unsolicited messages." })
    }))).status).toBe(201);
  });
});
