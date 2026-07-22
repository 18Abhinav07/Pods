import { describe, expect, it } from "vitest";

import {
  friendRequestStates,
  nextFriendRequestState,
  validateReportInput
} from "../src/index";

describe("social relationship contract", () => {
  it("keeps friend request transitions actor-specific", () => {
    expect(friendRequestStates).toEqual(["pending", "accepted", "declined", "cancelled"]);
    expect(nextFriendRequestState("pending", "accept", "recipient")).toBe("accepted");
    expect(nextFriendRequestState("pending", "decline", "recipient")).toBe("declined");
    expect(nextFriendRequestState("pending", "cancel", "sender")).toBe("cancelled");
    expect(nextFriendRequestState("pending", "accept", "sender")).toBeNull();
    expect(nextFriendRequestState("accepted", "cancel", "sender")).toBeNull();
  });

  it("bounds report content without accepting an empty moderation event", () => {
    expect(validateReportInput({ reason: "spam", details: "Repeated unsolicited messages." }))
      .toEqual({ success: true, value: { reason: "spam", details: "Repeated unsolicited messages." } });
    expect(validateReportInput({ reason: "", details: "" })).toMatchObject({ success: false });
    expect(validateReportInput({ reason: "spam", details: "x".repeat(1001) })).toMatchObject({ success: false });
  });
});
