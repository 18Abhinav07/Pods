import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.hoisted(() => vi.fn());
const getCreatorSubmissionEvidence = vi.hoisted(() => vi.fn());
const readImage = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { getCreatorSubmissionEvidence }
}));
vi.mock("../src/lib/evidence-storage", () => ({
  privateEvidenceStorage: () => ({ readImage })
}));

import { GET } from "../src/app/api/pods/[podId]/admin/reviews/[submissionId]/evidence/route";

const podId = "430296c7-9554-43e6-9b43-bfd063391028";
const submissionId = "b5322c1c-4441-4f12-87ba-8fe6d68b20f5";

function routeParams(value: { podId: string; submissionId: string }) {
  return { params: Promise.resolve(value) };
}

describe("creator review evidence route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue({ userId: "creator-user-id" });
  });

  it("requires a wallet session", async () => {
    getCurrentSession.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost"),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Wallet session required" });
    expect(getCreatorSubmissionEvidence).not.toHaveBeenCalled();
    expect(readImage).not.toHaveBeenCalled();
  });

  it("rejects malformed route ids before repository access", async () => {
    const response = await GET(
      new Request("http://localhost"),
      routeParams({ podId, submissionId: "not-a-uuid" })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Evidence image not found" });
    expect(getCreatorSubmissionEvidence).not.toHaveBeenCalled();
    expect(readImage).not.toHaveBeenCalled();
  });

  it("serves only creator-authorized evidence with hardened private headers", async () => {
    getCreatorSubmissionEvidence.mockResolvedValue({
      objectKey: "private/pods/creator-only.webp",
      contentType: "image/webp",
      byteSize: 5
    });
    readImage.mockResolvedValue({
      bytes: Buffer.from("image"),
      contentType: "image/webp"
    });

    const response = await GET(
      new Request("http://localhost"),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-security-policy")).toBe("default-src 'none'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cross-origin-resource-policy")).toBe("same-origin");
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(getCreatorSubmissionEvidence).toHaveBeenCalledWith({
      creatorUserId: "creator-user-id",
      podId,
      submissionId
    });
    expect(readImage).toHaveBeenCalledWith("private/pods/creator-only.webp");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("image");
  });

  it("does not touch storage when the repository denies evidence access", async () => {
    getCreatorSubmissionEvidence.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost"),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Evidence image not found" });
    expect(readImage).not.toHaveBeenCalled();
  });

  it("keeps wrong-Pod evidence indistinguishable", async () => {
    getCreatorSubmissionEvidence.mockResolvedValue(null);
    const wrongPodId = "617f9316-a82f-4af6-abcb-9917cb5dd589";

    const response = await GET(
      new Request("http://localhost"),
      routeParams({ podId: wrongPodId, submissionId })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Evidence image not found" });
    expect(getCreatorSubmissionEvidence).toHaveBeenCalledWith({
      creatorUserId: "creator-user-id",
      podId: wrongPodId,
      submissionId
    });
    expect(readImage).not.toHaveBeenCalled();
  });

  it("never leaks a private object key or storage error", async () => {
    getCreatorSubmissionEvidence.mockResolvedValue({
      objectKey: "private/pods/do-not-leak.webp",
      contentType: "image/webp",
      byteSize: 5
    });
    readImage.mockRejectedValue(new Error(
      "NoSuchKey: private/pods/do-not-leak.webp"
    ));

    const response = await GET(
      new Request("http://localhost"),
      routeParams({ podId, submissionId })
    );

    expect(response.status).toBe(404);
    const body = JSON.stringify(await response.json());
    expect(body).toBe(JSON.stringify({ error: "Evidence image not found" }));
    expect(body).not.toContain("do-not-leak");
    expect(body).not.toContain("NoSuchKey");
  });
});
