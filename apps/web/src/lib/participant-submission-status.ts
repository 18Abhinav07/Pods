import type {
  ProfileAvatar,
  ProofShareMode,
  SubmissionState
} from "@pods/domain";

export type ParticipantSubmissionCreator = {
  handle: string;
  displayName: string;
  avatar: ProfileAvatar;
};

export type ParticipantSubmissionStatusDto = {
  state: SubmissionState;
  proofShareMode: ProofShareMode;
  submittedAt: string | null;
  reviewTargetAt: string | null;
  reviewHardDeadlineAt: string | null;
  reviewDecisionNote: string | null;
  creator: ParticipantSubmissionCreator | null;
};

type DateInput = string | Date | null | undefined;

function isoMoment(value: DateInput) {
  return value ? new Date(value).toISOString() : null;
}

export function participantSubmissionStatusDto(input: {
  submission: {
    state: SubmissionState;
    proofShareMode?: ProofShareMode | null;
    submittedAt?: DateInput;
    reviewTargetAt?: DateInput;
    reviewHardDeadlineAt?: DateInput;
  };
  reviewDecision?: { note?: string | null } | null;
  creator?: ParticipantSubmissionCreator | null;
}): ParticipantSubmissionStatusDto {
  return {
    state: input.submission.state,
    proofShareMode: input.submission.proofShareMode ?? "reviewer_only",
    submittedAt: isoMoment(input.submission.submittedAt),
    reviewTargetAt: isoMoment(input.submission.reviewTargetAt),
    reviewHardDeadlineAt: isoMoment(
      input.submission.reviewHardDeadlineAt
    ),
    reviewDecisionNote: input.reviewDecision?.note ?? null,
    creator: input.creator ?? null
  };
}

const submissionPresentations = {
  draft: {
    eyebrow: "Unsent proof",
    heading: "Proof draft",
    detail: "This proof has not been sent to the Pod creator yet."
  },
  reviewing: {
    eyebrow: "Creator review",
    heading: "Creator review in progress",
    detail: "The Pod creator is checking your proof against the locked commitment."
  },
  approved: {
    eyebrow: "Review complete",
    heading: "Work approved",
    detail: "The Pod creator approved this proof. It counts toward your progress and streak."
  },
  rejected: {
    eyebrow: "Review complete",
    heading: "Not verified",
    detail: "The Pod creator did not verify this proof against the locked commitment."
  },
  timeout_protected: {
    eyebrow: "Review protection",
    heading: "Protected after review timeout",
    detail: "The creator did not decide within 24 hours. This occurrence counts toward your progress and streak."
  }
} satisfies Record<SubmissionState, {
  eyebrow: string;
  heading: string;
  detail: string;
}>;

export function participantSubmissionPresentation(state: SubmissionState) {
  return submissionPresentations[state];
}

const proofAudiencePresentations = {
  reviewer_only: {
    label: "Creator only",
    detail: "Your proof is private between you and the Pod creator."
  },
  pod_shared: {
    label: "Pod members",
    detail: "The Pod-safe proof layer is visible to locked members."
  },
  public: {
    label: "Public Pod room",
    detail: "The shared proof layer is visible to public visitors."
  }
} satisfies Record<ProofShareMode, { label: string; detail: string }>;

export function proofAudiencePresentation(mode: ProofShareMode) {
  return proofAudiencePresentations[mode];
}
