import {
  validateBuildEvidence,
  type BuildDeliverableType
} from "./activity";

export type TemplateEvidenceKind =
  | "fitness"
  | "reading"
  | "study"
  | "build"
  | "create";

export type TemplateEvidence =
  | {
      kind: "fitness";
      activityType: string;
      completionNote: string;
    }
  | {
      kind: "reading";
      title: string;
      amountCompleted: number;
      unit: "pages" | "minutes";
      note: string;
    }
  | {
      kind: "study";
      topic: string;
      durationMinutes: number;
      takeaway: string;
    }
  | {
      kind: "build";
      resultSummary: string;
      artifactUrl: string;
    }
  | {
      kind: "create";
      reflection: string;
      artifactUrl: string | null;
    };

export type CommitmentKind = "build" | "create" | "repeating_criterion";

export type CommitmentDetails =
  | {
      kind: "build";
      task: string;
      deliverableType: BuildDeliverableType;
    }
  | {
      kind: "create";
      goal: string;
    }
  | {
      kind: "repeating_criterion";
      criterion: string;
    };

type ValidationFailure = { success: false; errors: string[] };
type ValidationSuccess<T> = { success: true; value: T };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validateTemplateEvidenceDraft(input: {
  templateId: TemplateEvidenceKind;
  evidence: unknown;
}): ValidationResult<TemplateEvidence> {
  const evidence = asRecord(input.evidence);
  if (evidence.kind !== input.templateId) {
    return {
      success: false,
      errors: ["Evidence does not match the frozen Pod template"]
    };
  }

  if (input.templateId === "fitness") {
    return {
      success: true,
      value: {
        kind: "fitness",
        activityType: normalizedText(evidence.activityType),
        completionNote: normalizedText(evidence.completionNote)
      }
    };
  }

  if (input.templateId === "reading") {
    if (evidence.unit !== "pages" && evidence.unit !== "minutes") {
      return {
        success: false,
        errors: ["Choose pages or minutes for completed reading"]
      };
    }
    return {
      success: true,
      value: {
        kind: "reading",
        title: normalizedText(evidence.title),
        amountCompleted: normalizedNumber(evidence.amountCompleted),
        unit: evidence.unit,
        note: normalizedText(evidence.note)
      }
    };
  }

  if (input.templateId === "study") {
    return {
      success: true,
      value: {
        kind: "study",
        topic: normalizedText(evidence.topic),
        durationMinutes: normalizedNumber(evidence.durationMinutes),
        takeaway: normalizedText(evidence.takeaway)
      }
    };
  }

  if (input.templateId === "build") {
    return {
      success: true,
      value: {
        kind: "build",
        resultSummary: normalizedText(evidence.resultSummary),
        artifactUrl: normalizedText(evidence.artifactUrl)
      }
    };
  }

  const artifactUrl = normalizedText(evidence.artifactUrl);
  return {
    success: true,
    value: {
      kind: "create",
      reflection: normalizedText(evidence.reflection),
      artifactUrl: artifactUrl || null
    }
  };
}

