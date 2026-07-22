import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.hoisted(() => vi.fn());
const getSharedSubmissionEvidence = vi.hoisted(() => vi.fn());
const readImage = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { getSharedSubmissionEvidence }
}));
vi.mock("../src/lib/evidence-storage", () => ({
  privateEvidenceStorage: () => ({ readImage })
}));

import { GET } from "../src/app/api/pods/[podId]/submissions/[submissionId]/shared-evidence/route";

describe("Pod-shared proof image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue({ userId: "member-1" });
  });

  it("serves only the repository-authorized sanitized object", async () => {
    getSharedSubmissionEvidence.mockResolvedValue({
      objectKey: "pods/pod-1/proof.webp",
      contentType: "image/webp"
    });
    readImage.mockResolvedValue({ bytes: Buffer.from("image"), contentType: "image/webp" });
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ podId: "pod-1", submissionId: "submission-1" })
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(getSharedSubmissionEvidence).toHaveBeenCalledWith({
      podId: "pod-1",
      submissionId: "submission-1",
      userId: "member-1"
    });
    expect(readImage).toHaveBeenCalledWith("pods/pod-1/proof.webp");
  });

  it("does not reveal whether private reviewer evidence exists", async () => {
    getSharedSubmissionEvidence.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ podId: "pod-1", submissionId: "private-proof" })
    });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Shared proof not found" });
    expect(readImage).not.toHaveBeenCalled();
  });
});
