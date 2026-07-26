import {
  PREVIEW_ACTOR_IDS,
  SCREEN_IDS,
  type PreviewAction,
  type PreviewActorId,
  type PreviewState,
  type PreviewViewer,
  type ScreenId,
  type VisualMutation
} from "./model";
import { stateForScenario } from "./scenarios";

export type ScreenDefinition = {
  id: ScreenId;
  label: string;
  note: string;
};

export type ActorDefinition = {
  id: PreviewActorId;
  label: string;
  description: string;
  initialScreen: ScreenId;
  screens: ScreenId[];
};

export type TransitionDefinition = {
  from: ScreenId;
  actionId: string;
  to: ScreenId;
  allowedActors: readonly PreviewActorId[];
  destinationActor?: PreviewActorId;
  guard?: (state: PreviewState) => boolean;
  mutation?: VisualMutation;
};

const labels: Partial<Record<ScreenId, [string, string]>> = {
  landing: ["Landing", "The product promise before wallet entry."],
  connect: ["Wallet", "One clear wallet action."],
  discover: ["Discover", "Browse public activity communities."],
  "pod-preview": ["Pod preview", "Understand the group before applying."],
  "visitor-room": ["Visitor room", "Read-only public activity."],
  "public-proof": ["Public proof", "Only explicitly shared evidence."],
  apply: ["Application", "Apply without implying a reserved place."],
  today: ["Today", "The single most important action."],
  "my-pods": ["My Pods", "Every Pod and its next real action."],
  funding: ["Funding", "The current financial state."],
  waiting: ["Waiting room", "Cutoff, roster, and schedule."],
  room: ["Pod room", "Chat-first group activity."],
  commitment: ["Commitment", "Name the work for this occurrence."],
  "proof-type": ["Proof type", "Choose the clearest evidence format."],
  "proof-evidence": ["Evidence", "Separate private and shared evidence."],
  "proof-review": ["Review proof", "Check the submission before review."],
  "submission-review": ["Under review", "The creator is reviewing the proof."],
  "submission-approved": ["Approved", "A concise earned outcome."],
  refund: ["Refund", "Amount, reason, state, and next action."],
  settlement: ["Settlement", "Payout first, detail on demand."],
  updates: ["Updates", "Financial and activity history."],
  members: ["Members", "People and occurrence progress."],
  rules: ["Contract", "The frozen terms."],
  "command-center": ["Command center", "The creator's next urgent action."],
  applications: ["Applications", "Identity and motivation before decision."],
  "creator-funding": ["Funding", "Participant funding and cutoff."],
  "review-queue": ["Review queue", "Oldest proof first."],
  "review-proof": ["Review proof", "Evidence and a clear decision."],
  "creator-settlement": ["Settlement", "Conservation and participant outcomes."],
  "private-profile": ["My profile", "Identity, activity, and privacy."],
  "public-profile": ["Public profile", "Earned identity and milestones."],
  "people-search": ["People search", "Search-led discovery."],
  messages: ["Messages", "Pod rooms and direct conversations."],
  requests: ["Requests", "Explicit Accept and Decline decisions."],
  "direct-message": ["Direct message", "A focused private conversation."],
  "transfer-queue": ["Transfer queue", "Prioritized operational work."],
  "transfer-detail": ["Transfer detail", "State, chain facts, and safe actions."],
  "public-safety": ["Public safety", "Reports with audit context."],
  "profile-identity": ["Identity", "Handle, name, and bio."],
  "profile-avatar": ["Avatar", "Portrait choices and photo upload."],
  "profile-privacy": ["Privacy", "Visibility and contact boundaries."],
  "create-template": ["Template", "Five polished activity contracts."],
  "create-activity": ["Activity", "Purpose, cadence, and schedule."],
  "create-community": ["Community", "Enrollment and visitor policy."],
  "create-commitment": ["NIM commitment", "One clear upfront equation."],
  "create-review": ["Publish review", "Freeze the complete contract."]
};

export const SCREEN_REGISTRY = Object.fromEntries(
  SCREEN_IDS.map((id) => {
    const fallback = id
      .split("-")
      .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
      .join(" ");
    const [label, note] = labels[id] ?? [fallback, "Inspect this visual state."];
    return [id, { id, label, note } satisfies ScreenDefinition];
  })
) as Record<ScreenId, ScreenDefinition>;