export function validateTemplateEvidenceSubmission(input: {
  templateId: TemplateEvidenceKind;
  evidence: unknown;
  frozenConfig: unknown;
  hasEvidenceImage: boolean;
  deliverableType?: BuildDeliverableType;
}): ValidationResult<TemplateEvidence> {
  const parsed = validateTemplateEvidenceDraft(input);
  if (!parsed.success) return parsed;

  const evidence = parsed.value;
  const frozenConfig = asRecord(input.frozenConfig);
  const errors: string[] = [];

  if (evidence.kind === "fitness") {
    validateRequiredLength(
      evidence.activityType,
      1,
      120,
      "Frozen activity type is unavailable",
      errors
    );
    validateRequiredLength(
      evidence.completionNote,
      4,
      500,
      "Completion note must contain 4 to 500 characters",
      errors
    );
    const frozenActivity = normalizedText(frozenConfig.activityType);
    if (frozenActivity && evidence.activityType !== frozenActivity) {
      errors.push("Activity type must match the frozen Pod contract");
    }
    requireEvidenceImage(input.hasEvidenceImage, errors);
  }

  if (evidence.kind === "reading") {
    validateRequiredLength(
      evidence.title,
      1,
      240,
      "Reading title must contain 1 to 240 characters",
      errors
    );
    if (!isPositiveWholeNumber(evidence.amountCompleted)) {
      errors.push("Completed amount must be a positive whole number");
    }
    const frozenUnit = frozenConfig.targetType;
    if (
      (frozenUnit === "pages" || frozenUnit === "minutes") &&
      evidence.unit !== frozenUnit
    ) {
      errors.push(`Completed amount must use the frozen ${frozenUnit} unit`);
    }
    if (evidence.note.length > 500) {
      errors.push("Keep the reading note within 500 characters");
    }
    requireEvidenceImage(input.hasEvidenceImage, errors);
  }

  if (evidence.kind === "study") {
    validateRequiredLength(
      evidence.topic,
      1,
      240,
      "Study topic must contain 1 to 240 characters",
      errors
    );
    if (!isPositiveWholeNumber(evidence.durationMinutes)) {
      errors.push("Focus duration must be a positive whole number of minutes");
    }
    validateRequiredLength(
      evidence.takeaway,
      4,
      800,
      "Takeaway must contain 4 to 800 characters",
      errors
    );
    requireEvidenceImage(input.hasEvidenceImage, errors);
  }

  if (evidence.kind === "build") {
    if (!input.deliverableType) {
      errors.push("Locked deliverable type is unavailable");
    } else {
      const buildResult = validateBuildEvidence({
        deliverableType: input.deliverableType,
        resultSummary: evidence.resultSummary,
        artifactUrl: evidence.artifactUrl
      });
      if (!buildResult.success) errors.push(...buildResult.errors);
    }
  }

  if (evidence.kind === "create") {
    validateRequiredLength(
      evidence.reflection,
      12,
      1200,
      "Reflection must contain 12 to 1200 characters",
      errors
    );
    if (evidence.artifactUrl && !isSafeHttpsUrl(evidence.artifactUrl)) {
      errors.push("Artifact link must be a safe HTTPS URL");
    }
    if (!input.hasEvidenceImage && !evidence.artifactUrl) {
      errors.push("Add an image or HTTPS artifact link before submitting");
    }
  }

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, value: evidence };
}

export function validateCreateGoal(
  value: unknown
): ValidationResult<{ goal: string }> {
  const goal = normalizedText(value);
  if (goal.length < 12 || goal.length > 240) {
    return {
      success: false,
      errors: ["Describe a concrete output goal in 12 to 240 characters"]
    };
  }
  return { success: true, value: { goal } };
}

/**
 * Produces legacy display columns only. Callers must still apply the proof
 * audience policy before returning either field outside the owner or reviewer
 * boundary.
 */
export function legacySubmissionProjection(evidence: TemplateEvidence): {
  resultSummary: string;
  artifactUrl: string;
} {
  if (evidence.kind === "fitness") {
    return {
      resultSummary: evidence.completionNote,
      artifactUrl: ""
    };
  }
  if (evidence.kind === "reading") {
    return {
      resultSummary:
        evidence.note ||
        `Read ${evidence.amountCompleted} ${evidence.unit} of ${evidence.title}`,
      artifactUrl: ""
    };
  }
  if (evidence.kind === "study") {
    return {
      resultSummary: evidence.takeaway,
      artifactUrl: ""
    };
  }
  if (evidence.kind === "build") {
    return {
      resultSummary: evidence.resultSummary,
      artifactUrl: evidence.artifactUrl
    };
  }
  return {
    resultSummary: evidence.reflection,
    artifactUrl: evidence.artifactUrl ?? ""
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizedText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizedNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isPositiveWholeNumber(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function validateRequiredLength(
  value: string,
  minimum: number,
  maximum: number,
  error: string,
  errors: string[]
): void {
  if (value.length < minimum || value.length > maximum) errors.push(error);
}

function requireEvidenceImage(hasEvidenceImage: boolean, errors: string[]): void {
  if (!hasEvidenceImage) {
    errors.push("Add the required evidence image before submitting");
  }
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
