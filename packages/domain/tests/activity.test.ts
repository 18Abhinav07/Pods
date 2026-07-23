import { describe, expect, it } from "vitest";

import {
  nextSubmissionState,
  occurrenceWindowState,
  reviewDeadline,
  validateBuildEvidence,
  validateBuildTask,
  validateCreatorReviewDecision,
  type SubmissionActor,
  type SubmissionEvent,
  type SubmissionState
} from "../src/activity";

const submissionStates: Record<SubmissionState, true> = {
  draft: true,
  reviewing: true,
  approved: true,
  rejected: true,
  timeout_protected: true
};
const submissionEvents: Record<SubmissionEvent, true> = {
  submit: true,
  approve: true,
  reject: true,
  protect_timeout: true
};
const submissionActors: Record<SubmissionActor, true> = {
  participant: true,
  system: true,
  creator: true
};

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

  it("allows only the four creator-review submission transitions", () => {
    const states = Object.keys(submissionStates) as SubmissionState[];
    const events = Object.keys(submissionEvents) as SubmissionEvent[];
    const actors = Object.keys(submissionActors) as SubmissionActor[];
    const allowed = new Map<string, SubmissionState>([
      ["draft:submit:participant", "reviewing"],
      ["reviewing:approve:creator", "approved"],
      ["reviewing:reject:creator", "rejected"],
      ["reviewing:protect_timeout:system", "timeout_protected"]
    ]);

    for (const state of states) {
      for (const event of events) {
        for (const actor of actors) {
          const key = `${state}:${event}:${actor}`;
          expect(nextSubmissionState(state, event, actor), key)
            .toBe(allowed.get(key) ?? null);
        }
      }
    }
  });

  it("keeps every terminal submission state immutable", () => {
    const terminalStates: SubmissionState[] = [
      "approved",
      "rejected",
      "timeout_protected"
    ];
    const events = Object.keys(submissionEvents) as SubmissionEvent[];
    const actors = Object.keys(submissionActors) as SubmissionActor[];

    for (const state of terminalStates) {
      for (const event of events) {
        for (const actor of actors) {
          expect(nextSubmissionState(state, event, actor)).toBeNull();
        }
      }
    }
  });

  it("validates and normalizes creator approval decisions", () => {
    expect(validateCreatorReviewDecision({
      decision: "approve",
      note: "  Clear proof of the committed work.  "
    })).toEqual({
      success: true,
      value: {
        decision: "approve",
        note: "Clear proof of the committed work."
      }
    });
    for (const input of [
      { decision: "approve" },
      { decision: "approve", note: undefined }
    ]) {
      expect(validateCreatorReviewDecision(input)).toEqual({
        success: true,
        value: { decision: "approve", note: "" }
      });
    }
    expect(validateCreatorReviewDecision({
      decision: "approve",
      note: "x".repeat(501)
    })).toEqual({
      success: false,
      errors: ["Keep the approval note within 500 characters"]
    });
    expect(validateCreatorReviewDecision({
      decision: "approve",
      note: 42
    })).toEqual({
      success: false,
      errors: ["Approval note must be text"]
    });
  });

  it("requires a clear creator rejection reason", () => {
    expect(validateCreatorReviewDecision({
      decision: "reject",
      reason: "  The artifact does not match the locked deliverable.  "
    })).toEqual({
      success: true,
      value: {
        decision: "reject",
        reason: "The artifact does not match the locked deliverable."
      }
    });
    for (const reason of [undefined, "Too short", "x".repeat(501)]) {
      expect(validateCreatorReviewDecision({ decision: "reject", reason })).toEqual({
        success: false,
        errors: ["Explain the rejection in 12 to 500 characters"]
      });
    }
  });

  it("rejects unsupported creator review decisions", () => {
    expect(validateCreatorReviewDecision({ decision: "later" })).toEqual({
      success: false,
      errors: ["Choose approve or reject"]
    });
  });

  it("derives the immutable 12-hour target and 24-hour hard review deadline", () => {
    expect(reviewDeadline(new Date("2027-03-08T10:00:00.000Z"))).toEqual({
      targetAt: new Date("2027-03-08T22:00:00.000Z"),
      hardDeadlineAt: new Date("2027-03-09T10:00:00.000Z")
    });
  });
});
