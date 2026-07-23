import { describe, expect, it } from "vitest";

import { buildInboxEvents } from "../src/lib/inbox-events";

describe("buildInboxEvents", () => {
  it("never labels a public application membership as a private invitation", () => {
    const now = new Date("2027-03-01T10:00:00.000Z");
    const events = buildInboxEvents([{
      pod: {
        id: "pod-1",
        contractData: { activity: { name: "Build room" } }
      },
      membership: {
        id: "membership-1",
        admissionSource: "public_application",
        state: "active",
        depositIntentId: null,
        acceptedAt: now,
        updatedAt: now
      },
      application: null,
      deposit: null,
      submission: null,
      transfer: null
    }] as Parameters<typeof buildInboxEvents>[0]);

    expect(events.map((event) => event.title)).not.toContain("Private invitation accepted");
    expect(events.map((event) => event.title)).toContain("Activity started");
  });

  it("projects creator review and approval copy to Updates", () => {
    const submittedAt = new Date("2027-03-01T10:00:00.000Z");
    const approvedAt = new Date("2027-03-01T11:00:00.000Z");
    const events = buildInboxEvents([{
      pod: {
        id: "pod-1",
        state: "active",
        contractData: { activity: { name: "Build room" } }
      },
      membership: {
        id: "membership-1",
        admissionSource: "public_application",
        state: "active",
        depositIntentId: null,
        acceptedAt: submittedAt,
        updatedAt: submittedAt
      },
      application: null,
      deposit: null,
      submission: {
        id: "submission-1",
        submittedAt,
        approvedAt
      },
      transfer: null
    }] as Parameters<typeof buildInboxEvents>[0]);

    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: "Proof submitted",
        detail: "Your proof is with the Pod creator."
      }),
      expect.objectContaining({
        title: "Work approved",
        detail: "The Pod creator approved this proof. It counts toward your progress and streak."
      })
    ]));
  });

  it.each([
    [
      "rejected",
      "Not verified",
      "The Pod creator did not verify this proof. Open the private result for the decision note."
    ],
    [
      "timeout_protected",
      "Protected after review timeout",
      "The creator did not decide within 24 hours. This occurrence counts toward your progress and streak."
    ]
  ])("projects the terminal %s result to Updates", (state, title, detail) => {
    const reviewedAt = new Date("2027-03-01T11:00:00.000Z");
    const events = buildInboxEvents([{
      pod: {
        id: "pod-1",
        state: "active",
        contractData: { activity: { name: "Build room" } }
      },
      membership: {
        id: "membership-1",
        admissionSource: "public_application",
        state: "active",
        depositIntentId: null,
        acceptedAt: reviewedAt,
        updatedAt: reviewedAt
      },
      application: null,
      deposit: null,
      submission: {
        id: "submission-1",
        state,
        submittedAt: new Date("2027-03-01T10:00:00.000Z"),
        reviewedAt,
        approvedAt: null,
        updatedAt: reviewedAt
      },
      transfer: null
    }] as Parameters<typeof buildInboxEvents>[0]);

    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ title, detail, occurredAt: reviewedAt })
    ]));
  });
});
