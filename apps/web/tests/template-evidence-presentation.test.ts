import { describe, expect, it } from "vitest";

import { presentTemplateEvidence } from "../src/lib/template-evidence-presentation";

describe("template evidence presentation", () => {
  it("presents Fitness evidence against the frozen movement rule", () => {
    expect(presentTemplateEvidence({
      templateId: "fitness",
      frozenConfig: {
        activityType: "Outdoor run",
        measurableMinimum: "Run at least 3 km"
      },
      templateEvidence: {
        kind: "fitness",
        activityType: "Outdoor run",
        completionNote: "Completed 3.4 km before work."
      }
    })).toEqual({
      templateName: "Fitness & Movement",
      frozenCriterion: [
        { label: "Activity", value: "Outdoor run" },
        { label: "Minimum", value: "Run at least 3 km" }
      ],
      evidenceRows: [
        { label: "Activity completed", value: "Outdoor run" },
        { label: "Completion note", value: "Completed 3.4 km before work." }
      ],
      artifact: null,
      imageRequired: true
    });
  });

  it("presents Reading progress even when it is below the frozen target", () => {
    expect(presentTemplateEvidence({
      templateId: "reading",
      frozenConfig: {
        bookOrTheme: "The Design of Everyday Things",
        targetAmount: 20,
        targetType: "pages"
      },
      templateEvidence: {
        kind: "reading",
        title: "The Design of Everyday Things",
        amountCompleted: 12,
        unit: "pages",
        note: "Finished the chapter on discoverability."
      }
    })).toEqual({
      templateName: "Reading",
      frozenCriterion: [
        { label: "Book or theme", value: "The Design of Everyday Things" },
        { label: "Target", value: "20 pages" }
      ],
      evidenceRows: [
        { label: "Title", value: "The Design of Everyday Things" },
        { label: "Amount completed", value: "12 pages" },
        { label: "Reading note", value: "Finished the chapter on discoverability." }
      ],
      artifact: null,
      imageRequired: true
    });
  });

  it("presents typed Study minimums and the reported focus session", () => {
    expect(presentTemplateEvidence({
      templateId: "study",
      frozenConfig: {
        subject: "Distributed systems",
        minimumKind: "minutes",
        minimumMinutes: 45
      },
      templateEvidence: {
        kind: "study",
        topic: "Consensus safety",
        durationMinutes: 35,
        takeaway: "Quorum intersection prevents conflicting committed values."
      }
    })).toEqual({
      templateName: "Study & Focus",
      frozenCriterion: [
        { label: "Subject", value: "Distributed systems" },
        { label: "Minimum", value: "45 minutes" }
      ],
      evidenceRows: [
        { label: "Topic", value: "Consensus safety" },
        { label: "Focus duration", value: "35 minutes" },
        {
          label: "Takeaway",
          value: "Quorum intersection prevents conflicting committed values."
        }
      ],
      artifact: null,
      imageRequired: true
    });
  });

  it("presents Build evidence and only exposes a safe public artifact", () => {
    expect(presentTemplateEvidence({
      templateId: "build",
      frozenConfig: { projectTheme: "Pods mobile activity experience" },
      commitment: {
        task: "Ship the template-aware creator review",
        deliverableType: "pull_request"
      },
      templateEvidence: {
        kind: "build",
        resultSummary: "Added exact evidence rows for every frozen template.",
        artifactUrl: "https://github.com/example/pods/pull/42"
      }
    })).toEqual({
      templateName: "Build & Ship",
      frozenCriterion: [
        { label: "Project theme", value: "Pods mobile activity experience" },
        { label: "Locked task", value: "Ship the template-aware creator review" },
        { label: "Deliverable", value: "GitHub pull request" }
      ],
      evidenceRows: [
        {
          label: "Result summary",
          value: "Added exact evidence rows for every frozen template."
        }
      ],
      artifact: {
        label: "Open public artifact",
        href: "https://github.com/example/pods/pull/42"
      },
      imageRequired: false
    });
  });

  it("presents Practice evidence with its locked output goal", () => {
    expect(presentTemplateEvidence({
      templateId: "create",
      frozenConfig: {
        discipline: "Digital illustration",
        minimumExpectation: "Complete one character study"
      },
      commitment: {
        task: "Complete a light and shadow character study",
        deliverableType: null
      },
      templateEvidence: {
        kind: "create",
        reflection: "The second lighting pass made the silhouette much clearer.",
        artifactUrl: "https://example.com/art/character-study"
      }
    })).toEqual({
      templateName: "Practice & Create",
      frozenCriterion: [
        { label: "Discipline", value: "Digital illustration" },
        { label: "Minimum", value: "Complete one character study" },
        { label: "Locked output goal", value: "Complete a light and shadow character study" }
      ],
      evidenceRows: [
        {
          label: "Reflection",
          value: "The second lighting pass made the silhouette much clearer."
        }
      ],
      artifact: {
        label: "Open shared artifact",
        href: "https://example.com/art/character-study"
      },
      imageRequired: false
    });
  });

  it("keeps a legacy Build submission readable without trusting unsafe URLs", () => {
    expect(presentTemplateEvidence({
      templateId: "build",
      frozenConfig: { projectTheme: "Legacy Pods build" },
      commitment: {
        task: "Ship the legacy path",
        deliverableType: "commit"
      },
      templateEvidence: null,
      legacySubmission: {
        resultSummary: "Shipped the compatible reader.",
        artifactUrl: "javascript:alert(1)"
      }
    })).toEqual({
      templateName: "Build & Ship",
      frozenCriterion: [
        { label: "Project theme", value: "Legacy Pods build" },
        { label: "Locked task", value: "Ship the legacy path" },
        { label: "Deliverable", value: "GitHub commit" }
      ],
      evidenceRows: [
        { label: "Result summary", value: "Shipped the compatible reader." }
      ],
      artifact: null,
      imageRequired: false
    });
  });
});
