import { describe, expect, it } from "vitest";

import {
  nextProofCaseState,
  proofCaseDeadlines,
  validateAppealInput,
  validateClarificationRequest,
  validateClarificationResponse,
  validateProvisionalRejection,
  type ProofCaseState
} from "../src/proof-review";

const initial: ProofCaseState = {
  stage: "initial_review",
  clarificationUsed: false,
  appealUsed: false,
  resolution: null
};

describe("proof reconciliation lifecycle", () => {
  it("keeps a provisional rejection unresolved and opens one appeal", () => {
    const provisional = nextProofCaseState(initial, {
      type: "provisionally_reject",
      actor: "creator"
    });
    expect(provisional).toEqual({
      stage: "appeal_open",
      clarificationUsed: false,
      appealUsed: false,
      resolution: null
    });
    expect(nextProofCaseState(provisional!, {
      type: "open_appeal",
      actor: "participant"
    })).toEqual({
      stage: "appeal_review",
      clarificationUsed: false,
      appealUsed: true,
      resolution: null
    });
  });

  it("supports one clarification and rejects a second request", () => {
    const awaiting = nextProofCaseState(initial, {
      type: "request_clarification",
      actor: "creator"
    });
    expect(awaiting).toEqual({
      stage: "awaiting_clarification",
      clarificationUsed: true,
      appealUsed: false,
      resolution: null
    });
    const reviewing = nextProofCaseState(awaiting!, {
      type: "respond_clarification",
      actor: "participant"
    });
    expect(reviewing?.stage).toBe("post_clarification_review");
    expect(nextProofCaseState(reviewing!, {
      type: "request_clarification",
      actor: "creator"
    })).toBeNull();
  });

  it("maps every timeout boundary to its safe outcome", () => {
    expect(nextProofCaseState(initial, {
      type: "review_timeout",
      actor: "system"
    })?.resolution).toBe("timeout_protected");

    const awaiting = nextProofCaseState(initial, {
      type: "request_clarification",
      actor: "creator"
    })!;
    expect(nextProofCaseState(awaiting, {
      type: "clarification_timeout",
      actor: "system"
    })?.stage).toBe("appeal_open");

    const appealOpen = nextProofCaseState(initial, {
      type: "provisionally_reject",
      actor: "creator"
    })!;
    expect(nextProofCaseState(appealOpen, {
      type: "appeal_window_timeout",
      actor: "system"
    })?.resolution).toBe("rejected");

    const appealReview = nextProofCaseState(appealOpen, {
      type: "open_appeal",
      actor: "participant"
    })!;
    expect(nextProofCaseState(appealReview, {
      type: "appeal_review_timeout",
      actor: "system"
    })?.resolution).toBe("grace");
  });

  it("lets the participant accept rejection without an appeal", () => {
    const appealOpen = nextProofCaseState(initial, {
      type: "provisionally_reject",
      actor: "creator"
    })!;
    expect(nextProofCaseState(appealOpen, {
      type: "accept_rejection",
      actor: "participant"
    })).toEqual({
      stage: "resolved",
      clarificationUsed: false,
      appealUsed: false,
      resolution: "rejected"
    });
  });

  it("caps initial inactivity as protected and later inactivity as grace", () => {
    expect(nextProofCaseState(initial, {
      type: "absolute_timeout",
      actor: "system"
    })?.resolution).toBe("timeout_protected");
    const appealOpen = nextProofCaseState(initial, {
      type: "provisionally_reject",
      actor: "creator"
    })!;
    expect(nextProofCaseState(appealOpen, {
      type: "absolute_timeout",
      actor: "system"
    })?.resolution).toBe("grace");
  });

  it("derives bounded deadlines from submission and stage entry", () => {
    const submittedAt = new Date("2027-03-08T10:00:00.000Z");
    expect(proofCaseDeadlines(submittedAt, submittedAt)).toEqual({
      targetAt: new Date("2027-03-08T22:00:00.000Z"),
      stageDeadlineAt: new Date("2027-03-09T10:00:00.000Z"),
      absoluteDeadlineAt: new Date("2027-03-11T10:00:00.000Z")
    });
    expect(proofCaseDeadlines(
      submittedAt,
      new Date("2027-03-11T05:00:00.000Z"),
      12
    ).stageDeadlineAt).toEqual(new Date("2027-03-11T10:00:00.000Z"));
  });

  it("requires structured clarification, rejection, response, and appeal detail", () => {
    expect(validateClarificationRequest({
      reason: "The artifact cannot be matched to the locked task.",
      requestedChange: "Add the exact pull request and explain the shipped behavior.",
      reference: "Locked task: ship the review flow"
    }).success).toBe(true);
    expect(validateProvisionalRejection({
      category: "commitment_mismatch",
      reason: "The submitted artifact demonstrates a different task than the commitment.",
      unmetCriteria: ["Artifact must match the locked commitment"],
      suggestedCorrection: "Submit a later recovery commitment for the missing work."
    }).success).toBe(true);
    expect(validateClarificationResponse({
      note: "The pull request now includes the missing route and its integration test.",
      artifactUrl: "https://github.com/nimiq/pods/pull/42"
    }).success).toBe(true);
    expect(validateAppealInput({
      reason: "The rejected artifact does match the locked task because the route and test are in the linked diff.",
      artifactUrl: "https://github.com/nimiq/pods/pull/43"
    }).success).toBe(true);

    expect(validateClarificationRequest({ reason: "short" }).success).toBe(false);
    expect(validateProvisionalRejection({ category: "other" }).success).toBe(false);
    expect(validateClarificationResponse({ note: "short" }).success).toBe(false);
    expect(validateAppealInput({ reason: "short" }).success).toBe(false);
    expect(validateAppealInput({
      reason: "The proof should be reconsidered using the corrected artifact included with this appeal.",
      artifactUrl: "http://unsafe.example.com"
    }).success).toBe(false);
  });
});
