"use client";

import { useReducer } from "react";

import {
  LegacyScreenRenderer,
  type LegacyProductDestination,
  type LegacyScreenId
} from "./legacy-screen-renderer";
import {
  PREVIEW_FIXTURE_PROFILE,
  type NativeMomentumPreviewData,
  type PreviewActorId,
  type SelectedEntities,
  type ScreenId
} from "./model";
import {
  createInitialPreviewState,
  dispatchPreviewAction,
  findTransitionTo,
  getAvailableTransitions,
  SCREEN_REGISTRY
} from "./registry";
import { PrototypeShell } from "./prototype-shell";

export type {
  NativeMomentumPreviewData,
  NativeMomentumPreviewPerson,
  NativeMomentumPreviewPod,
  NativeMomentumRoomEntry
} from "./model";

export const CANONICAL_TO_LEGACY_SCREEN = {
  landing: "landing",
  connect: "connect",
  "signature-waiting": "signature-waiting",
  "signature-error": "connect",
  "profile-identity": "profile-identity",
  "profile-avatar": "profile-avatar",
  "photo-source": "profile-avatar",
  "photo-crop": "profile-avatar",
  "profile-privacy": "profile-privacy",
  "setup-complete": "setup-complete",
  discover: "discover",
  "public-pod-details": "pod-preview",
  "visitor-room": "visitor-room",
  "public-proof": "public-proof",
  application: "apply",
  "application-submitted": "apply",
  "application-pending": "apply",
  "application-declined": "apply",
  "application-expired": "apply",
  "application-accepted": "apply",
  invite: "invite",
  "invalid-invite": "invalid-invite",
  "frozen-contract": "rules",
  "funding-summary": "funding",
  "funding-consent": "funding",
  "wallet-confirmation": "funding",
  "transaction-submitted": "funding",
  "chain-observed": "funding",
  "funding-finalized": "funding",
  "funding-credited": "funding",
  "funding-waiting": "waiting",
  "roster-locked": "waiting",
  "refund-reason": "refund",
  "refund-queued": "refund",
  "refund-prepared": "refund",
  "refund-submitted": "refund",
  "refund-confirming": "refund",
  "refund-confirmed": "refund",
  today: "today",
  "my-pods": "my-pods",
  "pod-room": "room",
  commitment: "commitment",
  "proof-type": "proof-type",
  "proof-evidence": "proof-evidence",
  "proof-review": "proof-review",
  "submission-review": "submission-review",
  "creator-reviewing": "submission-review",
  "proof-approved": "proof-approved",
  "proof-rejected": "proof-rejected",
  "proof-timeout-protected": "submission-review",
  "proof-missed": "submission-review",
  "final-review": "settlement",
  "settlement-calculated": "settlement",
  "payout-queued": "settlement",
  "payout-prepared": "settlement",
  "payout-submitted": "settlement",
  "payout-confirming": "settlement",
  "payout-paid": "settlement",
  "completed-archive": "settlement",
  updates: "updates",
  members: "members",
  rules: "rules",
  "creator-command-center": "command-center",
  applications: "applications",
  "application-detail": "application-detail",
  "creator-roster": "creator-funding",
  "review-queue": "review-queue",
  "review-proof": "review-proof",
  "creator-final-review": "creator-settlement",
  "settlement-calculating": "creator-settlement",
  "payouts-processing": "creator-settlement",
  "operations-blocked": "creator-settlement",
  "archive-controls": "creator-settlement",
  "private-profile": "private-profile",
  "edit-profile": "private-profile",
  "public-profile": "public-profile",
  "people-search": "people-search",
  messages: "messages",
  requests: "requests",
  "direct-message": "direct-message",
  "transfer-queue": "transfer-queue",
  "transfer-detail": "transfer-detail",
  "chain-lookup": "transfer-detail",
  "transfer-confirmed": "transfer-detail",
  "transfer-retryable": "transfer-detail",
  "transfer-mismatched": "transfer-detail",
  "transfer-late": "transfer-detail",
  "transfer-manual-review": "transfer-detail",
  "replacement-attempt": "transfer-detail",
  "public-safety": "public-safety",
  "create-template": "create-template",
  "create-activity": "create-activity",
  "create-community": "create-community",
  "create-commitment": "create-commitment",
  "create-review": "create-review",
  publishing: "create-review",
  "published-success": "create-review"
} satisfies Record<ScreenId, LegacyScreenId>;

