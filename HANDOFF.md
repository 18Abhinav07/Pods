---
project: pods
last-updated: 2026-07-20 15:00
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[AGENTS]] | [[PRODUCT]] | [[docs/implementation-plan]] | [[validation/phase-3a-results]] | [[docs/superpowers/plans/2026-07-19-phase-3-funding-reconciliation|Phase 3 plan]]

## State

Phase 0, Phase 1, Phase 2, and Phase 3A are physically approved. The real 8 NIM
Nimiq Pay Testnet commitment finalized, produced exactly one ledger credit,
survived status-route reopening, and is recorded in
`validation/phase-3a-results.md`. Phase 3B cutoff, roster lock, and refunds are
authorized and starting from Task 9.

The participant relationship is now projected through one shared UI contract.
Discover, public Pod detail, Applications, My Pods, and Today show the same
status, next action, and canonical route for every membership state. The real
participant currently has `funded_provisional` and the deposit has
`credited_provisional`. The correct UI remains `Commitment credited` until the
Phase 3B cutoff barrier produces either roster lock or a full refund.

## In Progress

- Phone URL: `http://192.168.29.244:3411/`.
- PostgreSQL, MinIO, the web dev server, and the funding worker are running.
- `Pods MVP C1` remains the one real public Pod.
- Phase 3B Task 9 is in progress: add the audited local Testnet Clock.
- The real funded Pod must not be advanced to cutoff until refund transfer tests
  pass and the cutoff/refund worker is ready.

## Open Errors and Blockers

- No automated error is open.
- No Phase 3A blocker remains.
- The real Pod currently has one funded participant against a minimum of two,
  so the expected cutoff result is a full 8 NIM refund unless another eligible
  participant funds before the serialized snapshot.
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

1. Implement and test Task 9, the audited local Testnet Clock.
2. Implement the serialized cutoff barrier and financially safe cancellation.
3. Implement DB-backed refund reconciliation before advancing the real Pod.
