---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [implementation-plan, phase-0, validation]
status: approved
---

# Phase 0 Implementation Plan

Related: [[../README|Pods README]] | [[../validation/inbound-spike-manifest|Inbound spike manifest]] | [[design-reference/README|Design reference]]

## Goal

Create the isolated public repository, permanent application structure, locked
visual shell, local service composition, CI gates, and an empirically validated
outbound Testnet transfer primitive.

## Tasks

1. Preserve the design references and canonical-source hashes.
2. Scaffold the web, worker, domain, database, and UI workspaces.
3. Add tests for copy enforcement and locked design tokens before implementation.
4. Add tests for prepare, persist, broadcast, and reconcile-before-retry behavior.
5. Implement the minimal application and transfer preflight to pass those tests.
6. Run lint, typecheck, unit, integration, build, and LAN smoke checks.
7. Receive one exact worker-originated Testnet transfer on a physical device.
8. Record PASS or FAIL and stop for approval.

## Non-goals

- Wallet authentication
- Pod creation
- Participant deposits
- Production treasury custody
- Mainnet use

## Phase 1: Contract, wallet session, and immutable creation

### Phone acceptance flow

```text
Open /connect?returnTo=/pods/create/template
-> connect Nimiq Pay wallet
-> sign one-time challenge
-> return to template selection
-> choose one fixed template
-> configure activity, schedule, and template evidence contract
-> choose Public or Private community terms
-> configure NIM per occurrence
-> review the complete frozen contract
-> publish
-> inspect the immutable Rules screen
```

The return URL is server-validated, the session is HTTP-only, and every wizard
write is owner-guarded. Publishing validates the complete contract again,
materializes all occurrence windows in the frozen timezone, records a contract
hash, and changes the Pod from `draft` to `enrollment_open` in one transaction.

### Task 1: Shared domain contract

- Add immutable template definitions, draft and published-contract types, Pod
  states, visibility, and evidence modes to `packages/domain`.
- Add validation for each wizard step and the complete publish boundary.
- Add deterministic occurrence materialization with timezone and DST tests.
- Add integer Luna calculation and a stable contract hash input.
- Test first in `packages/domain/tests`.

### Task 2: Phase 1 persistence

- Add Drizzle schema for users, wallet challenges, sessions, Pods, and frozen
  occurrences.
- Add the first SQL migration and migration command.
- Add repositories for challenge/session lifecycle and owner-scoped draft writes.
- Publish in one database transaction and reject every later material edit.
- Prove draft persistence, cross-owner rejection, one-time challenge use, and
  immutable publish with live Postgres integration tests.

### Task 3: Signed wallet session

- Add `@nimiq/mini-app-sdk@0.1.0` to the web client and
  `@nimiq/core@2.7.1` to server verification.
- Create a five-minute random challenge bound to one normalized Nimiq address.
- Verify public key ownership, address derivation, signature, expiry, and
  single use before issuing a random HTTP-only session cookie.
- Validate safe relative return targets and reject external return URLs.
- Test all auth behavior before adding API handlers.

### Task 4: Auth APIs and route guards

- Add challenge, verify, session, and logout handlers under `apps/web/src/app/api/auth`.
- Add reusable server guards for connected-wallet and exact draft ownership.
- Make `/connect` preserve a safe return destination and design provider
  unavailable, wallet rejected, signing rejected, and retry states.
- Make `/today` the first authenticated empty state and redirect unauthenticated
  protected routes through `/connect`.

### Task 5: Creator wizard API

- Add owner-guarded draft create, read, update, preview, and publish handlers.
- Keep template, activity, community, and commitment writes as explicit step
  payloads rather than a generic unrestricted patch.
- Return field-level validation errors and never trust client occurrence counts
  or commitment totals.

### Task 6: Creator wizard screens

- Build `/pods/create/template`, `/activity`, `/community`, and `/commitment`
  using the locked Earned Momentum visual system and motion scale.
- Persist each approved step before navigation and restore saved drafts after
  refresh or WebView closure.
- Render distinct template-specific activity fields for all five fixed templates.
- Keep one primary action per screen and provide saved, loading, inline error,
  and retry states.

### Task 7: Review, publish, and immutable Rules

- Add the complete review screen at `/pods/create/review`.
- Show the materialized occurrence count, integer Luna total, visibility,
  evidence mode, centralized review boundary, and creator authority limits.
- Publish only after explicit frozen-contract acknowledgement.
- Add `/pods/:podId/rules` with exact owner access and immutable contract data.

### Task 8: Phase 1 gates

- Add browser tests for protected-route return, the full seeded-session creator
  wizard, refresh persistence, publish, and rejected post-publish mutation.
- Run copy, lint, typecheck, unit, live Postgres integration, production build,
  Mobile Safari, and Android Chromium gates.
- Run the complete phone acceptance flow inside Nimiq Pay before Phase 2 begins.

### Phase 1 non-goals

- Public applications and private invitation acceptance
- Participant deposits and treasury crediting
- Cutoff and roster lock
- Evidence submission and review
- Settlement and payout
