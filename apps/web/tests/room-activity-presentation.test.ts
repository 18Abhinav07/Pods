import { describe, expect, it } from "vitest";

import {
  presentRoomActivitySchedule,
  roomSubmissionStateLabel
} from "../src/lib/room-activity-presentation";

const now = new Date("2027-04-05T10:00:00.000Z");
const base = {
  occurrence: {
    id: "occurrence-1",
    ordinal: 1,
    opensAt: new Date("2027-04-05T00:00:00.000Z"),
    closesAt: new Date("2027-04-05T23:59:59.999Z")
  },
  commitment: null,
  submission: null
};

describe("presentRoomActivitySchedule", () => {
  it.each([
    ["committed", "Commitment locked"],
    ["reviewing", "Creator review"],
    ["approved", "Approved"],
    ["rejected", "Not verified"],
    ["grace", "Grace applied"],
    ["timeout_protected", "Protected after review timeout"]
  ])("maps %s to the participant-safe room label", (state, label) => {
    expect(roomSubmissionStateLabel(state)).toBe(label);
  });

  it.each([
    [{ ...base }, "lock", "Lock commitment"],
    [{ ...base, commitment: { id: "commitment-1" } }, "add", "Add proof"],
    [{ ...base, commitment: { id: "commitment-1" }, submission: { id: "submission-1", state: "draft" } }, "continue", "Continue proof"],
    [{ ...base, commitment: { id: "commitment-1" }, submission: { id: "submission-1", state: "reviewing" } }, "view", "View submission"]
  ])("derives the %s action from the current occurrence", (row, mode, label) => {
    expect(presentRoomActivitySchedule({ podId: "pod-1", now, rows: [row] })).toMatchObject({
      mode,
      label,
      href: mode === "view"
        ? "/pods/pod-1/submissions/submission-1"
        : "/pods/pod-1/activity/occurrence-1",
      progressLabel: "Occurrence 1 of 1"
    });
  });

  it("opens repeating criteria directly into proof even before materialization", () => {
    expect(presentRoomActivitySchedule({
      podId: "pod-1",
      now,
      rows: [base],
      evidenceMode: "repeating_criterion"
    })).toMatchObject({
      mode: "add",
      label: "Add proof",
      stateLabel: "Proof due",
      href: "/pods/pod-1/activity/occurrence-1"
    });
  });

  it("shows the next opening after a submitted occurrence", () => {
    const rows = [
      {
        ...base,
        commitment: { id: "commitment-1" },
        submission: { id: "submission-1", state: "approved" }
      },
      {
        occurrence: {
          id: "occurrence-2",
          ordinal: 2,
          opensAt: new Date("2027-04-07T00:00:00.000Z"),
          closesAt: new Date("2027-04-07T23:59:59.999Z")
        },
        commitment: null,
        submission: null
      }
    ];

    expect(presentRoomActivitySchedule({ podId: "pod-1", now, rows })).toMatchObject({
      mode: "view",
      label: "View submission",
      href: "/pods/pod-1/submissions/submission-1",
      stateLabel: "Approved",
      progressLabel: "Occurrence 1 of 2 complete",
      targetAt: "2027-04-07T00:00:00.000Z",
      targetLabel: "until next occurrence"
    });
  });

  it.each([
    ["rejected", "Not verified"],
    ["timeout_protected", "Protected after review timeout"]
  ])(
    "keeps a terminal %s occurrence viewable with its participant-safe label",
    (state, stateLabel) => {
      expect(presentRoomActivitySchedule({
        podId: "pod-1",
        now,
        rows: [{
          ...base,
          commitment: { id: "commitment-1" },
          submission: { id: "submission-1", state }
        }]
      })).toMatchObject({
        mode: "view",
        label: "View submission",
        href: "/pods/pod-1/submissions/submission-1",
        stateLabel
      });
    }
  );

  it("ends a one-occurrence schedule instead of offering another proof", () => {
    const afterClose = new Date("2027-04-06T00:00:00.000Z");
    expect(presentRoomActivitySchedule({
      podId: "pod-1",
      now: afterClose,
      rows: [{
        ...base,
        commitment: { id: "commitment-1" },
        submission: { id: "submission-1", state: "approved" }
      }]
    })).toMatchObject({
      mode: "complete",
      label: "Schedule complete",
      stateLabel: "Schedule complete",
      progressLabel: "1 of 1 occurrences finished",
      targetAt: null
    });
  });
});