export const ACTOR_DEFINITIONS: Record<PreviewActorId, ActorDefinition> = {
  visitor: {
    id: "visitor",
    label: "Visitor",
    description: "Discovery, public rooms, applications, and invitations.",
    initialScreen: "discover",
    screens: [
      "discover",
      "pod-preview",
      "visitor-room",
      "public-proof",
      "apply",
      "invite",
      "invalid-invite"
    ]
  },
  applicant: {
    id: "applicant",
    label: "Applicant",
    description: "Application submission and creator decision tracking.",
    initialScreen: "application",
    screens: [
      "application",
      "application-submitted",
      "application-pending",
      "application-declined",
      "application-expired",
      "application-accepted"
    ]
  },
  "accepted-member": {
    id: "accepted-member",
    label: "Accepted",
    description: "Frozen contract consent and funding.",
    initialScreen: "frozen-contract",
    screens: [
      "frozen-contract",
      "funding-summary",
      "funding-consent",
      "wallet-confirmation",
      "transaction-submitted",
      "chain-observed",
      "funding-finalized",
      "funding-credited"
    ]
  },
  "waiting-member": {
    id: "waiting-member",
    label: "Waiting",
    description: "Credited funding, cutoff, roster lock, or refund.",
    initialScreen: "funding-waiting",
    screens: [
      "funding-waiting",
      "roster-locked",
      "refund-reason",
      "refund-queued",
      "refund-prepared",
      "refund-submitted",
      "refund-confirming",
      "refund-confirmed"
    ]
  },
  participant: {
    id: "participant",
    label: "Participant",
    description: "Activity, proof, room, settlement, and completion.",
    initialScreen: "today",
    screens: [
      "today",
      "my-pods",
      "funding",
      "waiting",
      "room",
      "commitment",
      "proof-type",
      "proof-evidence",
      "proof-review",
      "submission-review",
      "submission-approved",
      "refund",
      "settlement",
      "updates",
      "members",
      "rules",
      "creator-reviewing",
      "proof-approved",
      "proof-rejected",
      "proof-timeout-protected",
      "proof-missed",
      "final-review",
      "settlement-calculated",
      "payout-queued",
      "payout-prepared",
      "payout-submitted",
      "payout-confirming",
      "payout-paid",
      "completed-archive"
    ]
  },
  creator: {
    id: "creator",
    label: "Creator",
    description: "Enrollment, proof decisions, and settlement.",
    initialScreen: "command-center",
    screens: [
      "command-center",
      "applications",
      "creator-funding",
      "review-queue",
      "review-proof",
      "creator-settlement",
      "application-detail",
      "creator-roster",
      "creator-final-review",
      "settlement-calculating",
      "payouts-processing",
      "operations-blocked",
      "archive-controls"
    ]
  },
  social: {
    id: "social",
    label: "Social",
    description: "Profiles, people, requests, and messages.",
    initialScreen: "private-profile",
    screens: [
      "private-profile",
      "public-profile",
      "people-search",
      "messages",
      "requests",
      "direct-message",
      "edit-profile"
    ]
  },
  operations: {
    id: "operations",
    label: "Operations",
    description: "Transfer recovery and public safety.",
    initialScreen: "transfer-queue",
    screens: [
      "transfer-queue",
      "transfer-detail",
      "public-safety",
      "chain-lookup",
      "transfer-confirmed",
      "transfer-retryable",
      "transfer-mismatched",
      "transfer-late",
      "transfer-manual-review",
      "replacement-attempt"
    ]
  },
  onboarding: {
    id: "onboarding",
    label: "Onboarding",
    description: "Wallet entry, profile setup, and Pod creation.",
    initialScreen: "landing",
    screens: [
      "landing",
      "connect",
      "profile-identity",
      "profile-avatar",
      "profile-privacy",
      "create-template",
      "create-activity",
      "create-community",
      "create-commitment",
      "create-review"
    ]
  }
};

function transition(
  from: ScreenId,
  actionId: string,
  to: ScreenId,
  allowedActors: readonly PreviewActorId[],
  destinationActor?: PreviewActorId
): TransitionDefinition {
  return {
    from,
    actionId,
    to,
    allowedActors,
    ...(destinationActor ? { destinationActor } : {})
  };
}

