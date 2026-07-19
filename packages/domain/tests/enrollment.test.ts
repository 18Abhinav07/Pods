import { describe, expect, it } from "vitest";

import {
  canDecideApplication,
  normalizeInvitationToken,
  validateApplicationAnswers
} from "../src/index";

describe("public application input", () => {
  it("normalizes one bounded answer for every frozen question", () => {
    expect(validateApplicationAnswers(["  I will ship wallet auth  "], 1)).toEqual({
      success: true,
      value: ["I will ship wallet auth"]
    });
    expect(validateApplicationAnswers([""], 1)).toEqual({
      success: false,
      errors: ["Each answer must contain 2 to 500 characters"]
    });
    expect(validateApplicationAnswers(["one"], 2)).toEqual({
      success: false,
      errors: ["Answer every application question"]
    });
    expect(validateApplicationAnswers(["x".repeat(501)], 1).success).toBe(false);
  });
});

describe("enrollment state transitions", () => {
  it("allows exactly one decision from the applied state", () => {
    expect(canDecideApplication("applied", "accept")).toBe(true);
    expect(canDecideApplication("applied", "reject")).toBe(true);
    expect(canDecideApplication("accepted_unfunded", "reject")).toBe(false);
    expect(canDecideApplication("application_rejected", "accept")).toBe(false);
    expect(canDecideApplication("application_expired", "accept")).toBe(false);
  });
});

describe("private invitation tokens", () => {
  it("accepts only an opaque 32-byte base64url token", () => {
    const valid = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ";
    expect(valid).toHaveLength(43);
    expect(normalizeInvitationToken(valid)).toBe(valid);
    expect(normalizeInvitationToken(" readable-pod-id ")).toBeNull();
    expect(normalizeInvitationToken(`${valid}=`)).toBeNull();
    expect(normalizeInvitationToken(valid.replace("a", "/"))).toBeNull();
  });
});
