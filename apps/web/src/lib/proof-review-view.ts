import type {
  ProofCaseActor,
  ProofCaseEventType,
  ProofCaseResolution,
  ProofCaseStage,
  ProofShareMode,
  ProofSubmissionVersionKind
} from "@pods/domain";

type DateInput = Date | string | null;

export type ProofReviewView = {
  stage: ProofCaseStage;
  resolution: ProofCaseResolution | null;
  clarificationUsed: boolean;
  appealUsed: boolean;
  sharedWithPodAt: string | null;
  targetAt: string | null;
  stageDeadlineAt: string;
  absoluteDeadlineAt: string;
  events: Array<{
    sequence: number;
    type: ProofCaseEventType;
    actor: ProofCaseActor;
    payload: Record<string, unknown>;
    createdAt: string;
  }>;
  versions: Array<{
    ordinal: number;
    kind: ProofSubmissionVersionKind;
    resultSummary: string;
    artifactUrl: string;
    proofShareMode: ProofShareMode;
    hasEvidenceImage: boolean;
    createdAt: string;
  }>;
};

function iso(value: DateInput) {
  return value ? new Date(value).toISOString() : null;
}

export function proofReviewView(input: {
  submission: { reviewTargetAt: DateInput };
  proofCase: {
    stage: ProofCaseStage;
    resolution: ProofCaseResolution | null;
    clarificationUsed: boolean;
    appealUsed: boolean;
    sharedWithPodAt: DateInput;
    stageDeadlineAt: Date | string;
    absoluteDeadlineAt: Date | string;
  };
  events: Array<{
    sequence: number;
    type: ProofCaseEventType;
    actor: ProofCaseActor;
    payload: Record<string, unknown>;
    createdAt: Date | string;
  }>;
  versions: Array<{
    ordinal: number;
    kind: ProofSubmissionVersionKind;
    resultSummary: string;
    artifactUrl: string;
    proofShareMode: ProofShareMode;
    evidenceObjectKey: string | null;
    createdAt: Date | string;
  }>;
}): ProofReviewView {
  return {
    stage: input.proofCase.stage,
    resolution: input.proofCase.resolution,
    clarificationUsed: input.proofCase.clarificationUsed,
    appealUsed: input.proofCase.appealUsed,
    sharedWithPodAt: iso(input.proofCase.sharedWithPodAt),
    targetAt: iso(input.submission.reviewTargetAt),
    stageDeadlineAt: new Date(input.proofCase.stageDeadlineAt).toISOString(),
    absoluteDeadlineAt: new Date(input.proofCase.absoluteDeadlineAt).toISOString(),
    events: input.events.map((event) => ({
      sequence: event.sequence,
      type: event.type,
      actor: event.actor,
      payload: structuredClone(event.payload),
      createdAt: new Date(event.createdAt).toISOString()
    })),
    versions: input.versions.map((version) => ({
      ordinal: version.ordinal,
      kind: version.kind,
      resultSummary: version.resultSummary,
      artifactUrl: version.artifactUrl,
      proofShareMode: version.proofShareMode,
      hasEvidenceImage: Boolean(version.evidenceObjectKey),
      createdAt: new Date(version.createdAt).toISOString()
    }))
  };
}
