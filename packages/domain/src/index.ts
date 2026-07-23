import { Temporal } from "@js-temporal/polyfill";

export type TemplateId = "fitness" | "reading" | "study" | "build" | "create";
export type EvidenceMode = "repeating_criterion" | "per_occurrence_commitment";
export type SettlementMode = "proportional" | "full_refund_alpha";
export type PodVisibility = "public" | "private";
export type RoomAudience = "members_only" | "public_read_only";
export type PodViewerMode = "member" | "visitor";
export type PodState =
  | "draft"
  | "enrollment_open"
  | "cutoff_evaluating"
  | "locked_scheduled"
  | "active"
  | "final_review"
  | "completed"
  | "cancelled_refunding"
  | "cancelled";

export * from "./enrollment";
export * from "./funding";
export * from "./activity";
export * from "./alpha-capabilities";
export * from "./social";
export * from "./settlement";

export const templateContracts = [
  {
    id: "fitness",
    name: "Fitness & Movement",
    mode: "repeating_criterion",
    summary: "Show up for a measurable movement commitment.",
    evidence: "In-app photo plus a short completion note"
  },
  {
    id: "reading",
    name: "Reading",
    mode: "repeating_criterion",
    summary: "Keep a shared reading cadence with visible progress.",
    evidence: "Title, pages or minutes, and a reading artifact"
  },
  {
    id: "study",
    name: "Study & Focus",
    mode: "repeating_criterion",
    summary: "Protect focused sessions and document the outcome.",
    evidence: "Topic, duration, focus artifact, and takeaway"
  },
  {
    id: "build",
    name: "Build & Ship",
    mode: "per_occurrence_commitment",
    summary: "Lock one concrete task, then ship visible work.",
    evidence: "Locked task, result summary, and public artifact link"
  },
  {
    id: "create",
    name: "Practice & Create",
    mode: "per_occurrence_commitment",
    summary: "Commit to a practice output and share the artifact.",
    evidence: "Locked output goal, artifact, and reflection"
  }
] as const satisfies ReadonlyArray<{
  id: TemplateId;
  name: string;
  mode: EvidenceMode;
  summary: string;
  evidence: string;
}>;

export interface ActivityStepInput {
  name: string;
  purpose: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  weekdays: number[];
  config: Record<string, unknown>;
}

export type CommunityStepInput =
  | {
      visibility: "public";
      minParticipants: number;
      maxParticipants: number;
      applicationQuestions: string[];
      roomAudience?: RoomAudience;
    }
  | {
      visibility: "private";
      minParticipants: number;
      maxParticipants: number;
      inviteExpiryHours: number;
    };

export interface CommitmentStepInput {
  nimPerOccurrence: string;
}

export interface PodDraftInput {
  templateId: TemplateId;
  activity: ActivityStepInput;
  community: CommunityStepInput;
  commitment: CommitmentStepInput;
}

export interface FrozenOccurrence {
  ordinal: number;
  localDate: string;
  opensAt: string;
  closesAt: string;
  commitmentDeadlineAt: string | null;
}

interface PublishedPodContractBase {
  templateId: TemplateId;
  evidenceMode: EvidenceMode;
  settlementMode: SettlementMode;
  activity: ActivityStepInput;
  commitment: {
    lunaPerOccurrence: number;
    occurrenceCount: number;
    totalLuna: number;
  };
  verification: {
    verifier: "pods_team" | "creator";
    targetReviewHours: 12;
    timeoutProtectionHours: 24;
  };
}

export interface PublishedPodContractV1 extends PublishedPodContractBase {
  version: 1;
  community: CommunityStepInput;
}

export interface PublishedPodContractV2 extends PublishedPodContractBase {
  version: 2;
  community: Extract<CommunityStepInput, { visibility: "public" }> & {
    roomAudience: RoomAudience;
  };
}

export type PublishedPodContract = PublishedPodContractV1 | PublishedPodContractV2;

export function publishedRoomAudience(contract: PublishedPodContract): RoomAudience {
  return contract.version === 2 ? contract.community.roomAudience : "members_only";
}

