import {
  templateContracts,
  type BuildDeliverableType,
  type TemplateEvidence,
  type TemplateId
} from "@pods/domain";

export interface TemplateEvidencePresentation {
  templateName: string;
  frozenCriterion: Array<{ label: string; value: string }>;
  evidenceRows: Array<{ label: string; value: string }>;
  artifact: { label: string; href: string } | null;
  imageRequired: boolean;
}

interface PresentationInput {
  templateId: TemplateId;
  frozenConfig: unknown;
  commitment?: {
    task: string;
    deliverableType: BuildDeliverableType | null;
  } | null;
  templateEvidence?: TemplateEvidence | null;
  legacySubmission?: {
    resultSummary: string;
    artifactUrl: string;
  };
}

const deliverableLabels: Record<BuildDeliverableType, string> = {
  pull_request: "GitHub pull request",
  commit: "GitHub commit",
  issue: "GitHub issue",
  live_artifact: "Live artifact"
};

export function presentTemplateEvidence(
  input: PresentationInput
): TemplateEvidencePresentation {
  const config = asRecord(input.frozenConfig);
  const templateName =
    templateContracts.find((template) => template.id === input.templateId)?.name ??
    "Activity";
  const evidence =
    input.templateEvidence?.kind === input.templateId
      ? input.templateEvidence
      : legacyBuildEvidence(input);

  if (input.templateId === "fitness") {
    return {
      templateName,
      frozenCriterion: compactRows([
        row("Activity", config.activityType),
        row("Minimum", config.measurableMinimum)
      ]),
      evidenceRows:
        evidence?.kind === "fitness"
          ? compactRows([
              row("Activity completed", evidence.activityType),
              row("Completion note", evidence.completionNote)
            ])
          : [],
      artifact: null,
      imageRequired: true
    };
  }

  if (input.templateId === "reading") {
    const targetAmount = finiteNumber(config.targetAmount);
    const targetUnit =
      config.targetType === "pages" || config.targetType === "minutes"
        ? config.targetType
        : "";
    return {
      templateName,
      frozenCriterion: compactRows([
        row("Book or theme", config.bookOrTheme),
        row(
          "Target",
          targetAmount && targetUnit ? `${targetAmount} ${targetUnit}` : ""
        )
      ]),
      evidenceRows:
        evidence?.kind === "reading"
          ? compactRows([
              row("Title", evidence.title),
              row(
                "Amount completed",
                `${evidence.amountCompleted} ${evidence.unit}`
              ),
              row("Reading note", evidence.note)
            ])
          : [],
      artifact: null,
      imageRequired: true
    };
  }

  if (input.templateId === "study") {
    return {
      templateName,
      frozenCriterion: compactRows([
        row("Subject", config.subject),
        row("Minimum", studyMinimum(config))
      ]),
      evidenceRows:
        evidence?.kind === "study"
          ? compactRows([
              row("Topic", evidence.topic),
              row("Focus duration", `${evidence.durationMinutes} minutes`),
              row("Takeaway", evidence.takeaway)
            ])
          : [],
      artifact: null,
      imageRequired: true
    };
  }

  if (input.templateId === "build") {
    const artifactUrl =
      evidence?.kind === "build" ? safeHttpsUrl(evidence.artifactUrl) : null;
    return {
      templateName,
      frozenCriterion: compactRows([
        row("Project theme", config.projectTheme),
        row("Locked task", input.commitment?.task),
        row(
          "Deliverable",
          input.commitment?.deliverableType
            ? deliverableLabels[input.commitment.deliverableType]
            : ""
        )
      ]),
      evidenceRows:
        evidence?.kind === "build"
          ? compactRows([row("Result summary", evidence.resultSummary)])
          : [],
      artifact: artifactUrl
        ? { label: "Open public artifact", href: artifactUrl }
        : null,
      imageRequired: false
    };
  }

  const artifactUrl =
    evidence?.kind === "create" && evidence.artifactUrl
      ? safeHttpsUrl(evidence.artifactUrl)
      : null;
  return {
    templateName,
    frozenCriterion: compactRows([
      row("Discipline", config.discipline),
      row("Minimum", config.minimumExpectation),
      row("Locked output goal", input.commitment?.task)
    ]),
    evidenceRows:
      evidence?.kind === "create"
        ? compactRows([row("Reflection", evidence.reflection)])
        : [],
    artifact: artifactUrl
      ? { label: "Open shared artifact", href: artifactUrl }
      : null,
    imageRequired: false
  };
}

function legacyBuildEvidence(input: PresentationInput): TemplateEvidence | null {
  if (input.templateId !== "build" || !input.legacySubmission) return null;
  return {
    kind: "build",
    resultSummary: normalizedText(input.legacySubmission.resultSummary),
    artifactUrl: normalizedText(input.legacySubmission.artifactUrl)
  };
}

function studyMinimum(config: Record<string, unknown>): string {
  if (config.minimumKind === "minutes") {
    const minutes = finiteNumber(config.minimumMinutes);
    if (minutes) return `${minutes} minutes`;
  }
  if (config.minimumKind === "output") {
    return normalizedText(config.minimumOutput);
  }
  return normalizedText(config.minimumExpectation);
}

function row(label: string, value: unknown) {
  return { label, value: normalizedText(value) };
}

function compactRows(
  rows: Array<{ label: string; value: string }>
): Array<{ label: string; value: string }> {
  return rows.filter((item) => item.value.length > 0);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizedText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
