import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.hoisted(() => vi.fn());
const repository = vi.hoisted(() => ({
  decideSubmissionAsCreator: vi.fn(),
  getEffectiveTime: vi.fn(),
  listPendingReviewsForCreator: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({ podsRepository: repository }));

import { GET as listReviews } from "../src/app/api/pods/[podId]/admin/reviews/route";
import { POST as decideReview } from "../src/app/api/pods/[podId]/admin/reviews/[submissionId]/decision/route";

const podId = "430296c7-9554-43e6-9b43-bfd063391028";
const submissionId = "b5322c1c-4441-4f12-87ba-8fe6d68b20f5";
const occurrenceId = "5c195050-5b5b-4145-ad90-df57fd5ed12d";
const effectiveNow = new Date("2027-04-05T12:01:00.000Z");

function routeParams<T extends { podId: string }>(value: T) {
  return { params: Promise.resolve(value) };
}

function decisionRequest(body: unknown) {
  return new Request(`http://localhost/api/pods/${podId}/admin/reviews/${submissionId}/decision`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("creator review queue route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue({ userId: "creator-user-id" });
  });

  it("requires a wallet session", async () => {
    getCurrentSession.mockResolvedValue(null);

    const response = await listReviews(
      new Request(`http://localhost/api/pods/${podId}/admin/reviews`),
      routeParams({ podId })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Wallet session required" });
    expect(repository.listPendingReviewsForCreator).not.toHaveBeenCalled();
  });

  it("rejects a malformed Pod id before repository access", async () => {
    const response = await listReviews(
      new Request("http://localhost/api/pods/not-a-uuid/admin/reviews"),
      routeParams({ podId: "not-a-uuid" })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Pod not found" });
    expect(repository.listPendingReviewsForCreator).not.toHaveBeenCalled();
  });

  it("keeps missing and unauthorized Pods indistinguishable", async () => {
    repository.listPendingReviewsForCreator.mockResolvedValue(null);

    const response = await listReviews(
      new Request(`http://localhost/api/pods/${podId}/admin/reviews`),
      routeParams({ podId })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Pod not found" });
    expect(repository.listPendingReviewsForCreator).toHaveBeenCalledWith({
      creatorUserId: "creator-user-id",
      podId
    });
  });

  it("returns only the creator-safe queue DTO", async () => {
    repository.listPendingReviewsForCreator.mockResolvedValue([{
      submission: {
        id: submissionId,
        state: "reviewing",
        submittedAt: new Date("2027-04-05T11:00:00.000Z"),
        reviewTargetAt: new Date("2027-04-05T23:00:00.000Z"),
        reviewHardDeadlineAt: new Date("2027-04-06T11:00:00.000Z"),
        evidenceObjectKey: "private/creator-only.webp",
        membershipId: "secret-membership",
        reviewerId: "secret-reviewer",
        resultSummary: "secret review context"
      },
      occurrence: {
        id: occurrenceId,
        ordinal: 4,
        localDate: "2027-04-05",
        podId,
        secret: "not-safe"
      },
      commitment: {
        task: "Ship the creator review flow",
        deliverableType: "pull_request",
        membershipId: "secret-membership"
      },
      participant: {
        handle: "pods-builder",
        displayName: "Pods Builder",
        avatar: { kind: "preset", preset: "indigo" },
        userId: "secret-user",
        walletAddress: "NQ00 SECRET"
      }
    }]);

    const response = await listReviews(
      new Request(`http://localhost/api/pods/${podId}/admin/reviews`),
      routeParams({ podId })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviews: [{
        submission: {
          id: submissionId,
          state: "reviewing",
          submittedAt: "2027-04-05T11:00:00.000Z",
          reviewTargetAt: "2027-04-05T23:00:00.000Z",
          reviewHardDeadlineAt: "2027-04-06T11:00:00.000Z"
        },
        occurrence: {
          id: occurrenceId,
          ordinal: 4,
          localDate: "2027-04-05"
        },
        commitment: {
          task: "Ship the creator review flow",
          deliverableType: "pull_request"
        },
        participant: {
          handle: "pods-builder",
          displayName: "Pods Builder",
          avatar: { kind: "preset", preset: "indigo" }
        },
        evidenceAvailable: true
      }]
    });
  });
});

describe("creator review decision route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue({ userId: "creator-user-id" });
    repository.getEffectiveTime.mockResolvedValue(effectiveNow);
  });

  it("requires a wallet session", async () => {
    getCurrentSession.mockResolvedValue(null);

    const response = await decideReview(
      decisionRequest({ decision: "approve", note: "" }),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Wallet session required" });
    expect(repository.decideSubmissionAsCreator).not.toHaveBeenCalled();
  });

  it("rejects malformed route ids before repository access", async () => {
    const response = await decideReview(
      decisionRequest({ decision: "approve", note: "" }),
      routeParams({ podId, submissionId: "not-a-uuid" })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Submission not found" });
    expect(repository.getEffectiveTime).not.toHaveBeenCalled();
    expect(repository.decideSubmissionAsCreator).not.toHaveBeenCalled();
  });

  it("returns the first decision validation error", async () => {
    const response = await decideReview(
      decisionRequest({ decision: "reject", reason: "too short" }),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Explain the rejection in 12 to 500 characters"
    });
    expect(repository.getEffectiveTime).not.toHaveBeenCalled();
    expect(repository.decideSubmissionAsCreator).not.toHaveBeenCalled();
  });

  it("uses effective time and only the signed creator actor for a rejection", async () => {
    repository.decideSubmissionAsCreator.mockResolvedValue({
      kind: "decided",
      submission: {
        id: submissionId,
        state: "rejected",
        reviewedAt: effectiveNow,
        approvedAt: null
      }
    });

    const response = await decideReview(
      decisionRequest({
        decision: "reject",
        reason: "The artifact does not complete the locked task.",
        creatorUserId: "spoofed-creator",
        reviewerId: "spoofed-reviewer",
        actor: "spoofed-actor"
      }),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(200);
    expect(repository.getEffectiveTime).toHaveBeenCalledWith(expect.any(Date));
    expect(repository.decideSubmissionAsCreator).toHaveBeenCalledWith({
      creatorUserId: "creator-user-id",
      podId,
      submissionId,
      decision: {
        decision: "reject",
        reason: "The artifact does not complete the locked task."
      },
      now: effectiveNow
    });
  });

  it("keeps missing and unauthorized submissions indistinguishable", async () => {
    repository.decideSubmissionAsCreator.mockResolvedValue(null);

    const response = await decideReview(
      decisionRequest({ decision: "approve", note: "Clear proof." }),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Submission not found" });
  });

  it("returns a conflict when the proof already has a final result", async () => {
    repository.decideSubmissionAsCreator.mockResolvedValue({
      kind: "already_decided",
      submission: { id: submissionId, state: "approved" }
    });

    const response = await decideReview(
      decisionRequest({ decision: "approve", note: "Clear proof." }),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "This proof already has a final result"
    });
  });

  it("returns only the safe final submission DTO", async () => {
    repository.decideSubmissionAsCreator.mockResolvedValue({
      kind: "decided",
      submission: {
        id: submissionId,
        state: "approved",
        reviewedAt: effectiveNow,
        approvedAt: effectiveNow,
        membershipId: "secret-membership",
        reviewerId: "secret-reviewer",
        evidenceObjectKey: "private/secret.webp",
        note: "secret note"
      }
    });

    const response = await decideReview(
      decisionRequest({ decision: "approve", note: "The locked task is complete." }),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      submission: {
        id: submissionId,
        state: "approved",
        reviewedAt: "2027-04-05T12:01:00.000Z",
        approvedAt: "2027-04-05T12:01:00.000Z"
      }
    });
  });
});

describe("obsolete centralized proof review authority", () => {
  it("removes the old ops mutation route and review UI callers", () => {
    for (const path of [
      "src/app/api/ops/reviews/[submissionId]/approve/route.ts",
      "src/app/api/ops/reviews/[submissionId]/evidence/route.ts",
      "src/app/ops/reviews/page.tsx",
      "src/app/ops/reviews/[submissionId]/page.tsx",
      "src/components/review-approval-form.tsx"
    ]) {
      expect(existsSync(resolve(path)), path).toBe(false);
    }
  });
});
