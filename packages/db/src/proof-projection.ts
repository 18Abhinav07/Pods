import type {
  ProofShareMode,
  TemplateEvidence
} from "@pods/domain";

export type ProofAudience =
  | "owner"
  | "creator"
  | "member"
  | "visitor"
  | "other";

export function projectProofForAudience(input: {
  audience: ProofAudience;
  shareMode: ProofShareMode;
  templateEvidence: TemplateEvidence | null;
  resultSummary: string;
  artifactUrl: string;
  hasAttachment: boolean;
}) {
  const authorized =
    input.audience === "owner" ||
    input.audience === "creator" ||
    (
      input.audience === "member" &&
      (input.shareMode === "pod_shared" || input.shareMode === "public")
    ) ||
    (input.audience === "visitor" && input.shareMode === "public");

  if (!authorized) {
    return {
      templateEvidence: null,
      resultSummary: null,
      artifactUrl: null,
      attachmentAvailable: false
    };
  }

  return {
    templateEvidence: input.templateEvidence,
    resultSummary: input.resultSummary,
    artifactUrl: safeHttpsUrl(input.artifactUrl),
    attachmentAvailable: input.hasAttachment
  };
}

function safeHttpsUrl(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
