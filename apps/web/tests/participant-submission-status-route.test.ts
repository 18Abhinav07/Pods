import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => vi.fn());
const getSubmissionForOwner = vi.hoisted(() => vi.fn());
const getProfileForUser = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/session", () => ({ getCurrentSession: session }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getProfileForUser,
    getSubmissionForOwner
  }
}));

import { GET } from "../src/app/api/pods/[podId]/submissions/[submissionId]/route";

const podId = "11111111-1111-4111-8111-111111111111";
const submissionId = "22222222-2222-4222-8222-222222222222";
const params = {
  params: Promise.resolve({ podId, submissionId })
};

describe("participant submission status route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockResolvedValue({ userId: "member-1" });
    getSubmissionForOwner.mockResolvedValue({
      submission: {
        id: submissionId,
        state: "reviewing",
        proofShareMode: "reviewer_only",
        evidenceObjectKey: "private/do-not-return.webp",
        submittedAt: new Date("2027-04-05T08:00:00.000Z"),
        reviewTargetAt: new Date("2027-04-05T20:00:00.000Z"),
        reviewHardDeadlineAt: new Date("2027-04-06T08:00:00.000Z")
      },
      pod: {
        id: podId,
        creatorUserId: "creator-1"
      },
      reviewDecision: null
    });
    getProfileForUser.mockResolvedValue({
      handle: "ryuk",
      displayName: "Abhinav",
      avatar: { kind: "preset", preset: "ember" },
      userId: "creator-1"
    });
  });

  it("requires the signed wallet session", async () => {
    session.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), params);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Wallet session required"
    });
  });

  it("rejects malformed identifiers before querying submission data", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({
        podId: "not-a-pod",
        submissionId
      })
    });

    expect(response.status).toBe(404);
    expect(getSubmissionForOwner).not.toHaveBeenCalled();
  });

  it("returns only the owner-safe live status and creator presentation", async () => {
    const response = await GET(new Request("http://localhost"), params);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      status: {
        state: "reviewing",
        proofShareMode: "reviewer_only",
        creator: {
          handle: "ryuk",
          displayName: "Abhinav",
          avatar: { kind: "preset", preset: "ember" }
        }
      }
    });
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("private/do-not-return.webp");
    expect(serialized).not.toContain("creatorUserId");
    expect(serialized).not.toContain("wallet");
    expect(serialized).not.toContain("userId");
  });

  it("does not reveal a submission through the wrong Pod route", async () => {
    getSubmissionForOwner.mockResolvedValueOnce({
      submission: { id: submissionId },
      pod: { id: "33333333-3333-4333-8333-333333333333" }
    });

    const response = await GET(new Request("http://localhost"), params);

    expect(response.status).toBe(404);
    expect(getProfileForUser).not.toHaveBeenCalled();
  });
});
