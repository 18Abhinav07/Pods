---
created: 2026-07-20
project: pods
ecosystem: nimiq
tags: [validation, phase-3b, cutoff, refunds, mobile]
status: chain-pass-phone-confirmation-pending
---

# Phase 3B Cutoff and Refund Gate

Related: [[HANDOFF]] | [[validation/phase-3a-results]] | [[docs/superpowers/plans/2026-07-19-phase-3-funding-reconciliation|Phase 3 plan]]

## Current verdict

`AUTOMATED PASS, ON-CHAIN REFUND PASS, PHONE CONFIRMATION PENDING`

Tasks 9 through 13 and the automated portion of Task 14 pass. The real cutoff
and Nimiq Testnet refund also completed successfully by transaction hash. Phase
3B cannot receive its final physical `PASS` until Abhinav confirms the updated
balance and terminal refund state in Nimiq Pay.

## Implemented boundary

- Audited local Testnet Clock with monotonic, serialized advances and mandatory
  actor and reason fields.
- One serialized cutoff transaction closes entry, snapshots deposits finalized
  before cutoff, applies minimum and capacity rules, locks the roster, and
  creates every required refund entitlement.
- Deterministic capacity ordering uses finalized block position, transaction
  index, then transaction hash.
- Cancellation cannot bypass credited funds. A funded cancellation enters
  `cancelled_refunding` and closes only after every refund leg is confirmed.
- Refund transactions persist signed bytes and hash before broadcast.
- Prepared, broadcast, and unknown transfers are checked by hash before any
  retry. Unknown broadcasts are never resent blindly.
- Confirmation adds exactly one `refund_confirmed` ledger movement, marks the
  deposit and membership `refunded`, and preserves a locked Pod when the refund
  belonged only to an over-capacity participant.
- Participant waiting room shows own funding stage, roster count, remaining
  capacity, exact cutoff, frozen schedule, verification authority, and a
  refresh-safe refund rail.
- Creator funding administration receives safe participant labels and lifecycle
  states only. It does not receive wallet addresses, payment references, raw
  transactions, treasury secrets, or ledger account codes.
- Today, Discover, My Pods, funding status, and the Pod room resolve post-credit
  participants to one canonical lifecycle route.

## Automated evidence

- `pnpm check`: PASS.
- Copy gate: PASS, no U+2014 characters.
- Unit and component tests: 151 PASS.
- Live Postgres integration tests: 26 PASS.
- Worker and production web builds: PASS.
- Phase 3 funding and cutoff browser gate: 4 PASS across Mobile Safari and
  Android Chromium.
- Combined Phase 1, Phase 2, and Phase 3 browser regression: 16 PASS across
  Mobile Safari and Android Chromium.
- Browser cutoff coverage proves a two-seat roster lock, deterministic
  over-capacity exclusion, below-minimum cancellation, full refund confirmation,
  refresh-safe participant rooms, and creator privacy.
- Transfer negative-path tests prove prepared-before-broadcast, chain lookup
  before retry, no rebroadcast from `unknown`, execution failure isolation, and
  hash mismatch isolation.
- The live refund exposed the configured RPC's exact unknown-hash response:
  JSON-RPC `-32603` with `Transaction not found: <hash>` data. A regression test
  now proves this exact pre-broadcast response maps to an absent transaction;
  other RPC errors remain failures.

The browser cutoff tests used a separately migrated disposable Postgres
database and a temporary server on port 3412. The server was stopped and the
database was deleted after the gate. The phone server on port 3411 and the real
Pods database were not used for automated cutoff tests.

## Pre-cutoff safety snapshot

Read-only inspection before the authorized Clock advance showed:

- No `clock_events` existed in the real local database.
- `Pods MVP C1` remained `enrollment_open`.
- The real deposit remained credited from the Phase 3A physical gate.
- No real `transfer_legs` existed.
- No real refund was prepared or broadcast during automated work.

The real Pod cutoff was `2026-07-20T18:30:00.000Z`, which is midnight in its
configured Asia/Kolkata schedule. It had one funded participant against a
minimum of two, so the expected result was `cancelled_refunding` followed by a
full `8 NIM` Testnet refund.

## Physical gate procedure

1. Confirm the phone still shows `Commitment credited` for `Pods MVP C1` and
   record the participant and treasury Testnet balances.
2. Either wait for the real cutoff or, only with Abhinav's explicit approval,
   run the audited local command:

   ```bash
   APP_ENV=local NIMIQ_NETWORK=testnet PODS_CLOCK_ACTOR=abhinav:phone-gate \
   pnpm --filter @pods/worker clock:advance -- \
   --to 2026-07-20T18:30:00.000Z \
   --reason "Phase 3B physical cutoff and refund gate"
   ```

3. Reopen Today and the Pod room. Confirm the participant sees the refund rail
   and that the state survives WebView closure.
4. Wait for `Refund confirmed`, record the non-secret refund transaction hash,
   and confirm exactly `8 NIM` returned in Nimiq Pay and through Nimiq RPC.
5. Confirm the real database has one refund entitlement, one refund confirmation,
   one confirmed transfer leg, a `refunded` deposit and membership, and a
   `cancelled` Pod.
6. Add the exact evidence below and change this verdict to `PASS` before Phase 4.

## Physical evidence

- Abhinav recorded the participant balance as `109992 NIM` before cutoff.
- Audited Clock event: `61e2e05a-e8ee-440b-8d87-581ba17144d2`.
- Actor: `abhinav:phone-gate`.
- Effective cutoff: `2026-07-20T18:30:00.000Z`.
- The underfilled Pod transitioned through `cancelled_refunding` to `cancelled`.
- Refund transaction hash:
  `c9626f69ad858fba6ac6359cb28751e3b8d14defcbf8e289006a2f10e4602695`.
- Refund amount: `800000` Luna, exactly `8 NIM`.
- Chain result: successful execution in block `6513490`, batch `58025`.
- Finality result: observed at latest batch `58027`, beyond the containing batch.
- Persisted terminal states: transfer `confirmed`, membership `refunded`,
  deposit `refunded`, Pod `cancelled`.
- Ledger conservation: one `800000` Luna deposit credit, one `800000` Luna
  refund entitlement, and one `800000` Luna refund confirmation.
- Full isolated verification after the RPC fix: copy, lint, typecheck, 151
  unit/component tests, 26 integration tests, and web/worker builds all PASS.
- Pending physical observation: Abhinav must confirm the participant wallet now
  shows `110000 NIM` and the reopened Mini App shows the terminal refund state.
