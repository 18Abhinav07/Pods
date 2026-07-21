import { describe, expect, it } from "vitest";

import {
  nextSubmissionState,
  occurrenceWindowState,
  reviewDeadline,
  validateBuildEvidence,
  validateBuildTask
} from "../src/activity";

describe("Phase 4 Build and Ship activity contract", () => {
  it("opens commitment, evidence, and review windows from frozen UTC boundaries", () => {
    const occurrence = {
      opensAt: new Date("2027-03-08T00:00:00.000Z"),
      commitmentDeadlineAt: new Date("2027-03-08T09:00:00.000Z"),
      closesAt: new Date("2027-03-09T00:00:00.000Z")
    };

    expect(occurrenceWindowState(occurrence, new Date("2027-03-07T23:59:59.000Z")))
      .toBe("scheduled");
    expect(occurrenceWindowState(occurrence, new Date("2027-03-08T08:59:59.000Z")))
      .toBe("commitment_open");
    expect(occurrenceWindowState(occurrence, new Date("2027-03-08T09:00:00.000Z")))
      .toBe("evidence_open");
    expect(occurrenceWindowState(occurrence, new Date("2027-03-09T00:00:00.000Z")))
      .toBe("review_open");
  });

  it("locks one concrete task only for a creator-allowed deliverable type", () => {
    expect(validateBuildTask({
      task: "Ship the Phase 4 occurrence state machine",
      deliverableType: "pull_request",
      allowedDeliverables: ["pull_request", "live_artifact"]
    })).toEqual({
      success: true,
      value: {
        task: "Ship the Phase 4 occurrence state machine",
        deliverableType: "pull_request"
      }
    });
    expect(validateBuildTask({
      task: "Ship it",
      deliverableType: "commit",
      allowedDeliverables: ["pull_request"]
    })).toEqual({
      success: false,
      errors: [
        "Describe a concrete task in 12 to 240 characters",
        "Choose a deliverable allowed by the frozen Pod contract"
      ]
    });
  });

  it("requires evidence that corresponds to the locked deliverable", () => {
    expect(validateBuildEvidence({
      deliverableType: "pull_request",
      resultSummary: "Implemented and tested the participant occurrence workflow.",
      artifactUrl: "https://github.com/nimiq/pods/pull/42"
    })).toEqual({
      success: true,
      value: {
        resultSummary: "Implemented and tested the participant occurrence workflow.",
        artifactUrl: "https://github.com/nimiq/pods/pull/42"
      }
    });
    expect(validateBuildEvidence({
      deliverableType: "pull_request",
      resultSummary: "Too short",
      artifactUrl: "https://example.com/not-a-pull-request"
    })).toEqual({
      success: false,
      errors: [
        "Summarize the completed result in 20 to 1200 characters",
        "Add a GitHub pull request URL that matches the locked deliverable"
      ]
    });
  });

  it("keeps submission and approval authority separated", () => {
    expect(nextSubmissionState("draft", "submit", "participant")).toBe("submitted");
    expect(nextSubmissionState("submitted", "start_review", "system")).toBe("reviewing");
    expect(nextSubmissionState("reviewing", "approve", "reviewer")).toBe("approved");
    expect(nextSubmissionState("reviewing", "approve", "participant")).toBeNull();
    expect(nextSubmissionState("approved", "approve", "reviewer")).toBeNull();
  });

  it("derives the immutable 12-hour target and 24-hour hard review deadline", () => {
    expect(reviewDeadline(new Date("2027-03-08T10:00:00.000Z"))).toEqual({
      targetAt: new Date("2027-03-08T22:00:00.000Z"),
      hardDeadlineAt: new Date("2027-03-09T10:00:00.000Z")
    });
  });
});
