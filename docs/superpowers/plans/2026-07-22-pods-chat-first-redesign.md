---
created: 2026-07-22
project: pods
ecosystem: nimiq
tags: [implementation-plan, mobile-ux, chat-first, tdd]
---

# Pods Chat-First Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved Phase 4 social build into a coherent chat-first mobile experience without changing its financial, verification, or privacy authority.

**Architecture:** Existing routes and repository contracts remain intact. Presentation logic gains explicit room destinations and settlement-aware copy, while the authenticated Pod home becomes a compact room shell with progressive disclosure. Messaging and proof controls are refactored inside their current components, with no schema migration or new external dependency.

**Tech Stack:** Next.js App Router, React 19, TypeScript, vanilla CSS, Motion, Vitest, Testing Library, Playwright, Postgres, Nimiq Testnet.

---

### Task 1: Freeze the approved redesign contract

**Files:**
- Create: `docs/superpowers/specs/2026-07-22-pods-chat-first-redesign.md`
- Create: `docs/superpowers/plans/2026-07-22-pods-chat-first-redesign.md`

- [x] Record the approved route ownership, Pod room, proof, chat, identity, and financial-language rules.
- [x] Confirm there are no placeholders, new financial states, or new external services.

### Task 2: Correct financial copy and Pod destinations

**Files:**
- Modify: `apps/web/tests/activity-occurrence.test.tsx`
- Modify: `apps/web/tests/public-pods.test.tsx`
- Modify: `apps/web/tests/today-page.test.tsx`
- Modify: `apps/web/src/components/activity-occurrence.tsx`
- Modify: `apps/web/src/app/pods/[podId]/activity/[occurrenceId]/page.tsx`
- Modify: `apps/web/src/lib/participant-pod-state.ts`

- [x] Add a failing test that expects Activity slice and full-return text for `full_refund_alpha`.
- [x] Add a failing test that expects visitor cards to expose Apply as the single primary intent.
- [x] Add a failing test that expects roster-locked and active relationships to route to `/room`.
- [x] Run `pnpm --filter @pods/web test -- activity-occurrence.test.tsx public-pods.test.tsx today-page.test.tsx` and confirm expected assertion failures.
- [x] Pass `settlementMode` into `ActivityOccurrence` and centralize consequence presentation.
- [x] Add a `pod_room` relationship destination for roster-locked and active participants and creators.
- [x] Run the focused tests and confirm PASS.

### Task 3: Distill the global shell and route ownership

**Files:**
- Modify: `apps/web/tests/design-system-contract.test.ts`
- Modify: `apps/web/tests/public-pods.test.tsx`
- Modify: `apps/web/src/components/app-header.tsx`
- Modify: `apps/web/src/components/public-pod-card.tsx`
- Modify: `apps/web/src/components/primary-nav.tsx`
- Modify: `apps/web/src/app/discover/page.tsx`
- Modify: `apps/web/src/app/my-pods/page.tsx`
- Modify: `apps/web/src/app/messages/page.tsx`
- Modify: `apps/web/src/app/updates/page.tsx`
- Modify: `apps/web/src/app/design-system.css`

- [x] Add failing component assertions for route titles, one relationship action, People-first Messages, and compact safe-area navigation.
- [x] Verify RED with the focused web tests.
- [x] Extend `AppHeader` with a compact route title while preserving the Today wordmark.
- [x] Remove the duplicate relationship band from public Pod cards and render one relationship-aware action.
- [x] Remove Pod Rooms from Messages and redirect the legacy `view=pods` query to My Pods.
- [x] Apply route titles to Discover, My Pods, Messages, and Updates.
- [x] Make bottom navigation flush, compact, and visually restrained.
- [x] Verify GREEN with focused tests.

### Task 4: Build the chat-first Pod shell

