---
created: 2026-07-20
project: pods
ecosystem: nimiq
tags: [session, codex, hackathon, phase-3b]
---

# Phase 3B Implementation Session

Related: [[HANDOFF]] | [[sessions/INDEX]] | [[validation/phase-3b-results]]

## Completed

- Recorded the previously approved Phase 3A physical funding gate.
- Added the audited local Testnet Clock.
- Implemented serialized cutoff, roster lock, safe cancellation, refund
  entitlements, persisted-before-broadcast signing, unknown reconciliation, and
  exactly-once refund ledger confirmation.
- Added the participant waiting room, refund rail, creator-safe funding view,
  and canonical post-credit routes across Today and My Pods.
- Added cutoff and refund integration tests plus isolated mobile browser gates.
- Passed `pnpm check`, 150 unit/component tests, 26 integration tests, and 16
  combined mobile browser journeys.

## Decisions

- Automated cutoff tests use a disposable Postgres database and isolated web
  server. The real Pod database is never advanced by browser automation.
- Playwright uses one worker because the audited Clock is globally monotonic.
- Unknown refund broadcasts remain lookup-only. They cannot rebroadcast without
  an operator-owned resolution.
- Creator funding rows use safe ordinal participant labels until public handle
  setup exists.

## Errors and resolutions

- Mobile Safari route tests raced with a prior Next navigation. Waiting for
  `networkidle` before forced navigation made the assertions deterministic.
- A temporary workspace with dependency symlinks caused Turbopack root rejection
  and later pnpm reconciliation. Webpack mode validated the disposable copy, the
  locked install restored local dependencies, and the live phone server was
  never stopped.

## Remaining

- Physical Nimiq Pay cutoff and full `8 NIM` refund verification.
- Phase 4 remains blocked until that result is recorded as `PASS`.

## Phase 3C addendum

### Completed

- Centralized participant and creator projections so Today, Discover, My Pods,
  Applications, Pod detail, rules, funding, and waiting rooms link to one
  canonical next state.
- Replaced transient Inbox behavior with durable chronological application,
  funding, roster, and refund history.
- Made terminal funding and refund rails visually terminal and removed stale
  funding actions after roster lock, cancellation, or refund confirmation.
- Fixed the 360-pixel funding outcome layout, touch targets, and narrow-screen
  overflow.
- Blocked creator self-application at both page and repository boundaries.
- Added hydration gates for wallet and template controls and allowed the LAN,
  localhost, and loopback development origins.
- Removed all users, sessions, Pods, memberships, applications, invitations,
  deposit intents, ledger entries, transfer legs, wallet challenges, and Clock
  events while preserving five applied migrations.

### Validation

- `pnpm check` passes with 104 web tests, 40 worker tests, 28 integration tests,
  lint, copy checks, type checks, and production builds.
- All 22 Mobile Safari and Android Chromium journeys pass, including the four
  primary destination boundaries, wallet rejection retry, public and private
  enrollment, funding recovery, cutoff, roster inclusion, cancellation, and
  refunds.
- LAN home and connect routes return HTTP 200 at
  `http://192.168.29.244:3411/`.

### Errors and resolutions

- Server-rendered controls could receive a tap before hydration. Controls now
  remain disabled until the client store reports hydration.
- A long-running worker consumed an advanced browser-test Clock and could close
  newly created Pods between actions. Browser teardown now removes its audited
  test Clock events, financial test fixtures are deleted in dependency order,
  and the real worker is paused during automated clock tests.
