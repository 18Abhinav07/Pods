import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentSession,
  getEffectiveTime,
  lockOccurrenceCommitment,
  saveSubmissionDraft,
  getSubmissionForOwner,
  submitOccurrenceEvidence,
  getActivityOccurrenceForMember,
  attachSubmissionEvidence,
  storeImage,
  deleteImage
} = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getEffectiveTime: vi.fn(),
  lockOccurrenceCommitment: vi.fn(),
  saveSubmissionDraft: vi.fn(),
  getSubmissionForOwner: vi.fn(),
  submitOccurrenceEvidence: vi.fn(),
  getActivityOccurrenceForMember: vi.fn(),
  attachSubmissionEvidence: vi.fn(),
  storeImage: vi.fn(),
  deleteImage: vi.fn()
}));

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getEffectiveTime,
    lockOccurrenceCommitment,
    saveSubmissionDraft,
    getSubmissionForOwner,
    submitOccurrenceEvidence,
    getActivityOccurrenceForMember,
    attachSubmissionEvidence
  }
}));
vi.mock("../src/lib/evidence-storage", () => ({
  privateEvidenceStorage: () => ({ storeImage, deleteImage })
}));

import { POST as lockCommitment } from "../src/app/api/pods/[podId]/occurrences/[occurrenceId]/commitment/route";
import { POST as saveDraft } from "../src/app/api/pods/[podId]/occurrences/[occurrenceId]/draft/route";
import { POST as uploadEvidence } from "../src/app/api/pods/[podId]/occurrences/[occurrenceId]/evidence/route";
import { POST as submitEvidence } from "../src/app/api/pods/[podId]/submissions/[submissionId]/submit/route";

const routeParams = {
  params: Promise.resolve({ podId: "pod-1", occurrenceId: "occurrence-1" })
};