export function isPublicVisitorContract(
  contract: PublishedPodContract
): contract is PublishedPodContractV2 {
  return (
    contract.version === 2 &&
    contract.community.visibility === "public" &&
    contract.community.roomAudience === "public_read_only"
  );
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function positiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validateSchedule(input: ActivityStepInput, errors: string[]) {
  if (!nonEmptyString(input.name) || input.name.trim().length < 3) {
    errors.push("Name must contain at least three characters");
  }
  if (!nonEmptyString(input.purpose) || input.purpose.trim().length < 20) {
    errors.push("Purpose must contain at least twenty characters");
  }
  if (!Array.isArray(input.weekdays) || input.weekdays.length === 0) {
    errors.push("Choose at least one scheduled weekday");
  } else if (
    new Set(input.weekdays).size !== input.weekdays.length ||
    input.weekdays.some((weekday) => !Number.isInteger(weekday) || weekday < 1 || weekday > 7)
  ) {
    errors.push("Scheduled weekdays must be unique values from one to seven");
  }

  try {
    const start = Temporal.PlainDate.from(input.startDate);
    const end = Temporal.PlainDate.from(input.endDate);
    start.toZonedDateTime({ timeZone: input.timeZone, plainTime: "00:00" });
    if (Temporal.PlainDate.compare(start, end) > 0) {
      errors.push("End date cannot be before start date");
    }
  } catch {
    errors.push("Choose valid dates and an IANA timezone");
  }
}

export function validateActivityStep(
  templateId: TemplateId,
  input: ActivityStepInput
): ValidationResult {
  const errors: string[] = [];
  validateSchedule(input, errors);
  const config = isRecord(input.config) ? input.config : {};

  if (templateId === "fitness") {
    if (!nonEmptyString(config.activityType)) errors.push("Describe the activity type");
    if (!nonEmptyString(config.measurableMinimum)) errors.push("Set a measurable minimum");
  }
  if (templateId === "reading") {
    if (!nonEmptyString(config.bookOrTheme)) errors.push("Add a book or reading theme");
    if (!positiveNumber(config.targetAmount)) errors.push("Set a positive page or minute target");
    if (config.targetType !== "pages" && config.targetType !== "minutes") {
      errors.push("Choose pages or minutes as the reading target");
    }
  }
  if (templateId === "study") {
    if (!nonEmptyString(config.subject)) errors.push("Add a study subject");
    if (!nonEmptyString(config.minimumExpectation)) errors.push("Set a focused-session minimum");
  }
  if (templateId === "build") {
    if (!nonEmptyString(config.projectTheme)) errors.push("Add a project theme");
    if (!Array.isArray(config.allowedDeliverables) || config.allowedDeliverables.length === 0) {
      errors.push("Choose at least one allowed deliverable");
    }
    if (!validTime(config.commitmentCutoff)) errors.push("Choose a commitment cutoff");
  }
  if (templateId === "create") {
    if (!nonEmptyString(config.discipline)) errors.push("Add a creative discipline");
    if (!nonEmptyString(config.minimumExpectation)) errors.push("Set a practice or output minimum");
    if (!validTime(config.commitmentCutoff)) errors.push("Choose a commitment cutoff");
  }

  if (errors.length === 0) {
    try {
      const cutoff =
        templateId === "build" || templateId === "create"
          ? String(config.commitmentCutoff)
          : undefined;
      const occurrences = materializeOccurrences({
        startDate: input.startDate,
        endDate: input.endDate,
        timeZone: input.timeZone,
        weekdays: input.weekdays,
        ...(cutoff ? { commitmentCutoff: cutoff } : {})
      });
      if (occurrences.length === 0) errors.push("Schedule must create at least one occurrence");
    } catch {
      errors.push("Schedule could not be materialized");
    }
  }

  return { success: errors.length === 0, errors };
}

export function validateCommunityStep(input: CommunityStepInput): ValidationResult {
  const errors: string[] = [];
  if (!positiveNumber(input.minParticipants) || input.minParticipants < 2) {
    errors.push("Minimum participants must be at least two");
  }
  if (!positiveNumber(input.maxParticipants)) {
    errors.push("Maximum participants must be a positive whole number");
  } else if (input.maxParticipants < input.minParticipants) {
    errors.push("Maximum participants cannot be below the minimum");
  }
  if (input.visibility === "public") {
    if (!Array.isArray(input.applicationQuestions)) {
      errors.push("Application questions must be a list");
    }
    if (
      input.roomAudience !== undefined &&
      input.roomAudience !== "members_only" &&
      input.roomAudience !== "public_read_only"
    ) {
      errors.push("Choose a supported visitor-room audience");
    }
  } else {
    if (!positiveNumber(input.inviteExpiryHours)) {
      errors.push("Private invitation expiry must be a positive number of hours");
    }
    if ("roomAudience" in input) {
      errors.push("Private Pods cannot expose a visitor room");
    }
  }
  return { success: errors.length === 0, errors };
}

export function parseNimToLuna(value: string): number {
  const normalized = value.trim();
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(normalized);
  if (!match) throw new Error("Enter a valid NIM amount");
  const fraction = match[2] ?? "";
  if (fraction.length > 5) throw new Error("NIM supports at most five decimal places");
  const wholeLuna = BigInt(match[1] ?? "0") * 100_000n;
  const fractionalLuna = BigInt(fraction.padEnd(5, "0") || "0");
  const total = wholeLuna + fractionalLuna;
  if (total <= 0n) throw new Error("NIM per occurrence must be greater than zero");
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("NIM amount is too large");
  return Number(total);
}

export function materializeOccurrences(input: {
  startDate: string;
  endDate: string;
  timeZone: string;
  weekdays: number[];
  commitmentCutoff?: string;
}): FrozenOccurrence[] {
  let date = Temporal.PlainDate.from(input.startDate);
  const endDate = Temporal.PlainDate.from(input.endDate);
  const weekdays = new Set(input.weekdays);
  const occurrences: FrozenOccurrence[] = [];

  if (Temporal.PlainDate.compare(date, endDate) > 0) {
    throw new Error("End date cannot be before start date");
  }
  if (input.commitmentCutoff && !validTime(input.commitmentCutoff)) {
    throw new Error("Commitment cutoff must use HH:mm");
  }

  while (Temporal.PlainDate.compare(date, endDate) <= 0) {
    if (weekdays.has(date.dayOfWeek)) {
      const start = date.toZonedDateTime({ timeZone: input.timeZone, plainTime: "00:00" });
      const end = date.add({ days: 1 }).toZonedDateTime({
        timeZone: input.timeZone,
        plainTime: "00:00"
      });
      const commitmentDeadline = input.commitmentCutoff
        ? date.toZonedDateTime({
            timeZone: input.timeZone,
            plainTime: input.commitmentCutoff
          })
        : null;
      occurrences.push({
        ordinal: occurrences.length + 1,
        localDate: date.toString(),
        opensAt: start.toInstant().toString(),
        closesAt: end.toInstant().toString(),
        commitmentDeadlineAt: commitmentDeadline?.toInstant().toString() ?? null
      });
    }
    date = date.add({ days: 1 });
  }

  return occurrences;
}

export function validatePublicationTiming(
  occurrences: FrozenOccurrence[],
  now = new Date()
): ValidationResult {
  const firstOccurrence = occurrences[0];
  if (!firstOccurrence) return { success: false, errors: ["Schedule must create at least one occurrence"] };
  if (new Date(firstOccurrence.opensAt).getTime() <= now.getTime()) {
    return { success: false, errors: ["Publish before the first occurrence opens"] };
  }
  return { success: true, errors: [] };
}

export function buildPublishedContract(
  draft: PodDraftInput,
  options: { settlementMode?: SettlementMode } = {}
):
  | { success: true; contract: PublishedPodContract; occurrences: FrozenOccurrence[] }
  | { success: false; errors: string[] } {
  const template = templateContracts.find((item) => item.id === draft.templateId);
  if (!template) return { success: false, errors: ["Choose a supported template"] };

  const activity = validateActivityStep(draft.templateId, draft.activity);
  const community = validateCommunityStep(draft.community);
  const errors = [...activity.errors, ...community.errors];
  let lunaPerOccurrence = 0;
  try {
    lunaPerOccurrence = parseNimToLuna(draft.commitment.nimPerOccurrence);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Enter a valid NIM amount");
  }
  if (errors.length > 0) return { success: false, errors };

  const commitmentCutoff =
    template.mode === "per_occurrence_commitment"
      ? String(draft.activity.config.commitmentCutoff)
      : undefined;
  const occurrences = materializeOccurrences({
    startDate: draft.activity.startDate,
    endDate: draft.activity.endDate,
    timeZone: draft.activity.timeZone,
    weekdays: draft.activity.weekdays,
    ...(commitmentCutoff ? { commitmentCutoff } : {})
  });
  const totalLuna = lunaPerOccurrence * occurrences.length;
  if (!Number.isSafeInteger(totalLuna)) {
    return { success: false, errors: ["Total commitment is too large"] };
  }

  const sharedContract = {
    templateId: draft.templateId,
    evidenceMode: template.mode,
    settlementMode: options.settlementMode ?? "full_refund_alpha",
    activity: structuredClone(draft.activity),
    commitment: {
      lunaPerOccurrence,
      occurrenceCount: occurrences.length,
      totalLuna
    },
    verification: {
      verifier: "creator" as const,
      targetReviewHours: 12 as const,
      timeoutProtectionHours: 24 as const
    }
  };
  let contract: PublishedPodContract;
  if (
    draft.community.visibility === "public" &&
    draft.community.roomAudience !== undefined
  ) {
    contract = {
        ...sharedContract,
        version: 2,
        community: {
          ...structuredClone(draft.community),
          roomAudience: draft.community.roomAudience
        }
      };
  } else {
    contract = {
        ...sharedContract,
        version: 1,
        community: structuredClone(draft.community)
      };
  }

  return {
    success: true,
    contract,
    occurrences
  };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)])
    );
  }
  return value;
}

export function serializePublishedContract(contract: PublishedPodContract): string {
  return JSON.stringify(stableValue(contract));
}
