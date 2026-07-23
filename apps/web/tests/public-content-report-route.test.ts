import { beforeEach, describe, expect, it, vi } from "vitest";

const reportPublicContent = vi.hoisted(() => vi.fn());
const getCurrentSession = vi.hoisted(() => vi.fn());
const consumeAccountPublicLimit = vi.hoisted(() => vi.fn());
const podId = "430296c7-9554-43e6-9b43-bfd063391028";
const messageId = "b5322c1c-4441-4f12-87ba-8fe6d68b20f5";

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { reportPublicContent }
}));
vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/public-rate-limit", () => ({
  consumeAccountPublicLimit
}));

import { POST } from "../src/app/api/public/pods/[podId]/reports/route";

describe("public content report route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PODS_PUBLIC_VISITOR_ROOMS_ENABLED", "true");
    vi.stubEnv("PODS_MODERATION_ENABLED", "true");
    getCurrentSession.mockResolvedValue({ userId: "user-1" });
    consumeAccountPublicLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetAt: new Date("2027-04-06T00:00:00.000Z")
    });
    reportPublicContent.mockResolvedValue({ id: "report-1", state: "pending" });
  });

  it("accepts a signed outsider report without requiring Pod membership", async () => {
    const response = await POST(
      new Request(`http://localhost/api/public/pods/${podId}/reports`, {
        method: "POST",
        body: JSON.stringify({
          targetKind: "message",
          targetId: messageId,
          reason: "unsafe_content",
          details: "This public message needs a safety review."
        })
      }),
      { params: Promise.resolve({ podId }) }
    );

    expect(response.status).toBe(201);
    expect(reportPublicContent).toHaveBeenCalledWith(expect.objectContaining({
      reporterUserId: "user-1",
      podId,
      targetKind: "message",
      targetId: messageId
    }));
  });

  it("requires a wallet session and never creates a report anonymously", async () => {
    getCurrentSession.mockResolvedValue(null);
    const response = await POST(
      new Request(`http://localhost/api/public/pods/${podId}/reports`, {
        method: "POST",
        body: JSON.stringify({
          targetKind: "message",
          targetId: messageId,
          reason: "spam",
          details: "Repeated public spam content."
        })
      }),
      { params: Promise.resolve({ podId }) }
    );

    expect(response.status).toBe(401);
    expect(reportPublicContent).not.toHaveBeenCalled();
  });

  it("stops at the account limit before writing another report", async () => {
    consumeAccountPublicLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60_000)
    });
    const response = await POST(
      new Request(`http://localhost/api/public/pods/${podId}/reports`, {
        method: "POST",
        body: JSON.stringify({
          targetKind: "message",
          targetId: messageId,
          reason: "spam",
          details: "Repeated public spam content."
        })
      }),
      { params: Promise.resolve({ podId }) }
    );

    expect(response.status).toBe(429);
    expect(reportPublicContent).not.toHaveBeenCalled();
  });
});
