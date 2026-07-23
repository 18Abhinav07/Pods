import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicVisitorRoom = vi.hoisted(() => vi.fn());
const consumeNetworkPublicLimit = vi.hoisted(() => vi.fn());
const podId = "430296c7-9554-43e6-9b43-bfd063391028";

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { getPublicVisitorRoom }
}));
vi.mock("../src/lib/public-rate-limit", () => ({
  consumeNetworkPublicLimit
}));

import { GET } from "../src/app/api/public/pods/[podId]/room/route";

describe("public visitor room API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PODS_PUBLIC_VISITOR_ROOMS_ENABLED", "true");
    consumeNetworkPublicLimit.mockResolvedValue({
      allowed: true,
      remaining: 39,
      resetAt: new Date("2027-04-05T12:01:00.000Z")
    });
  });

  it("returns the Pod-scoped public DTO without requiring a wallet", async () => {
    getPublicVisitorRoom.mockResolvedValue({
      pod: { id: "pod-1", stage: "live" },
      changeCursor: 12,
      lastSequence: 4,
      messages: []
    });

    const response = await GET(
      new Request(`http://localhost/api/public/pods/${podId}/room?after=2&limit=40`),
      { params: Promise.resolve({ podId }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getPublicVisitorRoom).toHaveBeenCalledWith({
      podId,
      afterSequence: 2,
      limit: 40
    });
  });

  it("serializes a public DTO that cannot carry private review fields", async () => {
    const privateReason = "Reviewer-only mismatch details must stay private.";
    getPublicVisitorRoom.mockResolvedValue({
      pod: {
        id: podId,
        stage: "live",
        state: "active",
        templateId: "build",
        name: "Ship in public",
        purpose: "Build with accountable peers.",
        roomState: "open",
        participantCount: 3,
        occurrenceCount: 2,
        creator: null,
        reviewDecision: { note: privateReason }
      },
      changeCursor: 12,
      lastSequence: 4,
      messages: [{
        id: "message-1",
        sequence: 4,
        kind: "activity",
        body: null,
        reply: null,
        hidden: false,
        pinned: false,
        createdAt: new Date("2027-04-05T08:00:00.000Z"),
        sender: null,
        activity: {
          occurrenceOrdinal: 1,
          localDate: "2027-04-05",
          task: "Ship the public visitor route",
          deliverableType: "Working route",
          state: "rejected",
          submissionId: "submission-1",
          resultSummary: "The public route is live.",
          artifactUrl: "https://example.com/proof",
          supportingImageAvailable: false,
          reviewDecision: { note: privateReason },
          reason: privateReason,
          note: privateReason
        },
        reactions: [],
        reviewDecision: { note: privateReason }
      }]
    });

    const response = await GET(
      new Request(`http://localhost/api/public/pods/${podId}/room`),
      { params: Promise.resolve({ podId }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.messages[0].activity).toMatchObject({
      state: "rejected",
      resultSummary: "The public route is live."
    });
    expect(payload.pod).not.toHaveProperty("reviewDecision");
    expect(payload.messages[0]).not.toHaveProperty("reviewDecision");
    expect(payload.messages[0].activity).not.toHaveProperty("reviewDecision");
    expect(payload.messages[0].activity).not.toHaveProperty("reason");
    expect(payload.messages[0].activity).not.toHaveProperty("note");
    expect(JSON.stringify(payload)).not.toContain(privateReason);
  });

  it("fails closed while the public visitor feature is disabled", async () => {
    vi.stubEnv("PODS_PUBLIC_VISITOR_ROOMS_ENABLED", "false");

    const response = await GET(
      new Request(`http://localhost/api/public/pods/${podId}/room`),
      { params: Promise.resolve({ podId }) }
    );

    expect(response.status).toBe(404);
    expect(getPublicVisitorRoom).not.toHaveBeenCalled();
  });

  it("returns a retry boundary before reading the room when the network bucket is exhausted", async () => {
    consumeNetworkPublicLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60_000)
    });

    const response = await GET(
      new Request(`http://localhost/api/public/pods/${podId}/room`),
      { params: Promise.resolve({ podId }) }
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
    expect(getPublicVisitorRoom).not.toHaveBeenCalled();
  });
});
