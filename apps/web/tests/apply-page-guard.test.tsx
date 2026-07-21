import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn()
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "creator-1" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getPublicPod: vi.fn(async () => ({
      id: "pod-1",
      creatorUserId: "creator-1",
      contractData: {
        community: { visibility: "public", applicationQuestions: [] },
        activity: { name: "Creator Pod" }
      }
    })),
    getMembershipForUser: vi.fn(async () => null)
  }
}));

import ApplyPage from "../src/app/pods/[podId]/apply/page";

describe("ApplyPage creator guard", () => {
  it("does not render an application form for the Pod creator", async () => {
    await expect(
      ApplyPage({ params: Promise.resolve({ podId: "pod-1" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
