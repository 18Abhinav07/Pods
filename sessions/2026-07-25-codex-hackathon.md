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
- The underfilled cancellation path returned exactly 10,000 Luna to the only
  funded participant and transferred nothing to the unfunded participant.
- A physical two-wallet, three-occurrence Pod conserved its 60,000 Luna pool:
  User 1 received 40,000 Luna and User 2 received 20,000 Luna.
- User 1 payout transaction
  `55b86a13fdbe8c71cb7bb8749f0b0b679c8836d753c868e68f1514268a84e8c1`
  finalized successfully at Testnet block `6959461`.
- User 2 payout transaction
  `e2bae3f34f81763e9423cb4ce3b07f8a68171e8018d11835f57212bf120cecdf`
  finalized successfully at Testnet block `6959462`.
- Terminal persistence is exact: Pod `completed`, settlement `settled`, two
  confirmed entitlements, two payout ledger rows totaling 60,000 Luna, no open
  payout/refund legs, and no creator transfer.
- A later worker cycle preserved exactly two transfer attempts and two payout
  ledger rows. Payout broadcasting was disabled again immediately after the
  approved execution.

## In Progress

- Run the release gate on the exact approved upgrade branch.
- Merge and deploy only after that gate remains green.
- `main` and Railway remain unchanged.

## Errors

- LAN readiness returned 500 because the isolated worktree server lacked its
  local MinIO environment. Restarting with the complete local `PODS_S3`
  configuration restored full readiness.
- The settlement persistence suite completed all 14 assertions, then its
  teardown hit a foreign-key error because it deletes memberships before
  referenced ledger rows. Guarded cleanup removed only generated NQTEST data;
  this did not affect settlement math or the physical Pod.
