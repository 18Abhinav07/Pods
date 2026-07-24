import { describe, expect, it } from "vitest";

import {
  legacySubmissionProjection,
  validateCreateGoal,
  validateTemplateEvidenceDraft,
  validateTemplateEvidenceSubmission,
  type CommitmentDetails,
  type CommitmentKind,
  type TemplateEvidence
} from "../src/template-evidence";

const frozen = {
  fitness: {
    activityType: "Strength training",
    measurableMinimum: "Complete a 45 minute session"
  },
  reading: {
    bookOrTheme: "Designing Data-Intensive Applications",
    targetAmount: 20,
    targetType: "pages"
  },
  study: {
    subject: "Distributed systems",
    minimumKind: "minutes",
    minimumMinutes: 60
  },
  build: {
    projectTheme: "Pods",
    allowedDeliverables: ["pull_request"],
    commitmentCutoff: "09:00"
  },
  create: {
    discipline: "Illustration",
    minimumExpectation: "Complete one finished character study",
    commitmentCutoff: "09:00"
  }
} as const;

function failureErrors(
  result: ReturnType<typeof validateTemplateEvidenceSubmission>
): string[] {
  expect(result.success).toBe(false);
  if (result.success) throw new Error("Expected template evidence validation to fail");
  return result.errors;
}

describe("template evidence drafts", () => {
  it.each([
    {
      templateId: "fitness",
      evidence: {
        kind: "fitness",
        activityType: "  Strength training  ",
        completionNote: "  Completed all five working sets.  "
      },
      expected: {
        kind: "fitness",
        activityType: "Strength training",
        completionNote: "Completed all five working sets."
      }
    },
    {
      templateId: "reading",
      evidence: {
        kind: "reading",
        title: "  Designing Data-Intensive Applications  ",
        amountCompleted: 12,
        unit: "pages",
        note: "  Finished the replication section.  "
      },
      expected: {
        kind: "reading",
        title: "Designing Data-Intensive Applications",
        amountCompleted: 12,
        unit: "pages",
        note: "Finished the replication section."
      }
    },
    {
      templateId: "study",
      evidence: {
        kind: "study",
        topic: "  Consensus protocols  ",
        durationMinutes: 35,
        takeaway: "  Quorum overlap is the central safety condition.  "
      },
      expected: {
        kind: "study",
        topic: "Consensus protocols",
        durationMinutes: 35,
        takeaway: "Quorum overlap is the central safety condition."
      }
    },
    {
      templateId: "build",
      evidence: {
        kind: "build",
        resultSummary: "  Implemented typed evidence for every Pods template.  ",
        artifactUrl: "  https://github.com/nimiq/pods/pull/42  "
      },
      expected: {
        kind: "build",
        resultSummary: "Implemented typed evidence for every Pods template.",
        artifactUrl: "https://github.com/nimiq/pods/pull/42"
      }
    },
    {
      templateId: "create",
      evidence: {
        kind: "create",
        reflection: "  Refined the silhouette and final color study.  ",
        artifactUrl: "  https://example.com/art/character-study  "
      },
      expected: {
        kind: "create",
        reflection: "Refined the silhouette and final color study.",
        artifactUrl: "https://example.com/art/character-study"
      }
    }
  ] as const)(
    "normalizes a $templateId draft",
    ({ templateId, evidence, expected }) => {
      expect(validateTemplateEvidenceDraft({ templateId, evidence })).toEqual({
        success: true,
        value: expected
      });
    }
  );

  it("allows incomplete draft fields while preserving the discriminator", () => {
    expect(validateTemplateEvidenceDraft({
      templateId: "reading",
      evidence: {
        kind: "reading",
        title: "",
        amountCompleted: 0,
        unit: "pages",
        note: ""
      }
    })).toEqual({
      success: true,
      value: {
        kind: "reading",
        title: "",
        amountCompleted: 0,
        unit: "pages",
        note: ""
      }
    });
  });

  it("rejects a payload whose discriminator does not match the frozen template", () => {
    expect(validateTemplateEvidenceDraft({
      templateId: "fitness",
      evidence: {
        kind: "reading",
        title: "A book",
        amountCompleted: 10,
        unit: "pages",
        note: ""
      }
    })).toEqual({
      success: false,
      errors: ["Evidence does not match the frozen Pod template"]
    });
  });
});

