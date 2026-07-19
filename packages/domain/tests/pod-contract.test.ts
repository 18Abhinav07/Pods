import { describe, expect, it } from "vitest";

import {
  buildPublishedContract,
  materializeOccurrences,
  parseNimToLuna,
  serializePublishedContract,
  templateContracts,
  validateActivityStep,
  validateCommunityStep,
  validatePublicationTiming
} from "../src/index";

const sharedActivity = {
  name: "Build Pods in Public",
  purpose: "A focused group that ships one visible Pods improvement on every scheduled build day.",
  startDate: "2026-03-02",
  endDate: "2026-03-13",
  timeZone: "America/New_York",
  weekdays: [1, 3, 5]
};

describe("fixed template contracts", () => {
  it("exposes five templates with their locked evidence modes", () => {
    expect(templateContracts.map((template) => template.id)).toEqual([
      "fitness",
      "reading",
      "study",
      "build",
      "create"
    ]);
    expect(templateContracts.find((template) => template.id === "build")?.mode)
      .toBe("per_occurrence_commitment");
    expect(templateContracts.find((template) => template.id === "fitness")?.mode)
      .toBe("repeating_criterion");
  });

  it("requires template-specific Build fields", () => {
    const result = validateActivityStep("build", {
      ...sharedActivity,
      config: { projectTheme: "Pods", allowedDeliverables: [] }
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Choose at least one allowed deliverable");
    expect(result.errors).toContain("Choose a commitment cutoff");
  });

  it("does not accept Build fields as a Fitness contract", () => {
    const result = validateActivityStep("fitness", {
      ...sharedActivity,
      config: {
        projectTheme: "Pods",
        allowedDeliverables: ["pull_request"],
        commitmentCutoff: "09:00"
      }
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Describe the activity type");
    expect(result.errors).toContain("Set a measurable minimum");
  });
});

describe("community and commitment rules", () => {
  it("requires public applicant bounds and supports private expiry", () => {
    expect(validateCommunityStep({
      visibility: "public",
      minParticipants: 5,
      maxParticipants: 4,
      applicationQuestions: []
    }).errors).toContain("Maximum participants cannot be below the minimum");

    expect(validateCommunityStep({
      visibility: "private",
      minParticipants: 2,
      maxParticipants: 5,
      inviteExpiryHours: 168
    }).success).toBe(true);
  });

  it("parses NIM into exact integer Luna without floating point drift", () => {
    expect(parseNimToLuna("0.01")).toBe(1_000);
    expect(parseNimToLuna("1.23456")).toBe(123_456);
    expect(() => parseNimToLuna("0.000001")).toThrow("at most five decimal places");
  });
});

describe("occurrence materialization", () => {
  it("uses selected weekdays inclusively and creates absolute UTC windows", () => {
    const occurrences = materializeOccurrences({
      startDate: "2026-03-02",
      endDate: "2026-03-08",
      timeZone: "America/New_York",
      weekdays: [1, 3, 5],
      commitmentCutoff: "09:00"
    });

    expect(occurrences.map((occurrence) => occurrence.localDate)).toEqual([
      "2026-03-02",
      "2026-03-04",
      "2026-03-06"
    ]);
    expect(occurrences[0]).toMatchObject({
      ordinal: 1,
      opensAt: "2026-03-02T05:00:00Z",
      commitmentDeadlineAt: "2026-03-02T14:00:00Z",
      closesAt: "2026-03-03T05:00:00Z"
    });
  });

  it("requires publication before the first frozen occurrence opens", () => {
    const occurrences = materializeOccurrences({
      startDate: "2026-03-02",
      endDate: "2026-03-02",
      timeZone: "UTC",
      weekdays: [1]
    });

    expect(validatePublicationTiming(occurrences, new Date("2026-03-01T23:59:59Z")).success)
      .toBe(true);
    expect(validatePublicationTiming(occurrences, new Date("2026-03-02T00:00:00Z")).errors)
      .toContain("Publish before the first occurrence opens");
  });

  it("freezes a full contract and serializes it deterministically", () => {
    const draft = {
      templateId: "build" as const,
      activity: {
        ...sharedActivity,
        config: {
          projectTheme: "Pods",
          allowedDeliverables: ["pull_request", "live_artifact"],
          commitmentCutoff: "09:00"
        }
      },
      community: {
        visibility: "public" as const,
        minParticipants: 3,
        maxParticipants: 8,
        applicationQuestions: ["What will you ship?"]
      },
      commitment: { nimPerOccurrence: "0.5" }
    };

    const result = buildPublishedContract(draft);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.contract.commitment).toEqual({
      lunaPerOccurrence: 50_000,
      occurrenceCount: 6,
      totalLuna: 300_000
    });
    expect(result.occurrences).toHaveLength(6);
    expect(serializePublishedContract(result.contract))
      .toBe(serializePublishedContract(structuredClone(result.contract)));
  });
});
