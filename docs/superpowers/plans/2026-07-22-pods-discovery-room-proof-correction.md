---
created: 2026-07-22
project: pods
ecosystem: nimiq
tags: [implementation-plan, mobile-ux, discovery, pod-room, proof, tdd]
---

# Pods Discovery, Room, and Proof Correction Plan

Related: [[../specs/2026-07-22-pods-discovery-room-proof-correction]] | [[2026-07-22-pods-chat-first-redesign]] | [[../../../HANDOFF]]

**Goal:** Correct the approved Phase 4 chat-first implementation so discovery, people search, Pod rooms, and recurring proof behave as one coherent mobile product.

**Architecture:** Keep all frozen financial, membership, evidence, and review contracts. Enrich optional authenticated sessions with their profile, move global people lookup into a bounded search route, derive room proof intent from occurrence and submission state, and expose a paginated group-safe proof projection from authoritative records.

**Validation boundary:** No new external API, SDK, blockchain interaction, schema migration, or dependency is introduced. Existing Phase 4 storage and Nimiq spikes remain valid. Every production behavior begins with a focused failing test.

## Task 1: Stable optional identity and people ownership

**Files:** `apps/web/src/lib/session.ts`, `apps/web/src/lib/alpha-access-server.ts`, `apps/web/src/components/app-header.tsx`, `apps/web/src/app/profile/page.tsx`, `apps/web/src/app/people/search/page.tsx`, `packages/db/src/profile-repository.ts`, focused web and repository tests.

- [x] Prove an optional signed-in session carries its persisted profile.
- [x] Add query-first public-profile search with a two-character minimum and bounded results.
- [x] Put People search before Updates and surface Following and Friends from Profile.

## Task 2: Pod-only Discover and compact application intent

**Files:** `apps/web/src/app/discover/page.tsx`, `apps/web/src/components/public-pod-card.tsx`, `apps/web/src/app/design-system.css`, focused Discover tests.

- [x] Remove People and Following data fetches and segments from Discover.
- [x] Replace the visitor action band with an accessible circular arrow over the media.
- [x] Preserve compact relationship-aware destinations for applied, accepted, funded, and joined users.

## Task 3: Mobile room header and composer geometry

**Files:** `apps/web/src/app/pods/[podId]/room/page.tsx`, `apps/web/src/components/pod-room-header.tsx`, `apps/web/src/components/pod-room.tsx`, `apps/web/src/app/design-system.css`, focused room tests.

- [x] Remove redundant room back navigation.
- [x] Fix the composer to the WebView bottom at full app width with safe-area handling.
- [x] Make the send state visually and accessibly unambiguous.

## Task 4: Authoritative recurring occurrence intent

**Files:** `packages/db/src/activity-repository.ts`, `apps/web/src/lib/room-activity-presentation.ts`, `apps/web/src/app/pods/[podId]/room/page.tsx`, `apps/web/src/components/pod-occurrence-strip.tsx`, focused domain, repository, and component tests.

- [x] Return current and future occurrence context without modifying frozen schedules.
- [x] Derive lock, add, continue, view, upcoming, and complete states from authoritative data.
- [x] Show occurrence progress and the next opening when a submitted occurrence is followed by another.

## Task 5: Member-aware group-safe proof history

**Files:** `packages/db/src/activity-repository.ts`, `apps/web/src/app/pods/[podId]/activity/page.tsx`, `apps/web/src/app/design-system.css`, focused integration and component tests.

- [x] Add authorized, paginated, query-filtered proof history joined to participant profiles.
- [x] Render All and Mine scopes, member search, participant identity, and review state.
- [x] Preserve the two-layer evidence boundary and remove repeated Pod or phase copy.

## Task 6: Connected browser and repository verification

**Files:** browser journeys, `HANDOFF.md`, `history/session-log.md`, `sessions/2026-07-22-codex-hackathon.md`.

- [x] Run focused red-green suites after each task.
- [x] Run the full repository gate and production builds.
- [x] Exercise Discover, profile search, Pod room, and proof states at Mobile Safari and Android widths.
- [x] Record automated evidence separately from the remaining physical Nimiq Pay gate.