**Files:**
- Create: `apps/web/src/components/pod-room-header.tsx`
- Create: `apps/web/src/components/pod-occurrence-strip.tsx`
- Create: `apps/web/tests/pod-room-header.test.tsx`
- Create: `apps/web/tests/pod-occurrence-strip.test.tsx`
- Modify: `apps/web/src/app/pods/[podId]/room/page.tsx`
- Modify: `apps/web/src/app/pods/[podId]/today/page.tsx`
- Modify: `apps/web/src/app/pods/[podId]/activity/page.tsx`
- Modify: `apps/web/src/app/pods/[podId]/members/page.tsx`
- Modify: `apps/web/src/components/pod-tabs.tsx`
- Modify: `apps/web/src/app/design-system.css`

- [x] Add failing tests for back navigation, context actions, sharing fallback, creator controls, and remaining-time rendering.
- [x] Verify RED.
- [x] Implement the compact header and accessible context sheet.
- [x] Implement the occurrence strip using a one-second timer and a reduced-motion-safe state transition.
- [x] Replace the room hero and tabs with the compact header and strip.
- [x] Remove persistent Pod tabs from deep-link reference routes and add explicit back-to-room navigation.
- [x] Redirect active `/pods/:podId/today` requests to the room while preserving pre-lock waiting-room behavior.
- [x] Verify GREEN.

### Task 5: Normalize mobile chat interactions

**Files:**
- Modify: `apps/web/tests/pod-room.test.tsx`
- Modify: `apps/web/src/components/pod-room.tsx`
- Modify: `apps/web/src/app/design-system.css`

- [x] Replace tests that expect permanent actions with failing tests for reaction badges, More, long press, Reply, Pin, Hide, and Copy.
- [x] Add a failing test that no read POST occurs when reconciliation returns no newer sequence.
- [x] Verify RED.
- [x] Implement one active message action sheet, opened by long press or More.
- [x] Keep existing reaction counts as compact buttons while hiding zero-count reactions.
- [x] Add clipboard copy with inline confirmation.
- [x] Only advance read cursors when the server sequence exceeds the last acknowledged sequence.
- [x] Anchor both composers to the safe-area bottom and restore a visible focus state.
- [x] Verify GREEN.

### Task 6: Rebuild proof around one final action

**Files:**
- Modify: `apps/web/tests/activity-occurrence.test.tsx`
- Modify: `apps/web/src/components/activity-occurrence.tsx`
- Modify: `apps/web/src/app/design-system.css`

- [x] Add failing tests that Add evidence is available before a draft exists, file inputs remain visually hidden, visibility appears on the attachment tile, and Review and submit is the only final action.
- [x] Verify RED.
- [x] Save the draft automatically before the first evidence upload.
- [x] Replace Save evidence draft and Save changes with automatic draft state copy.
- [x] Put the attachment visibility choice in a focused confirmation surface.
- [x] Make Review and submit persist dirty text before submitting the returned draft.
- [x] Verify GREEN, including interrupted-upload and review-state tests.

### Task 7: Separate identity and harden the settings sheet

**Files:**
- Modify: `apps/web/tests/profile-avatar.test.tsx`
- Create: `apps/web/tests/profile-settings-sheet.test.tsx`
- Modify: `apps/web/src/components/profile-avatar.tsx`
- Modify: `apps/web/src/components/profile-settings-sheet.tsx`
- Modify: `apps/web/src/app/design-system.css`

- [x] Add a failing test that presets do not render activity photographs.
- [x] Add failing tests for `aria-modal`, initial focus, Escape close, and focus restoration.
- [x] Verify RED.
- [x] Render dedicated abstract identity signals with initials and preset palettes.
- [x] Implement dialog focus management without a new dependency.
- [x] Verify GREEN.

### Task 8: Browser and repository verification

**Files:**
- Modify: `apps/web/tests/e2e/visual-profile.spec.ts`
- Modify: `HANDOFF.md`
- Modify: `history/session-log.md`

- [x] Update browser assertions for People-first Messages, chat-first Pod rooms, compact navigation, proof visibility, and abstract avatars.
- [x] Run focused Vitest suites.
- [x] Run `pnpm check`.
- [x] Start the local stack and run the authenticated Mobile Safari visual journey.
- [x] Inspect screenshots for clipping, fixed-bar overlap, duplicate intent, raw file controls, and old blue states.
- [x] Record automated PASS results and the remaining physical Nimiq Pay gate in HANDOFF.
