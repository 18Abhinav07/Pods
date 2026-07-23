import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicSubmissionEvidence = vi.hoisted(() => vi.fn());
const readImage = vi.hoisted(() => vi.fn());
const consumeNetworkPublicLimit = vi.hoisted(() => vi.fn());
const podId = "430296c7-9554-43e6-9b43-bfd063391028";
const submissionId = "b5322c1c-4441-4f12-87ba-8fe6d68b20f5";

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { getPublicSubmissionEvidence }
}));
vi.mock("../src/lib/evidence-storage", () => ({
  privateEvidenceStorage: () => ({ readImage })
}));
vi.mock("../src/lib/public-rate-limit", () => ({
  consumeNetworkPublicLimit
}));

import { GET } from "../src/app/api/public/pods/[podId]/proofs/[submissionId]/image/route";

describe("public proof image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PODS_PUBLIC_VISITOR_ROOMS_ENABLED", "true");
    consumeNetworkPublicLimit.mockResolvedValue({
      allowed: true,
      remaining: 29,
      resetAt: new Date("2027-04-05T12:01:00.000Z")
    });
  });

  it("streams only repository-authorized public evidence with hardened headers", async () => {
    getPublicSubmissionEvidence.mockResolvedValue({
      objectKey: "private/pod-1/proof.webp",
      contentType: "image/webp",
      byteSize: 5
    });
    readImage.mockResolvedValue({
      bytes: Buffer.from("image"),
      contentType: "image/webp"
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ podId, submissionId })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toBe("default-src 'none'");
    expect(readImage).toHaveBeenCalledWith("private/pod-1/proof.webp");
  });

  it("returns the same safe not-found response for every unauthorized proof", async () => {
    getPublicSubmissionEvidence.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ podId, submissionId })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Public proof not found" });
    expect(readImage).not.toHaveBeenCalled();
  });

  it("does not read private storage after the public evidence bucket is exhausted", async () => {
    consumeNetworkPublicLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60_000)
    });
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ podId, submissionId })
    });

    expect(response.status).toBe(429);
    expect(readImage).not.toHaveBeenCalled();
  });
});