export const TRANSITION_REGISTRY: readonly TransitionDefinition[] = [
  transition("landing", "browse", "discover", ["onboarding", "visitor"]),
  transition("landing", "connect-wallet", "connect", ["onboarding"]),
  transition("connect", "signature-started", "signature-waiting", ["onboarding"]),
  transition("signature-waiting", "signature-complete", "profile-identity", ["onboarding"]),
  transition("signature-waiting", "signature-failed", "signature-error", ["onboarding"]),
  transition("signature-error", "retry", "connect", ["onboarding"]),
  transition("profile-identity", "continue", "profile-avatar", ["onboarding"]),
  transition("profile-avatar", "upload-photo", "photo-source", ["onboarding"]),
  transition("profile-avatar", "continue", "profile-privacy", ["onboarding"]),
  transition("photo-source", "continue", "photo-crop", ["onboarding"]),
  transition("photo-crop", "continue", "profile-privacy", ["onboarding"]),
  transition("profile-privacy", "complete", "setup-complete", ["onboarding"]),
  transition("setup-complete", "enter", "today", ["onboarding"], "participant"),
  transition("discover", "open-pod", "pod-preview", ["visitor", "participant"]),
  transition("pod-preview", "watch", "visitor-room", ["visitor", "participant"]),
  transition("visitor-room", "open-proof", "public-proof", ["visitor", "participant"]),
  transition("pod-preview", "apply", "apply", ["visitor"]),
  transition("apply", "submit", "application-submitted", ["visitor", "applicant"]),
  transition("application", "submit", "application-submitted", ["applicant"]),
  transition("application-submitted", "track", "application-pending", ["applicant"]),
  transition("application-pending", "accepted", "application-accepted", ["applicant"]),
  transition("application-pending", "declined", "application-declined", ["applicant"]),
  transition("application-pending", "expired", "application-expired", ["applicant"]),
  transition(
    "application-accepted",
    "review-contract",
    "frozen-contract",
    ["applicant", "accepted-member"],
    "accepted-member"
  ),
  transition("frozen-contract", "accept-contract", "funding-summary", ["accepted-member"]),
  transition("funding-summary", "continue", "funding-consent", ["accepted-member"]),
  transition("funding-consent", "confirm", "wallet-confirmation", ["accepted-member"]),
  transition("wallet-confirmation", "submitted", "transaction-submitted", ["accepted-member"]),
  transition("transaction-submitted", "observed", "chain-observed", ["accepted-member"]),
  transition("chain-observed", "finalized", "funding-finalized", ["accepted-member"]),
  transition("funding-finalized", "credited", "funding-credited", ["accepted-member"]),
  transition(
    "funding-credited",
    "wait-cutoff",
    "funding-waiting",
    ["accepted-member", "waiting-member"],
    "waiting-member"
  ),
  transition("funding-waiting", "cutoff-locked", "roster-locked", ["waiting-member"]),
  transition(
    "roster-locked",
    "enter-room",
    "pod-room",
    ["waiting-member", "participant"],
    "participant"
  ),
  transition("today", "start-commitment", "commitment", ["participant"]),
  transition("commitment", "continue", "proof-type", ["participant"]),
  transition("proof-type", "continue", "proof-evidence", ["participant"]),
  transition("proof-evidence", "review", "proof-review", ["participant"]),
  transition("proof-review", "submit", "submission-review", ["participant"]),
  transition("submission-review", "track", "creator-reviewing", ["participant"]),
  transition("review-proof", "approve", "proof-approved", ["creator"]),
  transition("review-proof", "reject", "proof-rejected", ["creator"]),
  transition("final-review", "view-settlement", "settlement-calculated", ["participant"]),
  transition("settlement-calculated", "track-payout", "payout-queued", ["participant"]),
  transition("payout-queued", "prepared", "payout-prepared", ["participant"]),
  transition("payout-prepared", "submitted", "payout-submitted", ["participant"]),
  transition("payout-submitted", "confirming", "payout-confirming", ["participant"]),
  transition("payout-confirming", "confirmed", "payout-paid", ["participant"]),
  transition("payout-paid", "open-archive", "completed-archive", ["participant"]),
  transition("private-profile", "find-people", "people-search", ["social"]),
  transition("people-search", "open-person", "public-profile", ["social"]),
  transition("public-profile", "message", "direct-message", ["social"]),
  transition("messages", "open-message", "direct-message", ["social"]),
  transition("applications", "open-application", "application-detail", ["creator"]),
  transition("review-queue", "open-submission", "review-proof", ["creator"]),
  transition("refund-reason", "queue", "refund-queued", ["waiting-member", "participant"]),
  transition("refund-queued", "prepared", "refund-prepared", ["waiting-member", "participant"]),
  transition("refund-prepared", "submitted", "refund-submitted", ["waiting-member", "participant"]),
  transition("refund-submitted", "confirming", "refund-confirming", ["waiting-member", "participant"]),
  transition("refund-confirming", "confirmed", "refund-confirmed", ["waiting-member", "participant"]),
  transition("create-template", "continue", "create-activity", ["onboarding", "creator"]),
  transition("create-activity", "continue", "create-community", ["onboarding", "creator"]),
  transition("create-community", "continue", "create-commitment", ["onboarding", "creator"]),
  transition("create-commitment", "continue", "create-review", ["onboarding", "creator"]),
  transition("create-review", "publish", "publishing", ["onboarding", "creator"]),
  transition("publishing", "published", "published-success", ["onboarding", "creator"]),
  transition("published-success", "open-command", "creator-command-center", ["onboarding", "creator"]),
  transition("transfer-queue", "open-transfer", "transfer-detail", ["operations"]),
  transition("transfer-detail", "lookup", "chain-lookup", ["operations"]),
  transition("chain-lookup", "confirmed", "transfer-confirmed", ["operations"]),
  transition("chain-lookup", "retryable", "transfer-retryable", ["operations"]),
  transition("chain-lookup", "mismatch", "transfer-mismatched", ["operations"]),
  transition("chain-lookup", "late", "transfer-late", ["operations"]),
  transition("chain-lookup", "manual", "transfer-manual-review", ["operations"]),
  transition("transfer-retryable", "replace", "replacement-attempt", ["operations"])
];