const LEGACY_TO_CANONICAL: Partial<
  Record<LegacyProductDestination, ScreenId>
> = {
  "pod-preview": "public-pod-details",
  apply: "application",
  funding: "funding-summary",
  waiting: "funding-waiting",
  room: "pod-room",
  "submission-approved": "proof-approved",
  refund: "refund-reason",
  settlement: "settlement-calculated",
  "command-center": "creator-command-center",
  "creator-funding": "creator-roster",
  "creator-settlement": "creator-final-review"
};

function legacyScreen(screen: ScreenId): LegacyScreenId {
  return CANONICAL_TO_LEGACY_SCREEN[screen];
}

function canonicalScreen(
  screen: LegacyProductDestination
): ScreenId | undefined {
  const mapped = LEGACY_TO_CANONICAL[screen];
  if (mapped) return mapped;
  return screen in SCREEN_REGISTRY ? (screen as ScreenId) : undefined;
}

export function NativeMomentumPrototype({
  data
}: {
  data: NativeMomentumPreviewData;
}) {
  const previewData: NativeMomentumPreviewData = {
    ...data,
    viewer: {
      displayName: PREVIEW_FIXTURE_PROFILE.displayName,
      handle: PREVIEW_FIXTURE_PROFILE.handle,
      avatarSeed: PREVIEW_FIXTURE_PROFILE.avatarSeed
    }
  };
  const [state, dispatch] = useReducer(
    dispatchPreviewAction,
    undefined,
    () =>
      ({
        ...createInitialPreviewState({
        id: PREVIEW_FIXTURE_PROFILE.id,
        displayName: PREVIEW_FIXTURE_PROFILE.displayName,
        handle: PREVIEW_FIXTURE_PROFILE.handle
        }),
        selected: {
          ...(previewData.pods[0] ? { podId: previewData.pods[0].id } : {}),
          ...(previewData.people[0]
            ? { personHandle: previewData.people[0].handle }
            : {})
        }
      })
  );

  const activeScreen = state.screen;

  function selectActor(actor: PreviewActorId) {
    dispatch({ type: "switch-actor", actor });
  }

  function selectScreen(screen: ScreenId) {
    if (!SCREEN_REGISTRY[screen]) return;
    dispatch({ type: "open-screen", screen });
  }

  function navigateFromScreen(
    nextScreen: LegacyProductDestination,
    selected?: Partial<SelectedEntities>
  ) {
    const destination = canonicalScreen(nextScreen);
    if (!destination) {
      throw new Error(`No canonical product destination exists for ${nextScreen}.`);
    }
    if (selected) {
      dispatch({ type: "select-entities", selected });
    }
    const transition = findTransitionTo(state, destination);
    if (transition) {
      dispatch({ type: "run-transition", actionId: transition.actionId });
    }
  }

  return (
    <PrototypeShell
      actor={state.actor}
      data={previewData}
      onActorChange={selectActor}
      onScenarioChange={(scenario) =>
        dispatch({ type: "set-scenario", scenario })
      }
      onScreenChange={selectScreen}
      onTransition={(actionId) =>
        dispatch({ type: "run-transition", actionId })
      }
      scenario={state.scenario}
      screen={activeScreen}
      transitions={getAvailableTransitions(state)}
    >
      <LegacyScreenRenderer
        data={previewData}
        navigate={navigateFromScreen}
        scenario={state.scenario}
        screen={legacyScreen(activeScreen)}
        selected={state.selected}
      />
    </PrototypeShell>
  );
}
