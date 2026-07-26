export const PREVIEW_ACTOR_IDS = [
  "visitor",
  "applicant",
  "accepted-member",
  "waiting-member",
  "participant",
  "creator",
  "social",
  "operations",
  "onboarding"
] as const;

export type PreviewActorId = (typeof PREVIEW_ACTOR_IDS)[number];

export const POD_LIFECYCLE = [
  "draft",
  "enrollment_open",
  "funding",
  "waiting",
  "active",
  "final_review",
  "completed",
  "cancelled"
] as const;

export type PodLifecycle = (typeof POD_LIFECYCLE)[number];

export const ACTIVITY_OUTCOMES = [
  "approved",
  "rejected",
  "timeout_protected",
  "missed"
] as const;

export type ActivityOutcome = (typeof ACTIVITY_OUTCOMES)[number];

export type TransferState =
  | "queued"
  | "prepared"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "unknown"
  | "delayed"
  | "retryable_failed"
  | "mismatched"
  | "late"
  | "manual_review"
  | "no_transfer_required";

export const SCREEN_IDS = [
  "landing",
  "connect",
  "signature-waiting",
  "signature-error",
  "profile-identity",
  "profile-avatar",
  "photo-source",
  "photo-crop",
  "profile-privacy",
  "setup-complete",
  "discover",
  "pod-preview",
  "public-pod-details",
  "visitor-room",
  "public-proof",
  "apply",
  "application",
  "application-submitted",
  "application-pending",
  "application-declined",
  "application-expired",
  "application-accepted",
  "invite",
  "invalid-invite",
  "frozen-contract",
  "funding",
  "funding-summary",
  "funding-consent",
  "wallet-confirmation",
  "transaction-submitted",
  "chain-observed",
  "funding-finalized",
  "funding-credited",
  "funding-waiting",
  "roster-locked",
  "waiting",
  "refund",
  "refund-reason",
  "refund-queued",
  "refund-prepared",
  "refund-submitted",
  "refund-confirming",
  "refund-confirmed",
  "today",
  "my-pods",
  "room",
  "pod-room",
  "commitment",
  "proof-type",
  "proof-evidence",
  "proof-review",
  "submission-review",
  "creator-reviewing",
  "proof-approved",
  "proof-rejected",
  "proof-timeout-protected",
  "proof-missed",
  "submission-approved",
  "final-review",
  "settlement-calculated",
  "payout-queued",
  "payout-prepared",
  "payout-submitted",
  "payout-confirming",
  "payout-paid",
  "completed-archive",
  "settlement",
  "updates",
  "members",
  "rules",
  "command-center",
  "creator-command-center",
  "applications",
  "application-detail",
  "creator-funding",
  "creator-roster",
  "review-queue",
  "review-proof",
  "creator-final-review",
  "creator-settlement",
  "settlement-calculating",
  "payouts-processing",
  "operations-blocked",
  "archive-controls",
  "private-profile",
  "edit-profile",
  "public-profile",
  "people-search",
  "messages",
  "requests",
  "direct-message",
  "transfer-queue",
  "transfer-detail",
  "chain-lookup",
  "transfer-confirmed",
  "transfer-retryable",
  "transfer-mismatched",
  "transfer-late",
  "transfer-manual-review",
  "replacement-attempt",
  "public-safety",
  "create-template",
  "create-activity",
  "create-community",
  "create-commitment",
  "create-review",
  "publishing",
  "published-success"
] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];

export type ScenarioId =
  | "happy-path"
  | "loading"
  | "empty"
  | "error"
  | "wallet-rejected"
  | "wrong-network"
  | "reference-mismatch"
  | "capacity-excluded"
  | "below-minimum"
  | "zero-recipient-restoration"
  | "no-transfer-required"
  | "transfer-delayed"
  | "manual-review";

export type SelectedEntities = {
  podId?: string;
  personHandle?: string;
  applicationId?: string;
  occurrenceId?: string;
  submissionId?: string;
  conversationId?: string;
  transferId?: string;
};

export type PreviewViewer = {
  id: string;
  displayName: string;
  handle: string;
};

export type PreviewVisualState = {
  consentAccepted: boolean;
  selectedTemplate: "build" | "create" | "fitness" | "reading" | "study";
  publicPod: boolean;
  visitorsAllowed: boolean;
  proofVisibility: "creator-only" | "shared-with-pod";
};

export type PreviewState = {
  viewer: PreviewViewer;
  actor: PreviewActorId;
  screen: ScreenId;
  scenario: ScenarioId;
  selected: SelectedEntities;
  visual: PreviewVisualState;
};

export type VisualMutation =
  | { kind: "set-consent"; value: boolean }
  | {
      kind: "select-template";
      value: PreviewVisualState["selectedTemplate"];
    }
  | { kind: "set-public-pod"; value: boolean }
  | { kind: "set-visitors"; value: boolean }
  | {
      kind: "set-proof-visibility";
      value: PreviewVisualState["proofVisibility"];
    };

export type PreviewAction =
  | { type: "switch-actor"; actor: PreviewActorId }
  | { type: "open-screen"; screen: ScreenId }
  | { type: "run-transition"; actionId: string }
  | { type: "set-scenario"; scenario: ScenarioId }
  | { type: "select-entities"; selected: Partial<SelectedEntities> }
  | { type: "mutate-visual"; mutation: VisualMutation };

export type NativeMomentumPreviewPod = {
  id: string;
  name: string;
  purpose: string;
  templateId: "build" | "create" | "fitness" | "reading" | "study";
  state: string;
  stage: "open" | "live" | "recent";
  totalNim: number;
  occurrenceCount: number;
  minParticipants: number;
  maxParticipants: number;
  visibility: "public" | "private";
  visitorsAllowed: boolean;
};

export type NativeMomentumPreviewPerson = {
  displayName: string;
  handle: string;
  avatarSeed: string;
  bio: string;
};

export type NativeMomentumRoomEntry = {
  id: string;
  kind: "message" | "activity" | "announcement" | "system";
  author: string;
  handle: string;
  body: string;
  result?: string;
  status?: "locked" | "reviewing" | "approved" | "rejected" | "protected";
  time: string;
  artifactLabel?: string;
};

export type NativeMomentumPreviewData = {
  databaseStatus: "connected" | "fallback";
  generatedAt: string;
  viewer: {
    displayName: string;
    handle: string;
    avatarSeed: string;
  };
  pods: NativeMomentumPreviewPod[];
  people: NativeMomentumPreviewPerson[];
  roomEntries: NativeMomentumRoomEntry[];
  finance: {
    commitmentNim: number;
    returnedNim: number;
    payoutNim: number;
    bonusNim: number;
    transactionHash: string;
  };
};
