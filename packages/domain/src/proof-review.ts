export type ProofCaseStage =
  | "initial_review"
  | "awaiting_clarification"
  | "post_clarification_review"
  | "appeal_open"
  | "appeal_review"
  | "resolved";

export type ProofCaseResolution =
  | "approved"
  | "rejected"
  | "timeout_protected"
  | "grace";

export type ProofCaseActor = "participant" | "creator" | "system";
export type ProofSubmissionVersionKind = "initial" | "clarification" | "appeal";
export type EvidenceReservationState =
  | "reserved"
  | "uploaded"
  | "consumed"
  | "expired";

export type ProofCaseEventType =
  | "approve"
  | "request_clarification"
  | "respond_clarification"
  | "provisionally_reject"
  | "open_appeal"
  | "accept_rejection"
  | "appeal_approve"
  | "appeal_reject"
  | "appeal_grace"
  | "review_timeout"
  | "clarification_timeout"
  | "appeal_window_timeout"
  | "appeal_review_timeout"
  | "absolute_timeout";

export interface ProofCaseState {
  stage: ProofCaseStage;
  clarificationUsed: boolean;
  appealUsed: boolean;
  resolution: ProofCaseResolution | null;
}

export interface ProofCaseEvent {
  type: ProofCaseEventType;
  actor: ProofCaseActor;
}

export type ProofRejectionCategory =
  | "evidence_missing"
  | "commitment_mismatch"
  | "artifact_unverifiable"
  | "insufficient_detail"
  | "other";

export interface ClarificationRequestInput {
  reason: string;
  requestedChange: string;
  reference: string;
}

export interface ProvisionalRejectionInput {
  category: ProofRejectionCategory;
  reason: string;
  unmetCriteria: string[];
  suggestedCorrection: string;
}

export interface ClarificationResponseInput {
  note: string;
  artifactUrl: string | null;
}

export interface AppealInput {
  reason: string;
  artifactUrl: string | null;
}

type ValidationFailure = { success: false; errors: string[] };
type ValidationSuccess<T> = { success: true; value: T };

function resolved(
  state: ProofCaseState,
  resolution: ProofCaseResolution
): ProofCaseState {
  return { ...state, stage: "resolved", resolution };
}

