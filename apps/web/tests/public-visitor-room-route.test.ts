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
