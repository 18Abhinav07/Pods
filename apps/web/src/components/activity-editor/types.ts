import type {
  BuildDeliverableType,
  CommitmentDetails,
  CommitmentKind,
  ProofShareMode,
  SubmissionState,
  TemplateEvidence
} from "@pods/domain";

export type ActivityCommitmentView = {
  id: string;
  kind?: CommitmentKind;
  task: string;
  deliverableType: BuildDeliverableType | null;
  details?: CommitmentDetails | null;
  lockedAt: string;
};

export type ActivitySubmissionView = {
  id: string;
  state: SubmissionState;
  resultSummary: string;
  artifactUrl: string;
  templateEvidence?: TemplateEvidence | null;
  evidenceObjectKey: string | null;
  proofShareMode: ProofShareMode;
};

export type TemplateEditorProps<T extends TemplateEvidence> = {
  configuration: Record<string, unknown>;
  evidence: T;
  onChange: (next: T) => void;
};

