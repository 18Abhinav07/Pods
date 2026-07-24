---
created: 2026-07-24
project: pods
ecosystem: nimiq
tags: [implementation-plan, settlement, payouts, treasury, phase-5]
---

# Pods Settlement and Payout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Related: [[HANDOFF]] |
[[docs/superpowers/specs/2026-07-24-pods-testnet-settlement-amendment]]

**Goal:** Add deterministic per-occurrence settlement and idempotent real Testnet NIM payouts without changing any existing `full_refund_alpha` Pod contract.

**Architecture:** A pure domain calculator derives immutable member entitlements from frozen occurrence outcomes. Postgres finalizes one settlement snapshot and append-only ledger movements in one transaction, then queues one payout transfer leg per funded member. The worker reuses the already validated treasury signer and hash-first reconciliation boundary to broadcast and confirm payout legs.

**Tech Stack:** TypeScript, Vitest, Drizzle ORM, PostgreSQL, Next.js App Router, Nimiq RPC, Nimiq transfer signer.

---

## Locked boundaries

- Branch: `add/phase-settlement-payout`, based on `fdc8510`.
- Existing `full_refund_alpha` contracts retain their full-return behavior.
- Newly published Pods use `proportional` only when `PODS_SETTLEMENT_ENABLED=true` and `PODS_DEPOSIT_MODE=public`.
- The creator is never a membership, depositor, bonus recipient, or payout recipient.
- Settlement uses integer Luna only.
- Approved submissions protect principal and share that occurrence's forfeiture pool.
- Timeout-protected submissions protect principal but receive no bonus.
- Rejected submissions and missing or draft submissions forfeit that occurrence slice.
- When an occurrence has no approved member, forfeitures return to their original owners and the occurrence closes as `closed_no_bonus_recipient`.
- Settlement finalization is immutable and idempotent.
- Transfer retries never recalculate entitlements and never rebroadcast an unknown transaction without a chain lookup.
- Cycle I Testnet payout transactions use the validated zero-fee signer. Participant principal is never reduced by a transfer fee.
- No direct database timestamp edits are permitted. Time advances only through the audited Clock command.
- Capacity ordering remains the existing finalized-chain implementation choice. This phase does not introduce or change a participant-facing fairness term.

## Task 0: Close creator-entry and aggregate-safety gaps

**Files:**
- Modify: `packages/db/src/enrollment-repository.ts`
- Modify: `packages/db/tests/phase2-enrollment.integration.test.ts`
- Modify: `packages/domain/src/index.ts`
- Modify: `packages/domain/tests/pod-contract.test.ts`

- [x] Write failing tests proving a creator cannot accept either a generic or targeted private invitation to their own Pod.
- [x] Derive the Pod creator from the server-side invitation relation and reject both acceptance paths before membership mutation.
- [x] Write a failing contract test for an unsafe aggregate pool.
- [x] Reject publication when `totalLuna * maxParticipants` is not a safe integer.

## Task 1: Pure settlement calculator

**Files:**
- Create: `packages/domain/src/settlement.ts`
- Modify: `packages/domain/src/index.ts`
- Create: `packages/domain/tests/settlement.test.ts`

- [x] Write failing tests for approved bonus distribution, timeout protection, rejected and missed forfeiture, zero-recipient restoration, deterministic one-Luna remainder assignment, duplicate input rejection, and conservation.
- [x] Run `pnpm --filter @pods/domain test -- settlement.test.ts` and verify RED because the settlement API does not exist.
- [x] Implement `calculateSettlement(input)` using integer Luna and stable membership-ID ordering.
- [x] Export settlement types and calculator from the domain package.
- [x] Run the focused tests and the full domain suite.

## Task 2: Immutable settlement persistence

**Files:**
- Modify: `packages/db/src/schema.ts`
- Create: `packages/db/src/settlement-repository.ts`
- Modify: `packages/db/src/repository.ts`
- Generate: `packages/db/migrations/0013_*.sql`
- Create: `packages/db/tests/phase5-settlement.integration.test.ts`

