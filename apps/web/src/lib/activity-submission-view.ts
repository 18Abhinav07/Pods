import type {
  ProofShareMode,
  SubmissionState,
  TemplateEvidence
} from "@pods/domain";

import type { ActivitySubmissionView } from "../components/activity-editor/types";

type SubmissionProjectionInput = {
  id: string;
  state: SubmissionState;
  resultSummary?: string | null;
  artifactUrl?: string | null;
  templateEvidence?: TemplateEvidence | null;
  evidenceObjectKey?: string | null;
  proofShareMode?: ProofShareMode | null;
};

export function toActivitySubmissionView(
  submission: SubmissionProjectionInput
): ActivitySubmissionView {
  return {
    id: submission.id,
    state: submission.state,
    resultSummary: submission.resultSummary ?? "",
    artifactUrl: submission.artifactUrl ?? "",
    templateEvidence: submission.templateEvidence ?? null,
    evidenceAvailable: Boolean(submission.evidenceObjectKey),
    proofShareMode: submission.proofShareMode ?? "reviewer_only"
  };
}