const defaultViewer: PreviewViewer = {
  id: "viewer-preview",
  displayName: "Ryuk",
  handle: "ryuk"
};

export function createInitialPreviewState(
  viewer: PreviewViewer = defaultViewer
): PreviewState {
  return {
    viewer,
    actor: "visitor",
    screen: ACTOR_DEFINITIONS.visitor.initialScreen,
    scenario: "happy-path",
    selected: {},
    visual: {
      consentAccepted: false,
      selectedTemplate: "build",
      publicPod: true,
      visitorsAllowed: true,
      proofVisibility: "creator-only"
    }
  };
}

export function getAvailableTransitions(
  state: PreviewState
): readonly TransitionDefinition[] {
  return TRANSITION_REGISTRY.filter(
    (candidate) =>
      candidate.from === state.screen &&
      candidate.allowedActors.includes(state.actor) &&
      (candidate.guard?.(state) ?? true)
  );
}

function applyVisualMutation(
  state: PreviewState,
  mutation: VisualMutation
): PreviewState {
  switch (mutation.kind) {
    case "set-consent":
      return {
        ...state,
        visual: { ...state.visual, consentAccepted: mutation.value }
      };
    case "select-template":
      return {
        ...state,
        visual: { ...state.visual, selectedTemplate: mutation.value }
      };
    case "set-public-pod":
      return {
        ...state,
        visual: {
          ...state.visual,
          publicPod: mutation.value,
          visitorsAllowed: mutation.value ? state.visual.visitorsAllowed : false
        }
      };
    case "set-visitors":
      return {
        ...state,
        visual: {
          ...state.visual,
          visitorsAllowed: state.visual.publicPod ? mutation.value : false
        }
      };
    case "set-proof-visibility":
      return {
        ...state,
        visual: { ...state.visual, proofVisibility: mutation.value }
      };
  }
}

export function dispatchPreviewAction(
  state: PreviewState,
  action: PreviewAction
): PreviewState {
  switch (action.type) {
    case "switch-actor": {
      const actor = ACTOR_DEFINITIONS[action.actor];
      return { ...state, actor: actor.id, screen: actor.initialScreen };
    }
    case "open-screen":
      return SCREEN_REGISTRY[action.screen]
        ? { ...state, screen: action.screen }
        : state;
    case "run-transition": {
      const transition = getAvailableTransitions(state).find(
        (candidate) => candidate.actionId === action.actionId
      );
      if (!transition) return state;
      const next = {
        ...state,
        screen: transition.to,
        actor: transition.destinationActor ?? state.actor
      };
      return transition.mutation
        ? applyVisualMutation(next, transition.mutation)
        : next;
    }
    case "set-scenario":
      return stateForScenario(state, action.scenario);
    case "select-entities":
      return {
        ...state,
        selected: { ...state.selected, ...action.selected }
      };
    case "mutate-visual":
      return applyVisualMutation(state, action.mutation);
  }
}

export function findTransitionTo(
  state: PreviewState,
  destination: ScreenId
): TransitionDefinition | undefined {
  return getAvailableTransitions(state).find(
    (candidate) => candidate.to === destination
  );
}

if (Object.keys(ACTOR_DEFINITIONS).length !== PREVIEW_ACTOR_IDS.length) {
  throw new Error("Every preview actor must have a definition.");
}
