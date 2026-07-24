import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession, getPodForOwner, publishDraft } = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getPodForOwner: vi.fn(),
  publishDraft: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { getPodForOwner, publishDraft }
}));

import { GET as preview } from "../src/app/api/pods/drafts/[podId]/preview/route";
import { POST as publish } from "../src/app/api/pods/drafts/[podId]/publish/route";

describe("proportional publication controls", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv("PODS_DEPOSIT_MODE", "public");
    vi.stubEnv("PODS_SETTLEMENT_ENABLED", "true");
    vi.stubEnv("PODS_PROPORTIONAL_PUBLISHING_ENABLED", "false");
    getCurrentSession.mockResolvedValue({ userId: "creator-1" });
    getPodForOwner.mockResolvedValue({
      id: "pod-1",
      templateId: "build",
      draftData: {
        activity: {},
        community: {},
        commitment: {}
      }
    });
  });

  it("returns an explicit pause response from preview", async () => {
    const response = await preview(new Request("http://localhost"), {
      params: Promise.resolve({ podId: "pod-1" })
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Pod publication is paused"
    });
  });

  it("does not publish a draft while proportional publication is paused", async () => {
    const response = await publish(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ acceptedFrozenContract: true })
      }),
      { params: Promise.resolve({ podId: "pod-1" }) }
    );

    expect(response.status).toBe(503);
    expect(publishDraft).not.toHaveBeenCalled();
  });
});
