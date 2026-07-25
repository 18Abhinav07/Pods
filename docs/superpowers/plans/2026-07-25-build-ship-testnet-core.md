---
created: 2026-07-25
project: pods
ecosystem: nimiq
tags: [implementation-plan, build-and-ship, testnet, settlement, payout]
---

# Build and Ship Testnet Core Completion

Related: [[HANDOFF]] |
[[docs/superpowers/plans/2026-07-24-pods-settlement-payout]] |
[[validation/phase-5-results]]

## Goal

Make the Build and Ship lifecycle complete and internally consistent from
enrollment through real Testnet NIM payout, without changing any persisted
financial state or expanding the feature scope.

The frozen lifecycle remains:

`draft -> enrollment_open -> cutoff_evaluating -> locked_scheduled -> active
-> final_review -> completed`

The cancellation path remains:

`enrollment_open -> cancelled_refunding -> cancelled`

The submission lifecycle remains:

`draft -> reviewing -> approved | rejected | timeout_protected`

A missing or still-draft submission becomes `missed` only inside the immutable
settlement snapshot after its occurrence has closed.

## Locked product rules

- Build and Ship is the only physically certified template in this release.
- The creator reviews proof but is not a member, does not fund, and never
  receives participant funds.
- Approved work receives principal plus its deterministic share of forfeitures
  for the same occurrence.
- Timeout-protected work receives principal and no bonus.
- Rejected or missed work forfeits that occurrence slice.
- If an occurrence has no approved participant, every provisional forfeiture
  is restored to its original owner.
- Every calculation uses integer Luna and must conserve the exact frozen
  deposit total.
- Positive entitlements require a confirmed payout transfer before the Pod can
  become completed.
- Zero entitlements close as `no_transfer_required`.
- Payout broadcast stays disabled until the two-wallet snapshot is inspected
  and approved.
- Time advances only through the audited Clock command. Direct database
  timestamp edits are prohibited.

## Task 1: Canonical derived afterstate

**Files**

- Add `apps/web/src/lib/core-lifecycle.ts`
- Add `apps/web/tests/core-lifecycle.test.ts`
- Update `apps/web/src/lib/participant-pod-state.ts`
- Update `apps/web/src/lib/creator-pod-state.ts`
- Update their existing tests

**RED first**

- A final-review Pod with no settlement reads `Final review`.
- An executing entitlement with a queued leg reads `Payout queued`.
- Prepared, broadcast, or unknown reads `Payout confirming`.
- Retryable-failed, mismatched, late, or manual-review reads
  `Transfer needs review`.
- A confirmed transfer under a completed Pod reads `Completed`.
- A zero entitlement reads `No transfer required`.
- Completed and cancelled Pods never receive a Today priority.

**Implementation**

Create one pure projection from Pod state, relationship, settlement,
entitlement, and transfer state. Existing database values remain unchanged.
All product surfaces consume this derived result.

## Task 2: Membership and Updates financial projections

**Files**

- Update `packages/db/src/enrollment-repository.ts`
- Update `packages/db/src/inbox-repository.ts`
- Update `packages/db/tests/phase5-settlement.integration.test.ts`
- Update `apps/web/src/lib/inbox-events.ts`
- Update `apps/web/tests/inbox-events.test.ts`

**RED first**

- Membership summaries return settlement, entitlement, and payout leg data.
- Updates distinguish refund transfers from payout transfers.
- Payout queued, submitted, confirmed, and operations-review events link to
  the settlement page and never use refund copy.
- No public or social DTO receives wallet addresses or raw transaction bytes.

**Implementation**

Join only the participant's own settlement and transfer records into private
membership and Updates queries. Keep the existing refund flow intact.

## Task 3: Today and My Pods consistency

**Files**

- Update `apps/web/src/lib/today-priority.ts`
- Update `apps/web/src/app/today/page.tsx`
- Update `apps/web/src/app/my-pods/page.tsx`
- Update `apps/web/tests/today-priority.test.ts`
- Update `apps/web/tests/today-page.test.tsx`
- Update `apps/web/tests/my-pods-page.test.tsx`

**RED first**

- A payout needing user attention outranks passive activity.
- An executing payout routes to settlement from Today and My Pods.
- Completed and cancelled creator Pods do not become the Today primary action.
- Completed Pods remain available in My Pods as history.

**Implementation**

Pass the private financial projection into the canonical presenter and remove
terminal creator records from the Today-action candidate set.

## Task 4: Room and settlement afterstate