- [x] Write a failing integration test that seeds a proportional Pod with two roster members and terminal outcomes.
- [x] Assert one settlement run, one row per occurrence-member outcome, one entitlement per funded member, one payout leg per positive entitlement, an explicit `no_transfer_required` state for zero-Luna entitlements, and exact ledger conservation.
- [x] Add `settlement_runs`, `settlement_occurrences`, `settlement_outcomes`, and `settlement_entitlements`, including the terminal `no_transfer_required` entitlement state.
- [x] Expand transfer type to `refund | payout` and add balanced ledger movements for principal allocation, protection, forfeiture, bonus, restoration, and payout confirmation. Broadcast remains an event, never a ledger movement.
- [x] Implement `finalizePodSettlement(podId, now)` as one serialized transaction.
- [x] Treat absent and draft submissions as `missed`; reject settlement while any submission remains `reviewing`.
- [x] Hard-fail if the creator appears in the roster or if the exact applied deposit and accepted contract boundaries do not match.
- [x] Snapshot contract hash, calculator version, deterministic input digest, occurrence ordinal, source submission ID, and finalized deposit ID.
- [x] Make repeat finalization return the same immutable result without duplicate ledger rows or transfer legs.
- [x] Generate and inspect the additive Drizzle migration.
- [x] Run the focused integration test against the local Postgres service.

## Task 3: Lifecycle and worker settlement cycle

**Files:**
- Modify: `packages/db/src/activity-repository.ts`
- Create: `apps/worker/src/settlement/run-settlement-cycle.ts`
- Modify: `apps/worker/src/index.ts`
- Create: `apps/worker/tests/run-settlement-cycle.test.ts`
- Modify: `packages/db/tests/phase4-activity.integration.test.ts`

- [x] Write failing tests proving proportional Pods remain in `final_review` until settlement and full-refund Pods retain the existing completion behavior.
- [x] Write a failing worker test proving every ready proportional Pod is finalized independently and one failure does not block others.
- [x] Remove automatic `completed` transition for proportional Pods.
- [x] Add `listSettlementReadyPods()` and run deterministic finalization from the worker.
- [x] Gate the cycle with `PODS_SETTLEMENT_ENABLED`.
- [x] Keep room archival and public visitor history intact during final review.

## Task 4: Payout transfer execution and reconciliation

**Files:**
- Modify: `packages/db/src/transfer-repository.ts`
- Modify: `packages/db/src/schema.ts`
- Modify: `apps/worker/src/preflight/transfer-service.ts`
- Modify: `apps/worker/src/preflight/nimiq-signer.ts`
- Create: `apps/worker/src/settlement/payout-service.ts`
- Modify: `apps/worker/src/index.ts`
- Create: `apps/worker/tests/payout-service.test.ts`
- Modify: `apps/worker/tests/refund-service.test.ts`

- [x] Reproduce the identical-recipient, amount, and block-height hash collision.
- [x] Write a failing signer test proving distinct opaque payout references create distinct verified hashes without changing recipient or amount.
- [x] Write failing tests for prepare-before-broadcast, hash equality, confirmation, unknown broadcast, unknown chain recheck, execution failure, mismatch isolation, attempt expiry, and no blind rebroadcast.
- [x] Persist immutable transfer attempts and append-only transfer events under each logical payout leg.
- [x] Add payout-specific repository methods with the same guarded transitions already proven for refunds.
- [x] Persist signed bytes, transaction hash, and validity height before broadcast.
- [x] Record broadcast as an append-only transfer event and record the balanced payout ledger movement only at confirmation.
- [x] Use an opaque deterministic per-attempt data reference so identical payouts cannot share a transaction hash.
- [x] Mark a settlement `settled` and its Pod `completed` only after every positive payout is confirmed and every zero entitlement is `no_transfer_required`.
- [x] Keep refund and payout queries type-scoped so neither worker can mutate the other transfer kind.

## Task 5: Contract publication and disclosures

**Files:**
- Modify: `apps/web/src/lib/alpha-access.ts`
- Modify: `apps/web/src/app/api/pods/drafts/[podId]/preview/route.ts`
- Modify: `apps/web/src/app/api/pods/drafts/[podId]/publish/route.ts`
- Modify: `apps/web/src/app/pods/create/review/page.tsx`
- Modify: `apps/web/src/components/funding-commitment.tsx`
- Modify: `apps/web/src/app/pods/[podId]/rules/page.tsx`
- Modify: `apps/web/tests/alpha-access.test.ts`
- Add or modify focused route and component tests.

