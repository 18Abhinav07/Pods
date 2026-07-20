---
project: pods
last-updated: 2026-07-20 14:35
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[AGENTS]] | [[PRODUCT]] | [[docs/implementation-plan]] | [[validation/phase-3a-results]] | [[docs/superpowers/plans/2026-07-19-phase-3-funding-reconciliation|Phase 3 plan]]

## State

Phase 0, Phase 1, and Phase 2 are physically approved. Phase 3A Tasks 1 through
7 are implemented on `phase/03-funding`. The automated Task 8 gate passes and
the real Nimiq Pay Testnet commitment remains the only open Phase 3A checkpoint.
Phase 3B cutoff, roster lock, and refunds have not started.

The participant relationship is now projected through one shared UI contract.
Discover, public Pod detail, Applications, My Pods, and Today show the same
status, next action, and canonical route for every membership state. The real
participant currently has `funding_failed` after rejecting the wallet request,
so the correct UI is `Funding needs attention` with `Retry funding`.

## In Progress

- Phone URL: `http://192.168.29.244:3411/`.
- PostgreSQL, MinIO, the web dev server, and the funding worker are running.
- `Pods MVP C1` remains the one real public Pod.
- Reload Discover and Today on the accepted participant wallet. Both must show
  the Pod's funding recovery state rather than `Apply to join` or the discovery
  empty action.
- Retry funding, approve the Nimiq Pay Testnet transaction, and wait for the
  tracker to reach `Commitment credited`.

## Open Errors and Blockers

- No automated error is open.
- The real participant has not yet approved a Testnet funding transaction.
- Phase 3B remains blocked until the physical Phase 3A verdict is PASS.
- The shared treasury remains a bounded custodial Testnet hot wallet. Its key
  stays only in ignored `.runtime` storage and must never be printed or committed.

## Verification

- `pnpm check`: PASS.
- Copy gate: PASS, no U+2014 characters.
- Unit and component tests: 134 PASS.
- Live Postgres integration tests: 17 PASS.
- Participant-state mobile journeys: 6 PASS across Mobile Safari and Android Chromium.
- LAN root health: HTTP 200.

## Git State

- Branch: `phase/03-funding`.
- Latest committed fix before the relationship audit: `7a4950e`.
- The cross-route relationship projection and Impeccable product context are
  implemented and awaiting their commit.
- Safe ignored local web configuration exists at `apps/web/.env.local`.

## Next 3 Tasks

1. Complete the phone UX check for Discover and Today, then approve the real funding transaction.
2. Capture finality and ledger evidence and record Abhinav's Phase 3A PASS.
3. Only after PASS, begin Task 9, the audited local Clock for Phase 3B.
