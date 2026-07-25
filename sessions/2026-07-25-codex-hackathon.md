---
created: 2026-07-25
project: pods
ecosystem: nimiq
tags: [session, codex, hackathon]
---

# Build and Ship Testnet Core Completion

Related: [[HANDOFF]] | [[sessions/INDEX]]

## Completed

- Implemented one canonical lifecycle projection across Today, My Pods,
  Updates, Pod rooms, and settlement.
- Added private participant payout and refund projections plus creator
  entitlement and transfer-exception summaries.
- Preserved room archives and settlement access for creators and locked
  participants.
- Added Mobile Safari and Android coverage for funding, cancellation,
  redistribution, payout afterstate, visitor privacy, and zero-recipient
  restoration.
- Published `upgrade/build-ship-testnet-core` at `68bb706`.

## Verification

- `pnpm check`: PASS with 699 unit/component and 94 integration tests.
- Funding browser matrix: 4 of 4 PASS.
- Settlement browser matrix: 4 of 4 PASS.
- Independent review: no remaining Critical or Important implementation
  finding.
- LAN readiness: configuration, database, evidence storage, and schema ready.

## In Progress

- Physical Nimiq Pay two-participant entitlement snapshot on port `3411`.
- Payout broadcast remains disabled until explicit approval.
- `main` and the staged Railway deployment remain unchanged.

## Errors

- LAN readiness returned 500 because the isolated worktree server lacked its
  local MinIO environment. Restarting with the complete local `PODS_S3`
  configuration restored full readiness.