**Files**

- Update `apps/web/src/app/pods/[podId]/room/page.tsx`
- Update `apps/web/src/lib/room-activity-presentation.ts`
- Update `apps/web/src/components/settlement-summary.tsx`
- Update related room and settlement tests

**RED first**

- Final review replaces the completed activity CTA with `View settlement`.
- Completed proportional Pods expose settlement plus the permanent room
  archive.
- Payout exceptions have explicit labels.
- A transaction hash appears only when one exists.

**Implementation**

Keep proof history readable, but route financial completion through settlement.
Do not duplicate settlement math inside room presentation.

## Task 5: Settlement and payout invariants

**Files**

- Update focused tests in `packages/domain/tests/settlement.test.ts`
- Update focused integration tests in
  `packages/db/tests/phase5-settlement.integration.test.ts`
- Update worker tests only if a failing invariant exposes a real gap

**RED first**

- Redistribution conserves deposits exactly.
- Zero-recipient restoration returns each original slice.
- Creator membership is rejected.
- Unresolved positive transfers block completion.
- Confirming the last positive transfer completes the run and Pod once.
- Repeated worker cycles never create a second payout leg or rebroadcast an
  unknown transaction blindly.

**Implementation**

Change production code only if a test proves a gap. Existing settlement and
payout state names stay frozen.

## Task 6: Build and Ship browser matrix

**Files**

- Extend `apps/web/tests/e2e/phase5-settlement.spec.ts`
- Update `validation/phase-5-results.md`

**Automated matrix**

- Creator plus two participants.
- Approved plus rejected or missed redistribution.
- Zero-approved restoration.
- Underfilled cancellation and refund regression.
- Today, My Pods, room, proof detail, creator controls, Updates, settlement,
  and visitor archive show the same lifecycle.
- Mobile Safari and Android Chromium.

## Task 7: Physical Testnet gate

Use the product and audited Clock command only.

### Pod A: redistribution

1. Creator publishes one-occurrence Build and Ship Pod.
2. Two participant wallets fund 0.1 NIM each.
3. Roster locks.
4. Both lock commitments and submit proof.
5. Creator approves A and rejects B, or B misses.
6. Finalize while payout broadcast is off.
7. Inspect exact conservation and entitlements.
8. Enable payout broadcast only after approval.
9. Confirm every positive hash through macro-block finality.

### Pod B: zero-recipient restoration

1. Two participants fund one occurrence.
2. No participant is approved.
3. Finalize and verify both original slices are restored.
4. Broadcast and confirm both Testnet returns.

### Regression: underfilled cancellation

1. Fund a Pod below its minimum.
2. Advance cutoff with the audited Clock command.
3. Verify cancellation, refund queue, broadcast, finality, and terminal
   afterstate.

## Task 8: Release

- Run `pnpm check`.
- Run Mobile Safari and Android Chromium browser journeys.
- Run the LAN Nimiq Pay gate on port 3411.
- Stop for explicit physical approval.
- Merge `upgrade/build-ship-testnet-core` into `main`.
- Push exact `main`.
- Deploy the same SHA to Railway web and worker.
- Keep Testnet payout broadcasting enabled only after the physical gate passes.
- Verify terminal Railway success, readiness, runtime SHA, and one remote
  Nimiq Pay smoke test.
- Update `README.md`, `PRODUCT.md`, `HANDOFF.md`,
  `history/session-log.md`, and `validation/phase-5-results.md`.

## Explicitly excluded

- Physical certification of Fitness, Reading, Study, or Practice and Create.
- New chat, media, social, visitor, or profile features.
- Appeals, disputes, or peer voting.
- Mainnet, USDT, or mixed-currency Pods.
- Trustless escrow or a new custody architecture.

## Automated checkpoint

Implementation commit
`51a4b91a0c489b578dcab1f2de21e771faae0ae8` completes Tasks 1 through 6.

- `pnpm check`: PASS.
- Unit and component tests: 699 PASS.
- PostgreSQL integration tests: 94 PASS.
- Funding and cancellation mobile matrix: 4 of 4 PASS.
- Settlement and restoration mobile matrix: 4 of 4 PASS.
- Independent review: no remaining Critical or Important implementation
  finding.
- Payout broadcast: disabled.
- Main merge and Railway deployment: not performed.

Task 7 remains the required physical Nimiq Pay gate. Task 8 must not proceed
past branch publication until the two-wallet entitlement snapshot is inspected
and explicitly approved.
