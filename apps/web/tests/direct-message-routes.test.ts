import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.hoisted(() => vi.fn());
const repository = vi.hoisted(() => ({
  openDirectConversation: vi.fn(),
  listConversationMessages: vi.fn(),
  listDirectConversationRequests: vi.fn(),
  respondToDirectConversation: vi.fn()
}));
vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({ podsRepository: repository }));

import { POST as openConversation } from "../src/app/api/conversations/route";
import { GET as listMessages } from "../src/app/api/conversations/[conversationId]/messages/route";
import { GET as listRequests } from "../src/app/api/conversations/requests/route";
import { PATCH as decideRequest } from "../src/app/api/conversations/[conversationId]/request/route";

describe("direct conversation APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue({ userId: "sender-1" });
  });

  it("opens a direct thread without trusting a client actor", async () => {
    repository.openDirectConversation.mockResolvedValue({
      conversation: { id: "conversation-1" },
      visibleState: "pending"
    });
    const response = await openConversation(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ handle: "reader", introduction: "Your public reading Pod looks thoughtful.", senderUserId: "spoofed" })
    }));
    expect(response.status).toBe(201);
    expect(repository.openDirectConversation).toHaveBeenCalledWith(expect.objectContaining({
      senderUserId: "sender-1",
      handle: "reader"
    }));
  });

  it("lists incoming requests and limits request decisions to the session recipient", async () => {
    repository.listDirectConversationRequests.mockResolvedValue([]);
    expect((await listRequests()).status).toBe(200);
    repository.respondToDirectConversation.mockResolvedValue({ id: "conversation-1", directState: "active" });
    const response = await decideRequest(new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ action: "accept", recipientUserId: "spoofed" })
    }), { params: Promise.resolve({ conversationId: "conversation-1" }) });
    expect(response.status).toBe(200);
    expect(repository.respondToDirectConversation).toHaveBeenCalledWith(expect.objectContaining({
      recipientUserId: "sender-1",
      action: "accept"
    }));
  });

  it("loads an authorized bounded context around an exact reply target", async () => {
    const aroundMessageId = "00000000-0000-4000-8000-000000000008";
    repository.listConversationMessages.mockResolvedValue({
      conversation: { id: "conversation-1", lastSequence: 8 },
      messages: []
    });
    const response = await listMessages(
      new Request(`http://localhost/api/conversations/conversation-1/messages?around=${aroundMessageId}&limit=40`),
      { params: Promise.resolve({ conversationId: "conversation-1" }) }
    );
    expect(response.status).toBe(200);
    expect(repository.listConversationMessages).toHaveBeenCalledWith({
      conversationId: "conversation-1",
      userId: "sender-1",
      afterSequence: 0,
      aroundMessageId,
      limit: 40
    });

    getCurrentSession.mockResolvedValueOnce(null);
    const unauthorized = await listMessages(
      new Request(`http://localhost/api/conversations/conversation-1/messages?around=${aroundMessageId}`),
      { params: Promise.resolve({ conversationId: "conversation-1" }) }
    );
    expect(unauthorized.status).toBe(401);
  });
});