- [x] Write failing tests proving settlement-enabled public funding freezes `proportional` while refund-only mode freezes `full_refund_alpha`.
- [x] Make preview, review, and publish use the same server-derived settlement policy.
- [x] Disclose creator verification, principal protection, forfeiture redistribution, timeout protection, zero-recipient restoration, and Testnet custody before publication and funding.
- [x] Reject incompatible capability combinations before any contract or deposit intent is created.
- [x] Confirm old immutable contracts still render their original full-return language.

## Task 6: Participant and creator settlement surfaces

**Files:**
- Create: `apps/web/src/app/pods/[podId]/settlement/page.tsx`
- Create: `apps/web/src/components/settlement-summary.tsx`
- Create: `apps/web/src/app/api/pods/[podId]/admin/settlement/route.ts`
- Modify: `apps/web/src/app/pods/[podId]/admin/page.tsx`
- Modify: `apps/web/src/components/my-pods-list.tsx`
- Modify: `apps/web/src/app/today/page.tsx`
- Modify: `packages/db/src/waiting-room-repository.ts`
- Create focused component, route, and integration tests.

- [x] Write failing authorization and projection tests.
- [x] Expose only the participant's own entitlement, transfer state, and hash; the creator receives an aggregate conservation view without participant wallet addresses.
- [x] Show occurrence-by-occurrence approved, timeout-protected, rejected, missed, and zero-recipient restoration outcomes.
- [x] Add creator `Finalize now` only when every outcome is terminal; it calls the same repository command as the worker.
- [x] Route final-review and completed cards to the canonical settlement screen.
- [x] Ensure Today never shows more than one primary action.

## Task 7: Transfer operations and recovery

**Files:**
- Create: `apps/web/src/app/ops/transfers/page.tsx`
- Create: `apps/web/src/app/api/ops/transfers/route.ts`
- Create: `apps/web/src/app/api/ops/transfers/[legId]/retry/route.ts`
- Add repository methods and focused tests.

- [x] Write failing tests for unknown, retryable-failed, mismatched, late, and manual-review filters.
- [x] Require an authenticated operations session.
- [x] Require a fresh chain lookup and an expired or failed immutable attempt before a replacement attempt can be created.
- [x] Never expose private keys, raw signed bytes, wallet addresses, evidence object keys, or ledger account codes to participant DTOs.
- [x] Record every operations transition in immutable audit data.

## Task 8: End-to-end gate and branch completion

**Files:**
- Create: `validation/phase-5-results.md`
- Modify: `HANDOFF.md`
- Modify: `history/session-log.md`
- Add: `apps/web/tests/e2e/phase5-settlement.spec.ts`

- [x] Run focused RED/GREEN tests throughout Tasks 1 through 7.
- [x] Run `pnpm check` with local Postgres and object storage access.
- [x] Run mobile Safari and Android browser journeys for settlement views using a disposable migrated database.
- [x] Dry-run wallet-only payout behavior against the validated signer/RPC contract without broadcasting from automated tests.
- [ ] Physical Nimiq Pay gate: creator plus two participant wallets, one approved outcome, one rejected or missed outcome, deterministic bonus, two confirmed Testnet payouts, exact treasury conservation, and refresh-safe hashes.
- [x] Record automated, browser, dry-run, and physical evidence separately.
- [ ] Commit the branch only after the automated gate is green. Do not push or deploy without explicit authorization.

## Following branches

After this branch passes, create each from the previous approved branch:

1. `add/phase-template-activities`: complete distinct commitment and evidence flows for Fitness, Reading, Study, and Practice and Create instead of routing them through Build and Ship assumptions.
2. `add/phase-realtime-media`: complete durable room delivery, authorized Pod-shared media, and recovery behavior that remain partially capability-gated.
3. `add/phase-product-hardening`: finish operations, accessibility, privacy redaction, responsive state coverage, and complete route-state consistency.
4. `add/phase-release-gate`: run the full two-participant plus creator Nimiq Pay matrix, production configuration audit, treasury reconciliation, and competition-ready release proof.

Each following branch receives its own plan and cannot change a previously frozen contract or bypass its own automated and physical gate.