describe("final template evidence", () => {
  it("accepts valid evidence for every template", () => {
    const cases = [
      {
        templateId: "fitness",
        evidence: {
          kind: "fitness",
          activityType: "Strength training",
          completionNote: "Completed all five working sets."
        },
        frozenConfig: frozen.fitness,
        hasEvidenceImage: true
      },
      {
        templateId: "reading",
        evidence: {
          kind: "reading",
          title: "Designing Data-Intensive Applications",
          amountCompleted: 12,
          unit: "pages",
          note: "Reported honest progress for creator review."
        },
        frozenConfig: frozen.reading,
        hasEvidenceImage: true
      },
      {
        templateId: "study",
        evidence: {
          kind: "study",
          topic: "Consensus protocols",
          durationMinutes: 35,
          takeaway: "Quorum overlap is the central safety condition."
        },
        frozenConfig: frozen.study,
        hasEvidenceImage: true
      },
      {
        templateId: "build",
        evidence: {
          kind: "build",
          resultSummary: "Implemented typed evidence for every Pods template.",
          artifactUrl: "https://github.com/nimiq/pods/pull/42"
        },
        frozenConfig: frozen.build,
        deliverableType: "pull_request",
        hasEvidenceImage: false
      },
      {
        templateId: "create",
        evidence: {
          kind: "create",
          reflection: "Refined the silhouette and final color study.",
          artifactUrl: "https://example.com/art/character-study"
        },
        frozenConfig: frozen.create,
        hasEvidenceImage: false
      }
    ] as const;

    for (const value of cases) {
      expect(validateTemplateEvidenceSubmission(value).success).toBe(true);
    }
  });

  it("allows honest below-target Reading and Study reports to reach review", () => {
    expect(validateTemplateEvidenceSubmission({
      templateId: "reading",
      evidence: {
        kind: "reading",
        title: "Designing Data-Intensive Applications",
        amountCompleted: 4,
        unit: "pages",
        note: "A shorter session than planned."
      },
      frozenConfig: frozen.reading,
      hasEvidenceImage: true
    }).success).toBe(true);

    expect(validateTemplateEvidenceSubmission({
      templateId: "study",
      evidence: {
        kind: "study",
        topic: "Consensus protocols",
        durationMinutes: 15,
        takeaway: "Mapped the quorum intersection requirement."
      },
      frozenConfig: frozen.study,
      hasEvidenceImage: true
    }).success).toBe(true);
  });

  it("rejects non-positive progress and a unit that conflicts with the frozen contract", () => {
    expect(validateTemplateEvidenceSubmission({
      templateId: "reading",
      evidence: {
        kind: "reading",
        title: "Designing Data-Intensive Applications",
        amountCompleted: 0,
        unit: "minutes",
        note: ""
      },
      frozenConfig: frozen.reading,
      hasEvidenceImage: true
    })).toEqual({
      success: false,
      errors: [
        "Completed amount must be a positive whole number",
        "Completed amount must use the frozen pages unit"
      ]
    });

    expect(validateTemplateEvidenceSubmission({
      templateId: "study",
      evidence: {
        kind: "study",
        topic: "Consensus protocols",
        durationMinutes: 0,
        takeaway: "Mapped the quorum intersection requirement."
      },
      frozenConfig: frozen.study,
      hasEvidenceImage: true
    })).toEqual({
      success: false,
      errors: ["Focus duration must be a positive whole number of minutes"]
    });
  });

  it.each(["fitness", "reading", "study"] as const)(
    "requires a stored image for %s",
    (templateId) => {
      const evidenceByTemplate = {
        fitness: {
          kind: "fitness",
          activityType: "Strength training",
          completionNote: "Completed all five working sets."
        },
        reading: {
          kind: "reading",
          title: "Designing Data-Intensive Applications",
          amountCompleted: 12,
          unit: "pages",
          note: ""
        },
        study: {
          kind: "study",
          topic: "Consensus protocols",
          durationMinutes: 35,
          takeaway: "Quorum overlap is the central safety condition."
        }
      } as const;

      expect(failureErrors(validateTemplateEvidenceSubmission({
        templateId,
        evidence: evidenceByTemplate[templateId],
        frozenConfig: frozen[templateId],
        hasEvidenceImage: false
      }))).toContain("Add the required evidence image before submitting");
    }
  );

  it("keeps Build URL validation bound to the locked deliverable", () => {
    expect(failureErrors(validateTemplateEvidenceSubmission({
      templateId: "build",
      evidence: {
        kind: "build",
        resultSummary: "Implemented typed evidence for every Pods template.",
        artifactUrl: "https://example.com/not-a-pull-request"
      },
      frozenConfig: frozen.build,
      deliverableType: "pull_request",
      hasEvidenceImage: false
    }))).toContain(
      "Add a GitHub pull request URL that matches the locked deliverable"
    );
  });

  it("requires Practice evidence to include an image or a safe HTTPS link", () => {
    expect(failureErrors(validateTemplateEvidenceSubmission({
      templateId: "create",
      evidence: {
        kind: "create",
        reflection: "Refined the silhouette and final color study.",
        artifactUrl: null
      },
      frozenConfig: frozen.create,
      hasEvidenceImage: false
    }))).toContain("Add an image or HTTPS artifact link before submitting");

    expect(failureErrors(validateTemplateEvidenceSubmission({
      templateId: "create",
      evidence: {
        kind: "create",
        reflection: "Refined the silhouette and final color study.",
        artifactUrl: "http://example.com/art"
      },
      frozenConfig: frozen.create,
      hasEvidenceImage: false
    }))).toContain("Artifact link must be a safe HTTPS URL");
  });
});

