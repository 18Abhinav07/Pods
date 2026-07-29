import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.hoisted(() => vi.fn());
const repository = vi.hoisted(() => ({
  getEffectiveTime: vi.fn(),
  getProofReviewForParticipant: vi.fn(),
  getProofReviewForCreator: vi.fn(),
  respondToProofClarification: vi.fn(),
  appealProofRejection: vi.fn(),
  acceptProofRejection: vi.fn(),
  shareProofReviewWithPod: vi.fn(),
  reviewProofAsCreator: vi.fn(),
  decideSubmissionAsCreator: vi.fn(),
  reserveEvidenceUpload: vi.fn()
}));
const evidenceStorage = vi.hoisted(() => ({
  storeImage: vi.fn(),
  deleteImage: vi.fn(),
  readImage: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({ podsRepository: repository }));
vi.mock("../src/lib/evidence-storage", () => ({
  privateEvidenceStorage: () => evidenceStorage
}));

import { GET as getParticipantReview, POST as participantAction } from "../src/app/api/pods/[podId]/submissions/[submissionId]/review/route";
import { POST as creatorAction } from "../src/app/api/pods/[podId]/admin/reviews/[submissionId]/decision/route";
import { POST as reserveEvidenceUpload } from "../src/app/api/pods/[podId]/occurrences/[occurrenceId]/evidence-reservation/route";
import { GET as getReviewVersionEvidence } from "../src/app/api/pods/[podId]/submissions/[submissionId]/review/versions/[ordinal]/evidence/route";

const podId = "430296c7-9554-43e6-9b43-bfd063391028";
const submissionId = "b5322c1c-4441-4f12-87ba-8fe6d68b20f5";
const actionKey = "5c195050-5b5b-4145-ad90-df57fd5ed12d";
const occurrenceId = "db5bac63-6784-4b34-8104-90d28f27fd26";
const now = new Date("2027-04-05T12:00:00.000Z");

function params() {
  return { params: Promise.resolve({ podId, submissionId }) };
}

function occurrenceParams() {
  return { params: Promise.resolve({ podId, occurrenceId }) };
}

function reviewRecord() {
  return {
    submission: {
      membershipId: "fd579c3e-e335-411f-9c2d-8af25b88ee8d",
      reviewTargetAt: new Date("2027-04-05T23:00:00.000Z")
    },
    occurrence: { id: "db5bac63-6784-4b34-8104-90d28f27fd26" },
    proofCase: {
      stage: "appeal_open",
      resolution: null,
      clarificationUsed: false,
      appealUsed: false,
      sharedWithPodAt: null,
      stageDeadlineAt: new Date("2027-04-06T00:00:00.000Z"),
      absoluteDeadlineAt: new Date("2027-04-08T11:00:00.000Z"),
      privateInternalField: "must not leak"
    },
    events: [{
      sequence: 1,
      type: "provisionally_reject",
      actor: "creator",
      actorUserId: "private-user-id",
      payload: { reason: "The artifact does not meet the frozen commitment." },
      createdAt: now
    }],
    versions: [{
      ordinal: 1,
      kind: "initial",
      resultSummary: "A complete submitted result summary.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
      proofShareMode: "reviewer_only",
      evidenceObjectKey: "private/evidence.webp",
      createdByUserId: "private-user-id",
      createdAt: now
    }]
  };
}

describe("proof reconciliation routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue({ userId: "signed-user" });
    repository.getEffectiveTime.mockResolvedValue(now);
    repository.getProofReviewForParticipant.mockResolvedValue(reviewRecord());
    repository.getProofReviewForCreator.mockResolvedValue(reviewRecord());
  });

  it("returns a redacted participant review thread", async () => {
    const response = await getParticipantReview(
      new Request("http://localhost/review"),
      params()
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.review.versions[0]).toEqual(expect.objectContaining({
      hasEvidenceImage: true,
      resultSummary: "A complete submitted result summary."
    }));
    expect(JSON.stringify(body)).not.toContain("private/evidence.webp");
    expect(JSON.stringify(body)).not.toContain("private-user-id");
  });

  it("derives the clarification actor from the signed session", async () => {
    repository.respondToProofClarification.mockResolvedValue({ kind: "transitioned" });
    const response = await participantAction(
      new Request("http://localhost/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "respond_clarification",
          idempotencyKey: actionKey,
          note: "The requested implementation details are now included in the artifact.",
          artifactUrl: "https://github.com/18Abhinav07/Pods/pull/43",
          userId: "spoofed-user"
        })
      }),
      params()
    );
    expect(response.status).toBe(200);
    expect(repository.respondToProofClarification).toHaveBeenCalledWith(expect.objectContaining({
      userId: "signed-user",
      podId,
      submissionId,
      idempotencyKey: actionKey,
      now
    }));
  });

  it("stores optional clarification media as private immutable version evidence", async () => {
    evidenceStorage.storeImage.mockResolvedValue({
      objectKey: "pods/private/clarification.webp",
      contentType: "image/webp",
      byteSize: 1200
    });
    repository.respondToProofClarification.mockResolvedValue({ kind: "transitioned" });
    const form = new FormData();
    form.set("action", "respond_clarification");
    form.set("idempotencyKey", actionKey);
    form.set("note", "The replacement screenshot now shows the exact completed acceptance criterion.");
    form.set("artifactUrl", "https://github.com/18Abhinav07/Pods/pull/43");
    form.set("image", new File(["replacement-proof"], "proof.png", { type: "image/png" }));

    const response = await participantAction(
      new Request("http://localhost/review", { method: "POST", body: form }),
      params()
    );

    expect(response.status).toBe(200);
    expect(evidenceStorage.storeImage).toHaveBeenCalledWith(expect.objectContaining({
      podId,
      membershipId: "fd579c3e-e335-411f-9c2d-8af25b88ee8d",
      occurrenceId: "db5bac63-6784-4b34-8104-90d28f27fd26",
      source: expect.any(Buffer)
    }));
    expect(repository.respondToProofClarification).toHaveBeenCalledWith(expect.objectContaining({
      evidence: {
        objectKey: "pods/private/clarification.webp",
        contentType: "image/webp",
        byteSize: 1200
      },
      mediaSha256: expect.stringMatching(/^[a-f0-9]{64}$/)
    }));
  });

  it("serves immutable version media only through participant or creator authorization", async () => {
    evidenceStorage.readImage.mockResolvedValue({
      bytes: Buffer.from("private-proof"),
      contentType: "image/webp"
    });
    const response = await getReviewVersionEvidence(
      new Request("http://localhost/evidence"),
      {
        params: Promise.resolve({ podId, submissionId, ordinal: "1" })
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(evidenceStorage.readImage).toHaveBeenCalledWith("private/evidence.webp");
  });

  it("maps creator UI actions to the domain action type", async () => {
    repository.reviewProofAsCreator.mockResolvedValue({ kind: "transitioned" });
    const response = await creatorAction(
      new Request("http://localhost/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "provisionally_reject",
          idempotencyKey: actionKey,
          category: "commitment_mismatch",
          reason: "The artifact does not meet the frozen commitment.",
          unmetCriteria: ["The required change is absent"],
          suggestedCorrection: "Use a recovery commitment for the missing work."
        })
      }),
      params()
    );
    expect(response.status).toBe(200);
    expect(repository.reviewProofAsCreator).toHaveBeenCalledWith(expect.objectContaining({
      creatorUserId: "signed-user",
      action: expect.objectContaining({ type: "provisionally_reject" })
    }));
  });

  it("rejects malformed evidence reservation requests without reaching storage", async () => {
    const response = await reserveEvidenceUpload(
      new Request("http://localhost/reservation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{"
      }),
      occurrenceParams()
    );

    expect(response.status).toBe(400);
    expect(repository.reserveEvidenceUpload).not.toHaveBeenCalled();
  });

  it("requires the selected image hash before reserving deadline grace", async () => {
    const response = await reserveEvidenceUpload(
      new Request("http://localhost/reservation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId })
      }),
      occurrenceParams()
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Evidence image hash is required" });
    expect(repository.reserveEvidenceUpload).not.toHaveBeenCalled();
  });

  it("reserves only the exact selected image for deadline grace", async () => {
    const expectedMediaSha256 = "a".repeat(64);
    repository.reserveEvidenceUpload.mockResolvedValue({
      id: actionKey,
      expiresAt: new Date("2027-04-05T12:10:00.000Z")
    });
    const response = await reserveEvidenceUpload(
      new Request("http://localhost/reservation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId, expectedMediaSha256 })
      }),
      occurrenceParams()
    );

    expect(response.status).toBe(201);
    expect(repository.reserveEvidenceUpload).toHaveBeenCalledWith({
      userId: "signed-user",
      podId,
      occurrenceId,
      submissionId,
      expectedMediaSha256,
      now
    });
  });
});
