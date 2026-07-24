import { describe, expect, it } from "vitest";

import { projectProofForAudience } from "../src/proof-projection";

const proof = {
  shareMode: "reviewer_only" as const,
  templateEvidence: {
    kind: "study" as const,
    topic: "Consensus safety",
    durationMinutes: 35,
    takeaway: "Quorum intersection prevents conflicting decisions."
  },
  resultSummary: "Quorum intersection prevents conflicting decisions.",
  artifactUrl: "https://example.com/session",
  hasAttachment: true
};

describe("proof audience projection", () => {
  it.each(["owner", "reviewer"] as const)(
    "allows complete canonical evidence for the %s",
    (audience) => {
      expect(projectProofForAudience({ ...proof, audience })).toEqual({
        templateEvidence: proof.templateEvidence,
        resultSummary: proof.resultSummary,
        artifactUrl: proof.artifactUrl,
        attachmentAvailable: true
      });
    }
  );

  it("suppresses every evidence-derived field from members for reviewer-only proof", () => {
    expect(projectProofForAudience({ ...proof, audience: "member" })).toEqual({
      templateEvidence: null,
      resultSummary: null,
      artifactUrl: null,
      attachmentAvailable: false
    });
  });

  it.each(["pod_shared", "public"] as const)(
    "allows group-safe proof fields for members when sharing is %s",
    (shareMode) => {
      expect(projectProofForAudience({
        ...proof,
        audience: "member",
        shareMode
      })).toMatchObject({
        templateEvidence: proof.templateEvidence,
        resultSummary: proof.resultSummary,
        attachmentAvailable: true
      });
    }
  );

  it("requires explicit public sharing for visitors", () => {
    expect(projectProofForAudience({
      ...proof,
      audience: "visitor",
      shareMode: "pod_shared"
    })).toEqual({
      templateEvidence: null,
      resultSummary: null,
      artifactUrl: null,
      attachmentAvailable: false
    });
    expect(projectProofForAudience({
      ...proof,
      audience: "visitor",
      shareMode: "public"
    })).toMatchObject({
      templateEvidence: proof.templateEvidence,
      resultSummary: proof.resultSummary,
      attachmentAvailable: true
    });
  });

  it("suppresses unrelated actors and unsafe legacy artifact URLs", () => {
    expect(projectProofForAudience({ ...proof, audience: "other" }))
      .toMatchObject({
        templateEvidence: null,
        resultSummary: null,
        artifactUrl: null,
        attachmentAvailable: false
      });
    expect(projectProofForAudience({
      ...proof,
      audience: "owner",
      artifactUrl: "javascript:alert(1)"
    }).artifactUrl).toBeNull();
  });
});
