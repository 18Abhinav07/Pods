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
});