export function nextProofCaseState(
  state: ProofCaseState,
  event: ProofCaseEvent
): ProofCaseState | null {
  if (state.stage === "resolved" || state.resolution !== null) return null;

  if (
    (state.stage === "initial_review" || state.stage === "post_clarification_review") &&
    event.type === "approve" &&
    event.actor === "creator"
  ) {
    return resolved(state, "approved");
  }
  if (
    (state.stage === "initial_review" || state.stage === "post_clarification_review") &&
    event.type === "request_clarification" &&
    event.actor === "creator" &&
    !state.clarificationUsed
  ) {
    return {
      ...state,
      stage: "awaiting_clarification",
      clarificationUsed: true
    };
  }
  if (
    (state.stage === "initial_review" || state.stage === "post_clarification_review") &&
    event.type === "provisionally_reject" &&
    event.actor === "creator"
  ) {
    return { ...state, stage: "appeal_open" };
  }
  if (
    state.stage === "awaiting_clarification" &&
    event.type === "respond_clarification" &&
    event.actor === "participant"
  ) {
    return { ...state, stage: "post_clarification_review" };
  }
  if (
    state.stage === "appeal_open" &&
    event.type === "open_appeal" &&
    event.actor === "participant" &&
    !state.appealUsed
  ) {
    return { ...state, stage: "appeal_review", appealUsed: true };
  }
  if (
    state.stage === "appeal_open" &&
    event.type === "accept_rejection" &&
    event.actor === "participant"
  ) {
    return resolved(state, "rejected");
  }
  if (state.stage === "appeal_review" && event.actor === "creator") {
    if (event.type === "appeal_approve") return resolved(state, "approved");
    if (event.type === "appeal_reject") return resolved(state, "rejected");
    if (event.type === "appeal_grace") return resolved(state, "grace");
  }
  if (
    (state.stage === "initial_review" || state.stage === "post_clarification_review") &&
    event.type === "review_timeout" &&
    event.actor === "system"
  ) {
    return resolved(state, "timeout_protected");
  }
  if (
    state.stage === "awaiting_clarification" &&
    event.type === "clarification_timeout" &&
    event.actor === "system"
  ) {
    return { ...state, stage: "appeal_open" };
  }
  if (
    state.stage === "appeal_open" &&
    event.type === "appeal_window_timeout" &&
    event.actor === "system"
  ) {
    return resolved(state, "rejected");
  }
  if (
    state.stage === "appeal_review" &&
    event.type === "appeal_review_timeout" &&
    event.actor === "system"
  ) {
    return resolved(state, "grace");
  }
  if (event.type === "absolute_timeout" && event.actor === "system") {
    return resolved(
      state,
      state.stage === "initial_review" ? "timeout_protected" : "grace"
    );
  }
  return null;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function proofCaseDeadlines(
  submittedAt: Date,
  stageEnteredAt: Date,
  stageHours = 24
) {
  const absoluteDeadlineAt = addHours(submittedAt, 72);
  const derivedStageDeadline = addHours(stageEnteredAt, stageHours);
  return {
    targetAt: addHours(submittedAt, 12),
    stageDeadlineAt: new Date(
      Math.min(derivedStageDeadline.getTime(), absoluteDeadlineAt.getTime())
    ),
    absoluteDeadlineAt
  };
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validLength(value: string, minimum: number, maximum: number) {
  return value.length >= minimum && value.length <= maximum;
}

function optionalHttpsUrl(value: string): boolean {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function validateClarificationRequest(
  input: unknown
): ValidationSuccess<ClarificationRequestInput> | ValidationFailure {
  const candidate = record(input);
  const value = {
    reason: text(candidate.reason),
    requestedChange: text(candidate.requestedChange),
    reference: text(candidate.reference)
  };
  const errors: string[] = [];
  if (!validLength(value.reason, 20, 1_200)) {
    errors.push("Explain why clarification is needed in 20 to 1200 characters");
  }
  if (!validLength(value.requestedChange, 20, 1_200)) {
    errors.push("Describe the requested proof change in 20 to 1200 characters");
  }
  if (value.reference.length > 500) {
    errors.push("Keep the clarification reference within 500 characters");
  }
  return errors.length > 0 ? { success: false, errors } : { success: true, value };
}

const rejectionCategories = new Set<ProofRejectionCategory>([
  "evidence_missing",
  "commitment_mismatch",
  "artifact_unverifiable",
  "insufficient_detail",
  "other"
]);

export function validateProvisionalRejection(
  input: unknown
): ValidationSuccess<ProvisionalRejectionInput> | ValidationFailure {
  const candidate = record(input);
  const category = String(candidate.category ?? "") as ProofRejectionCategory;
  const criteria = Array.isArray(candidate.unmetCriteria)
    ? candidate.unmetCriteria.map(text).filter(Boolean)
    : [];
  const value = {
    category,
    reason: text(candidate.reason),
    unmetCriteria: criteria,
    suggestedCorrection: text(candidate.suggestedCorrection)
  };
  const errors: string[] = [];
  if (!rejectionCategories.has(category)) errors.push("Choose a rejection category");
  if (!validLength(value.reason, 20, 1_200)) {
    errors.push("Explain the rejection in 20 to 1200 characters");
  }
  if (
    criteria.length < 1 ||
    criteria.length > 5 ||
    criteria.some((criterion) => !validLength(criterion, 3, 240))
  ) {
    errors.push("Add one to five unmet criteria within 3 to 240 characters each");
  }
  if (value.suggestedCorrection.length > 1_200) {
    errors.push("Keep the suggested correction within 1200 characters");
  }
  return errors.length > 0 ? { success: false, errors } : { success: true, value };
}

export function validateClarificationResponse(
  input: unknown
): ValidationSuccess<ClarificationResponseInput> | ValidationFailure {
  const candidate = record(input);
  const artifactUrl = text(candidate.artifactUrl);
  const value = {
    note: text(candidate.note),
    artifactUrl: artifactUrl || null
  };
  const errors: string[] = [];
  if (!validLength(value.note, 20, 1_200)) {
    errors.push("Explain the clarification in 20 to 1200 characters");
  }
  if (!optionalHttpsUrl(artifactUrl)) errors.push("Add a valid HTTPS artifact URL");
  return errors.length > 0 ? { success: false, errors } : { success: true, value };
}

export function validateAppealInput(
  input: unknown
): ValidationSuccess<AppealInput> | ValidationFailure {
  const candidate = record(input);
  const reason = text(candidate.reason);
  const artifactUrl = text(candidate.artifactUrl);
  const errors: string[] = [];
  if (!validLength(reason, 20, 1_200)) {
    errors.push("Explain the appeal in 20 to 1200 characters");
  }
  if (!optionalHttpsUrl(artifactUrl)) {
    errors.push("Add a valid HTTPS appeal artifact URL");
  }
  return errors.length > 0
    ? { success: false, errors }
    : { success: true, value: { reason, artifactUrl: artifactUrl || null } };
}
