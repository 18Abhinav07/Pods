---
created: 2026-07-24
project: pods
ecosystem: nimiq
tags: [validation, phase-5, settlement, payout, testnet]
status: automated-browser-dry-run-pass-physical-pending
---

# Phase 5 Settlement and Payout Gate

Related: [[HANDOFF]] |
[[docs/superpowers/plans/2026-07-24-pods-settlement-payout]] |
[[docs/superpowers/specs/2026-07-24-pods-testnet-settlement-amendment]]

## Current verdict

`AUTOMATED, MOBILE BROWSER, AND NON-BROADCAST DRY RUN PASS`

`PHYSICAL NIMIQ PAY PAYOUT PENDING`

The deterministic settlement, immutable payout attempts, operations recovery,
and participant and creator settlement surfaces are implemented. No Mainnet
behavior is authorized. No automated test broadcast a treasury transaction.

## Implemented boundary

- Existing `full_refund_alpha` Pods preserve their full-return behavior.
- Newly published public-deposit Pods freeze proportional settlement only when
  the settlement capability is enabled.
- Creator review and the no-appeal Testnet trust boundary are disclosed before
  publication and before the wallet handoff.
- Funding requires explicit acceptance of the current immutable contract hash.
- Settlement snapshots the complete roster, deposit, occurrence, submission,
  contract, and calculator boundary.
- Approved, rejected, timeout-protected, and missed outcomes settle in integer
  Luna with deterministic remainder assignment and exact conservation.
- Zero-bonus-recipient occurrences restore provisional forfeitures to their
  original owners.
- Positive entitlements create one logical payout leg. Zero entitlements close
  as `no_transfer_required`.
- Signed payout attempts are immutable and persisted before broadcast.
- Unknown transactions are checked by hash and never blindly rebroadcast.
- Late or failed attempts can be retried only after an authenticated operations
  action performs a fresh read-only chain check.
- A Pod becomes completed only after all positive payouts are independently
  confirmed and every zero entitlement requires no transfer.

## Automated evidence

The complete `pnpm check` gate passed on 24 July 2026:

- ESLint: PASS with zero warnings.
- Copy gate: PASS with no U+2014 characters.
- Workspace typechecks: PASS.
- Root tests: 6 PASS.
- Domain tests: 56 PASS.
- UI tests: 3 PASS.
- Worker tests: 58 PASS.
- Web unit and component tests: 368 PASS.
- PostgreSQL integration tests: 83 PASS across 14 files.
- Worker production build: PASS.
- Next.js production build: PASS, including settlement and operations routes.

The focused settlement, funding consent, and activity lifecycle integration
matrix passed 35 of 35 tests before the full gate.

## Mobile browser evidence

`apps/web/tests/e2e/phase5-settlement.spec.ts` passed:

- Mobile Safari: PASS.
- Android Chromium: PASS.

Each engine used disposable authenticated creator, approved-participant, and
rejected-participant identities. The journey verified:

- creator treasury conservation and entitlement count;
- approved participant principal plus redistributed bonus;
- rejected participant zero-transfer result;
- canonical transfer-state language;
- no participant wallet-address leakage.

The first browser attempt correctly exposed a stale long-running repository
singleton. Restarting the LAN server loaded the new repository methods. The
second environment attempt correctly exposed closed-alpha access for generated
wallets. The final run used explicit local-test mode and passed on both engines.

## Non-broadcast treasury dry run

The protected local Testnet treasury configuration was read without printing
the private key or raw signed bytes.

- Configured treasury address matched the derived signer address: PASS.
- Live Testnet validity start height: `6816989`.
- Two one-Luna transactions used the same sender, recipient, amount, fee,
  network, and validity height.
- Attempt references `pods:payout:dry-run:1` and
  `pods:payout:dry-run:2` produced distinct verified transaction hashes.
- Signed transactions: 2.
- Broadcasts: 0.

## Physical gate still required

This gate requires one creator wallet and two participant wallets in Nimiq Pay:

1. Publish a proportional Testnet Pod with two funded participants.
2. Reach roster lock and complete the frozen occurrence matrix.
3. Manually approve one participant and reject or miss the other.
4. Finalize settlement and verify the deterministic bonus before broadcast.
5. Run the worker with the protected Testnet treasury.
6. Confirm both positive payout legs, or the positive leg plus one
   `no_transfer_required` entitlement when a member settles to zero.
7. Reopen each participant settlement page and verify its persisted hash and
   terminal state.
8. Confirm the ledger still conserves the exact frozen deposit total and the
   creator receives zero participant funds.

The phase remains physically pending until Abhinav approves this walkthrough.

## Release boundary

- Automated-green local implementation commit: `33e54ba`.
- No GitHub push was performed.
- No Railway deployment was performed.
- No Mainnet transaction was prepared or broadcast.
- The protected Phase 4 base remains unchanged.