describe("template compatibility projections", () => {
  it("normalizes one concrete Practice and Create goal", () => {
    expect(validateCreateGoal("  Complete one finished character color study.  "))
      .toEqual({
        success: true,
        value: { goal: "Complete one finished character color study." }
      });
    expect(validateCreateGoal("Sketch")).toEqual({
      success: false,
      errors: ["Describe a concrete output goal in 12 to 240 characters"]
    });
  });

  it("keeps commitment kinds and details closed", () => {
    const kinds: Record<CommitmentKind, true> = {
      build: true,
      create: true,
      repeating_criterion: true
    };
    const details: CommitmentDetails[] = [
      {
        kind: "build",
        task: "Ship the template evidence union",
        deliverableType: "pull_request"
      },
      {
        kind: "create",
        goal: "Complete one character color study"
      },
      {
        kind: "repeating_criterion",
        criterion: "Read 20 pages"
      }
    ];

    expect(Object.keys(kinds)).toEqual([
      "build",
      "create",
      "repeating_criterion"
    ]);
    expect(details.map((detail) => detail.kind)).toEqual(Object.keys(kinds));
  });

  it.each([
    [
      {
        kind: "fitness",
        activityType: "Strength training",
        completionNote: "Completed all five working sets."
      },
      {
        resultSummary: "Completed all five working sets.",
        artifactUrl: ""
      }
    ],
    [
      {
        kind: "reading",
        title: "Designing Data-Intensive Applications",
        amountCompleted: 12,
        unit: "pages",
        note: ""
      },
      {
        resultSummary:
          "Read 12 pages of Designing Data-Intensive Applications",
        artifactUrl: ""
      }
    ],
    [
      {
        kind: "study",
        topic: "Consensus protocols",
        durationMinutes: 35,
        takeaway: "Mapped the quorum intersection requirement."
      },
      {
        resultSummary: "Mapped the quorum intersection requirement.",
        artifactUrl: ""
      }
    ],
    [
      {
        kind: "build",
        resultSummary: "Implemented typed evidence for every Pods template.",
        artifactUrl: "https://github.com/nimiq/pods/pull/42"
      },
      {
        resultSummary: "Implemented typed evidence for every Pods template.",
        artifactUrl: "https://github.com/nimiq/pods/pull/42"
      }
    ],
    [
      {
        kind: "create",
        reflection: "Refined the silhouette and final color study.",
        artifactUrl: "https://example.com/art/character-study"
      },
      {
        resultSummary: "Refined the silhouette and final color study.",
        artifactUrl: "https://example.com/art/character-study"
      }
    ]
  ] as Array<[TemplateEvidence, { resultSummary: string; artifactUrl: string }]>)(
    "projects legacy display columns without changing the canonical payload",
    (evidence, expected) => {
      expect(legacySubmissionProjection(evidence)).toEqual(expected);
    }
  );
});
