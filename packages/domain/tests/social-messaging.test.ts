import { describe, expect, it } from "vitest";

import {
  canonicalUserPair,
  nextDirectConversationState,
  parseReactionCode,
  validateDirectIntroduction,
  validateMessageInput
} from "../src/social";

describe("social messaging contract", () => {
  it("validates an idempotent text message with an optional same-room reply target", () => {
    expect(
      validateMessageInput({
        clientMessageId: "88f4fb17-1b64-4931-9585-73d0d39c3f70",
        body: "  Shipped the responsive Pod room today.  ",
        replyToMessageId: "30e99b45-a2b3-4626-9fb2-340d3078c651"
      })
    ).toEqual({
      success: true,
      value: {
        clientMessageId: "88f4fb17-1b64-4931-9585-73d0d39c3f70",
        body: "Shipped the responsive Pod room today.",
        replyToMessageId: "30e99b45-a2b3-4626-9fb2-340d3078c651"
      }
    });
  });

  it("rejects empty, oversized, or non-idempotent message payloads", () => {
    expect(
      validateMessageInput({
        clientMessageId: "retry-me",
        body: "x".repeat(2001),
        replyToMessageId: "not-a-message"
      })
    ).toEqual({
      success: false,
      errors: [
        "Message must contain 1 to 2000 characters",
        "Message retry identity is invalid",
        "Reply target is invalid"
      ]
    });
  });

  it("uses fixed support reactions and deterministic user-pair identity", () => {
    expect(parseReactionCode("heart")).toBe("heart");
    expect(parseReactionCode("support")).toBe("support");
    expect(parseReactionCode("fire")).toBeNull();
    expect(canonicalUserPair("user-b", "user-a")).toEqual({
      firstUserId: "user-a",
      secondUserId: "user-b",
      key: "user-a:user-b"
    });
    expect(() => canonicalUserPair("same", "same")).toThrow(
      "A direct conversation requires two different users"
    );
  });

  it("allows only explicit direct-conversation transitions", () => {
    expect(nextDirectConversationState("pending", "accept", "recipient")).toBe("active");
    expect(nextDirectConversationState("pending", "discard", "recipient")).toBe("discarded");
    expect(nextDirectConversationState("pending", "accept", "sender")).toBeNull();
    expect(nextDirectConversationState("active", "discard", "recipient")).toBeNull();
  });

  it("keeps a non-friend introduction short and plain text", () => {
    expect(validateDirectIntroduction("I found your public Build and Ship work useful."))
      .toEqual({ success: true, value: "I found your public Build and Ship work useful." });
    expect(validateDirectIntroduction("https://unsafe.example/request")).toMatchObject({ success: false });
    expect(validateDirectIntroduction("x".repeat(501))).toMatchObject({ success: false });
  });
});
