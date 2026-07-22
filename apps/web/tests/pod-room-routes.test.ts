import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  ensurePodConversation: vi.fn(),
  listConversationMessages: vi.fn(),
  postConversationMessage: vi.fn(),
  markConversationRead: vi.fn(),
  setMessageReaction: vi.fn(),
  removeMessageReaction: vi.fn(),
  hideConversationMessage: vi.fn(),
  pinConversationAnnouncement: vi.fn(),
  setPodRoomState: vi.fn()
}));
const getCurrentSession = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/server-db", () => ({ podsRepository: repository }));
vi.mock("../src/lib/session", () => ({ getCurrentSession }));

import { POST as openRoom } from "../src/app/api/pods/[podId]/room/route";
import {
  GET as listMessages,
  POST as sendMessage
} from "../src/app/api/conversations/[conversationId]/messages/route";
import { POST as markRead } from "../src/app/api/conversations/[conversationId]/read/route";
import {
  DELETE as removeReaction,
  PUT as react
} from "../src/app/api/messages/[messageId]/reactions/route";
import { POST as moderate } from "../src/app/api/messages/[messageId]/moderation/route";
import { PUT as pin } from "../src/app/api/messages/[messageId]/pin/route";
import { PUT as changeRoomState } from "../src/app/api/conversations/[conversationId]/state/route";

const params = <T extends Record<string, string>>(value: T) => ({ params: Promise.resolve(value) });

describe("Pod room APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue({ userId: "user-1" });
  });

  it("creates one authorized Pod room and keeps access failures private", async () => {
    repository.ensurePodConversation.mockResolvedValue({ id: "room-1", roomState: "open" });
    const response = await openRoom(
      new Request("http://localhost/api/pods/pod-1/room", { method: "POST" }),
      params({ podId: "pod-1" })
    );
    expect(response.status).toBe(200);
    expect(repository.ensurePodConversation).toHaveBeenCalledWith({
      podId: "pod-1",
      userId: "user-1"
    });

    repository.ensurePodConversation.mockRejectedValueOnce(
      new Error("Pod room access requires a locked roster place")
    );
    const denied = await openRoom(
      new Request("http://localhost/api/pods/private/room", { method: "POST" }),
      params({ podId: "private" })
    );
    expect(denied.status).toBe(404);
  });

  it("validates, sends, and lists messages using the signed session actor", async () => {
    repository.postConversationMessage.mockResolvedValue({ id: "message-1", sequence: 4 });
    const sent = await sendMessage(
      new Request("http://localhost/api/conversations/room-1/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientMessageId: "ca1bd4c7-d5d2-42eb-9910-7f2b345dcbbb",
          body: "The mobile proof flow is ready.",
          replyToMessageId: null,
          kind: "member_message",
          userId: "spoofed"
        })
      }),
      params({ conversationId: "room-1" })
    );
    expect(sent.status).toBe(201);
    expect(repository.postConversationMessage).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", kind: "member_message" })
    );

    const invalid = await sendMessage(
      new Request("http://localhost/api/conversations/room-1/messages", {
        method: "POST",
        body: JSON.stringify({ body: "", clientMessageId: "bad" })
      }),
      params({ conversationId: "room-1" })
    );
    expect(invalid.status).toBe(400);

    repository.listConversationMessages.mockResolvedValue({
      conversation: { id: "room-1", lastSequence: 4 },
      messages: []
    });
    const listed = await listMessages(
      new Request("http://localhost/api/conversations/room-1/messages?after=2&limit=30"),
      params({ conversationId: "room-1" })
    );
    expect(listed.status).toBe(200);
    expect(repository.listConversationMessages).toHaveBeenCalledWith({
      conversationId: "room-1",
      userId: "user-1",
      afterSequence: 2,
      aroundMessageId: null,
      limit: 30
    });
  });

  it("supports read cursors, reaction removal, moderation, pinning, and archive control", async () => {
    repository.markConversationRead.mockResolvedValue({ lastReadSequence: 9 });
    expect((await markRead(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ sequence: 9 }) }),
      params({ conversationId: "room-1" })
    )).status).toBe(200);

    repository.setMessageReaction.mockResolvedValue({ code: "support" });
    expect((await react(
      new Request("http://localhost", { method: "PUT", body: JSON.stringify({ code: "support" }) }),
      params({ messageId: "message-1" })
    )).status).toBe(200);
    expect((await removeReaction(
      new Request("http://localhost", { method: "DELETE" }),
      params({ messageId: "message-1" })
    )).status).toBe(204);

    repository.hideConversationMessage.mockResolvedValue({ id: "message-1" });
    expect((await moderate(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ conversationId: "room-1" }) }),
      params({ messageId: "message-1" })
    )).status).toBe(200);

    repository.pinConversationAnnouncement.mockResolvedValue({ id: "announcement-1", pinnedAt: new Date() });
    expect((await pin(
      new Request("http://localhost", { method: "PUT", body: JSON.stringify({ conversationId: "room-1", pinned: true }) }),
      params({ messageId: "announcement-1" })
    )).status).toBe(200);

    repository.setPodRoomState.mockResolvedValue({ id: "room-1", roomState: "archived" });
    expect((await changeRoomState(
      new Request("http://localhost", { method: "PUT", body: JSON.stringify({ roomState: "archived" }) }),
      params({ conversationId: "room-1" })
    )).status).toBe(200);
  });

  it("requires a wallet session for every room mutation", async () => {
    getCurrentSession.mockResolvedValue(null);
    const response = await sendMessage(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          clientMessageId: "ca1bd4c7-d5d2-42eb-9910-7f2b345dcbbb",
          body: "hello"
        })
      }),
      params({ conversationId: "room-1" })
    );
    expect(response.status).toBe(401);
  });
});
