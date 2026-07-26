"use client";

import { useMemo, useReducer } from "react";

import {
  LegacyScreenRenderer,
  type LegacyScreenId
} from "./legacy-screen-renderer";
import type {
  NativeMomentumPreviewData,
  PreviewActorId,
  SelectedEntities,
  ScreenId
} from "./model";
import {
  ACTOR_DEFINITIONS,
  createInitialPreviewState,
  dispatchPreviewAction,
  findTransitionTo,
  SCREEN_REGISTRY
} from "./registry";
import { PrototypeShell } from "./prototype-shell";

export type {
  NativeMomentumPreviewData,
  NativeMomentumPreviewPerson,
  NativeMomentumPreviewPod,
  NativeMomentumRoomEntry
} from "./model";

const LEGACY_SCREEN_IDS = new Set<LegacyScreenId>([
  "discover",
  "pod-preview",
  "visitor-room",
  "public-proof",
  "apply",
  "invite",
  "invalid-invite",
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
  "command-center",
  "applications",
  "creator-funding",
  "review-queue",
  "review-proof",
  "creator-settlement",
  "private-profile",
  "public-profile",
  "people-search",
  "messages",
  "requests",
  "direct-message",
  "transfer-queue",
  "transfer-detail",
  "public-safety",
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
]);

const LEGACY_FALLBACKS: Partial<Record<ScreenId, LegacyScreenId>> = {
  "signature-waiting": "connect",
  "signature-error": "connect",
  "photo-source": "profile-avatar",
  "photo-crop": "profile-avatar",
  "setup-complete": "profile-privacy",
  "public-pod-details": "pod-preview",
  application: "apply",
  "application-submitted": "apply",
  "application-pending": "apply",
  "application-declined": "apply",
  "application-expired": "apply",
  "application-accepted": "apply",
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
  "pod-room": "room",
  "creator-reviewing": "submission-review",
  "proof-approved": "submission-approved",
  "proof-rejected": "submission-review",
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
  "creator-command-center": "command-center",
  "application-detail": "applications",
  "creator-roster": "creator-funding",
  "creator-final-review": "creator-settlement",
  "settlement-calculating": "creator-settlement",
  "payouts-processing": "creator-settlement",
  "operations-blocked": "creator-settlement",
  "archive-controls": "creator-settlement",
  "edit-profile": "private-profile",
  "chain-lookup": "transfer-detail",
  "transfer-confirmed": "transfer-detail",
  "transfer-retryable": "transfer-detail",
  "transfer-mismatched": "transfer-detail",
  "transfer-late": "transfer-detail",
  "transfer-manual-review": "transfer-detail",
  "replacement-attempt": "transfer-detail",
  publishing: "create-review",
  "published-success": "create-review"
};

function legacyScreen(screen: ScreenId): LegacyScreenId {
  if (LEGACY_SCREEN_IDS.has(screen as LegacyScreenId)) {
    return screen as LegacyScreenId;
  }
  return LEGACY_FALLBACKS[screen] ?? "discover";
}

export function NativeMomentumPrototype({
  data
}: {
  data: NativeMomentumPreviewData;
}) {
  const [state, dispatch] = useReducer(
    dispatchPreviewAction,
    undefined,
    () =>
      ({
        ...createInitialPreviewState({
        id: `preview-${data.viewer.handle}`,
        displayName: data.viewer.displayName,
        handle: data.viewer.handle
        }),
        selected: {
          ...(data.pods[0] ? { podId: data.pods[0].id } : {}),
          ...(data.people[0] ? { personHandle: data.people[0].handle } : {})
        }
      })
  );

  const activeActor = ACTOR_DEFINITIONS[state.actor];
  const activeScreen = useMemo(
    () =>
      activeActor.screens.includes(state.screen)
        ? state.screen
        : activeActor.initialScreen,
    [activeActor, state.screen]
  );

  function selectActor(actor: PreviewActorId) {
    dispatch({ type: "switch-actor", actor });
  }

  function selectScreen(screen: ScreenId) {
    if (!SCREEN_REGISTRY[screen]) return;
    dispatch({ type: "open-screen", screen });
  }

  function navigateFromScreen(
    nextScreen: LegacyScreenId,
    _actor?: unknown,
    selected?: Partial<SelectedEntities>
  ) {
    const destination = nextScreen as ScreenId;
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
      data={data}
      onActorChange={selectActor}
      onScenarioChange={(scenario) =>
        dispatch({ type: "set-scenario", scenario })
      }
      onScreenChange={selectScreen}
      scenario={state.scenario}
      screen={activeScreen}
    >
      <LegacyScreenRenderer
        data={data}
        navigate={navigateFromScreen}
        scenario={state.scenario}
        screen={legacyScreen(activeScreen)}
        selected={state.selected}
      />
    </PrototypeShell>
  );
}