function jsonRequest(body: unknown) {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("template activity routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue({ userId: "user-1" });
    getEffectiveTime.mockResolvedValue(new Date("2027-05-03T10:00:00.000Z"));
    lockOccurrenceCommitment.mockResolvedValue({ id: "commitment-1" });
    saveSubmissionDraft.mockResolvedValue({
      id: "submission-1",
      state: "draft",
      resultSummary: "Recorded honest progress.",
      artifactUrl: "",
      templateEvidence: {
        kind: "reading",
        title: "Designing Data-Intensive Applications",
        amountCompleted: 12,
        unit: "pages",
        note: "Reported honest progress."
      },
      evidenceObjectKey: "private/must-not-leak.webp",
      proofShareMode: "pod_shared"
    });
  });

  it("passes only the Build or Practice commitment fields to the repository", async () => {
    const build = await lockCommitment(
      jsonRequest({
        task: "Ship the template-aware route contract.",
        deliverableType: "pull_request",
        goal: "ignored",
        userId: "forged-user",
        templateId: "fitness"
      }),
      routeParams
    );
    expect(build.status).toBe(201);
    expect(lockOccurrenceCommitment).toHaveBeenNthCalledWith(1, {
      userId: "user-1",
      podId: "pod-1",
      occurrenceId: "occurrence-1",
      task: "Ship the template-aware route contract.",
      deliverableType: "pull_request",
      goal: "ignored",
      now: new Date("2027-05-03T10:00:00.000Z")
    });

    const create = await lockCommitment(
      jsonRequest({
        goal: "Complete one finished character color study.",
        membershipId: "forged-membership"
      }),
      routeParams
    );
    expect(create.status).toBe(201);
    expect(lockOccurrenceCommitment).toHaveBeenNthCalledWith(2, {
      userId: "user-1",
      podId: "pod-1",
      occurrenceId: "occurrence-1",
      task: undefined,
      deliverableType: undefined,
      goal: "Complete one finished character color study.",
      now: new Date("2027-05-03T10:00:00.000Z")
    });
  });

  it("returns the repository rejection when a repeating template tries to lock", async () => {
    lockOccurrenceCommitment.mockRejectedValueOnce(
      new Error("Repeating activities do not use a commitment lock")
    );
    const response = await lockCommitment(
      jsonRequest({ task: "A forged repeating task", deliverableType: "commit" }),
      routeParams
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Repeating activities do not use a commitment lock"
    });
  });

  it("forwards canonical evidence and privacy without trusting client identity fields", async () => {
    const templateEvidence = {
      kind: "reading",
      title: "Designing Data-Intensive Applications",
      amountCompleted: 12,
      unit: "pages",
      note: "Reported honest progress."
    };
    const response = await saveDraft(
      jsonRequest({
        templateEvidence,
        proofShareMode: "pod_shared",
        userId: "forged-user",
        membershipId: "forged-membership",
        commitmentId: "forged-commitment",
        templateId: "build",
        evidenceObjectKey: "forged/object.webp"
      }),
      routeParams
    );
    expect(response.status).toBe(201);
    expect(saveSubmissionDraft).toHaveBeenCalledWith({
      userId: "user-1",
      podId: "pod-1",
      occurrenceId: "occurrence-1",
      templateEvidence,
      proofShareMode: "pod_shared",
      now: new Date("2027-05-03T10:00:00.000Z")
    });
    await expect(response.json()).resolves.toEqual({
      submission: {
        id: "submission-1",
        state: "draft",
        resultSummary: "Recorded honest progress.",
        artifactUrl: "",
        templateEvidence,
        evidenceAvailable: true,
        proofShareMode: "pod_shared"
      }
    });
  });

  it("surfaces wrong-template and missing-image final validation failures", async () => {
    saveSubmissionDraft.mockRejectedValueOnce(
      new Error("Evidence does not match the frozen Pod template")
    );
    const wrongTemplate = await saveDraft(
      jsonRequest({
        templateEvidence: {
          kind: "build",
          resultSummary: "This cannot become a Reading submission.",
          artifactUrl: "https://example.com"
        }
      }),
      routeParams
    );
    expect(wrongTemplate.status).toBe(400);

    getSubmissionForOwner.mockResolvedValue({
      pod: { id: "pod-1" },
      submission: { id: "submission-1" }
    });
    submitOccurrenceEvidence.mockRejectedValueOnce(
      new Error("Add the required evidence image before submitting")
    );
    const missingImage = await submitEvidence(
      new Request("http://localhost", { method: "POST" }),
      {
        params: Promise.resolve({
          podId: "pod-1",
          submissionId: "submission-1"
        })
      }
    );
    expect(missingImage.status).toBe(400);
    await expect(missingImage.json()).resolves.toEqual({
      error: "Add the required evidence image before submitting"
    });
  });

  it("binds an uploaded image to the session-owned editable draft", async () => {
    getActivityOccurrenceForMember.mockResolvedValue({
      membership: { id: "membership-1" },
      submission: { id: "submission-1", state: "draft" }
    });
    storeImage.mockResolvedValue({
      objectKey: "private/pod-1/evidence.webp",
      contentType: "image/webp",
      byteSize: 4
    });
    attachSubmissionEvidence.mockResolvedValue({
      id: "submission-1",
      state: "draft",
      resultSummary: "Recorded honest progress.",
      artifactUrl: "",
      templateEvidence: {
        kind: "reading",
        title: "Designing Data-Intensive Applications",
        amountCompleted: 12,
        unit: "pages",
        note: "Reported honest progress."
      },
      evidenceObjectKey: "private/pod-1/evidence.webp",
      proofShareMode: "reviewer_only"
    });
    const form = new FormData();
    form.set("submissionId", "submission-1");
    form.set("image", new File(["pods"], "proof.png", { type: "image/png" }));

    const response = await uploadEvidence(
      {
        formData: async () => form
      } as Request,
      routeParams
    );
    expect(response.status).toBe(200);
    expect(storeImage).toHaveBeenCalledWith({
      podId: "pod-1",
      membershipId: "membership-1",
      occurrenceId: "occurrence-1",
      source: expect.any(Buffer)
    });
    expect(attachSubmissionEvidence).toHaveBeenCalledWith({
      userId: "user-1",
      submissionId: "submission-1",
      evidence: {
        objectKey: "private/pod-1/evidence.webp",
        contentType: "image/webp",
        byteSize: 4
      },
      now: new Date("2027-05-03T10:00:00.000Z")
    });
    const body = await response.json();
    expect(body).toEqual({
      submission: {
        id: "submission-1",
        state: "draft",
        resultSummary: "Recorded honest progress.",
        artifactUrl: "",
        templateEvidence: {
          kind: "reading",
          title: "Designing Data-Intensive Applications",
          amountCompleted: 12,
          unit: "pages",
          note: "Reported honest progress."
        },
        evidenceAvailable: true,
        proofShareMode: "reviewer_only"
      }
    });
    expect(JSON.stringify(body)).not.toContain("private/pod-1/evidence.webp");
  });

  it("returns an owner-safe submission after review starts", async () => {
    getSubmissionForOwner.mockResolvedValue({
      pod: { id: "pod-1" },
      submission: { id: "submission-1", state: "draft" }
    });
    submitOccurrenceEvidence.mockResolvedValue({
      id: "submission-1",
      state: "reviewing",
      resultSummary: "Shipped the complete owner-safe status flow.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
      templateEvidence: {
        kind: "build",
        resultSummary: "Shipped the complete owner-safe status flow.",
        artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42"
      },
      evidenceObjectKey: "private/review-proof.webp",
      proofShareMode: "reviewer_only"
    });

    const response = await submitEvidence(
      new Request("http://localhost", { method: "POST" }),
      {
        params: Promise.resolve({
          podId: "pod-1",
          submissionId: "submission-1"
        })
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.submission).toMatchObject({
      id: "submission-1",
      state: "reviewing",
      evidenceAvailable: true,
      proofShareMode: "reviewer_only"
    });
    expect(JSON.stringify(body)).not.toContain("private/review-proof.webp");
  });
});
