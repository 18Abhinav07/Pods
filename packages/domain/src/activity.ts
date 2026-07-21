export type BuildDeliverableType =
  | "pull_request"
  | "commit"
  | "issue"
  | "live_artifact";

export type OccurrenceWindowState =
  | "scheduled"
  | "commitment_open"
  | "evidence_open"
  | "review_open";

export type SubmissionState = "draft" | "submitted" | "reviewing" | "approved";
export type SubmissionActor = "participant" | "system" | "reviewer";
export type SubmissionEvent = "submit" | "start_review" | "approve";

type ValidationFailure = { success: false; errors: string[] };

export function occurrenceWindowState(
  occurrence: {
    opensAt: Date;
    commitmentDeadlineAt: Date | null;
    closesAt: Date;
  },
  now: Date
): OccurrenceWindowState {
  if (now.getTime() < occurrence.opensAt.getTime()) return "scheduled";
  if (
    occurrence.commitmentDeadlineAt &&
    now.getTime() < occurrence.commitmentDeadlineAt.getTime()
  ) {
    return "commitment_open";
  }
  if (now.getTime() < occurrence.closesAt.getTime()) return "evidence_open";
  return "review_open";
}

export function validateBuildTask(input: {
  task: unknown;
  deliverableType: unknown;
  allowedDeliverables: unknown;
}):
  | {
      success: true;
      value: { task: string; deliverableType: BuildDeliverableType };
    }
  | ValidationFailure {
  const task = typeof input.task === "string" ? input.task.trim() : "";
  const allowed = Array.isArray(input.allowedDeliverables)
    ? input.allowedDeliverables.filter((value): value is string => typeof value === "string")
    : [];
  const errors: string[] = [];
  if (task.length < 12 || task.length > 240) {
    errors.push("Describe a concrete task in 12 to 240 characters");
  }
  if (
    !isBuildDeliverableType(input.deliverableType) ||
    !allowed.includes(input.deliverableType)
  ) {
    errors.push("Choose a deliverable allowed by the frozen Pod contract");
  }
  if (errors.length > 0) return { success: false, errors };
  return {
    success: true,
    value: { task, deliverableType: input.deliverableType as BuildDeliverableType }
  };
}

export function validateBuildEvidence(input: {
  deliverableType: BuildDeliverableType;
  resultSummary: unknown;
  artifactUrl: unknown;
}):
  | { success: true; value: { resultSummary: string; artifactUrl: string } }
  | ValidationFailure {
  const resultSummary =
    typeof input.resultSummary === "string" ? input.resultSummary.trim() : "";
  const artifactUrl = typeof input.artifactUrl === "string" ? input.artifactUrl.trim() : "";
  const errors: string[] = [];
  if (resultSummary.length < 20 || resultSummary.length > 1200) {
    errors.push("Summarize the completed result in 20 to 1200 characters");
  }
  if (!matchesDeliverableUrl(input.deliverableType, artifactUrl)) {
    errors.push(deliverableUrlError(input.deliverableType));
  }
  if (errors.length > 0) return { success: false, errors };
  return { success: true, value: { resultSummary, artifactUrl } };
}

export function nextSubmissionState(
  state: SubmissionState,
  event: SubmissionEvent,
  actor: SubmissionActor
): SubmissionState | null {
  if (state === "draft" && event === "submit" && actor === "participant") {
    return "submitted";
  }
  if (state === "submitted" && event === "start_review" && actor === "system") {
    return "reviewing";
  }
  if (state === "reviewing" && event === "approve" && actor === "reviewer") {
    return "approved";
  }
  return null;
}

export function reviewDeadline(submittedAt: Date) {
  return {
    targetAt: new Date(submittedAt.getTime() + 12 * 60 * 60 * 1000),
    hardDeadlineAt: new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000)
  };
}

function isBuildDeliverableType(value: unknown): value is BuildDeliverableType {
  return ["pull_request", "commit", "issue", "live_artifact"].includes(String(value));
}

function matchesDeliverableUrl(type: BuildDeliverableType, value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  if (type === "live_artifact") return true;
  if (url.hostname.toLowerCase() !== "github.com") return false;
  const patterns: Record<Exclude<BuildDeliverableType, "live_artifact">, RegExp> = {
    pull_request: /^\/[^/]+\/[^/]+\/pull\/\d+(?:\/)?$/,
    commit: /^\/[^/]+\/[^/]+\/commit\/[A-Za-z0-9]+(?:\/)?$/,
    issue: /^\/[^/]+\/[^/]+\/issues\/\d+(?:\/)?$/
  };
  return patterns[type].test(url.pathname);
}

function deliverableUrlError(type: BuildDeliverableType): string {
  if (type === "pull_request") {
    return "Add a GitHub pull request URL that matches the locked deliverable";
  }
  if (type === "commit") return "Add a GitHub commit URL that matches the locked deliverable";
  if (type === "issue") return "Add a GitHub issue URL that matches the locked deliverable";
  return "Add a valid HTTPS artifact URL that matches the locked deliverable";
}
