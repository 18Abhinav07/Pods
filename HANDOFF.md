---
project: pods
last-updated: 2026-07-24 06:00
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[validation/phase-5-results]] |
[[docs/superpowers/plans/2026-07-24-pods-settlement-payout]] |
[[docs/superpowers/specs/2026-07-24-pods-testnet-settlement-amendment]]

## State

Phase 5 deterministic settlement and Testnet payout execution are implemented
on the isolated `add/phase-settlement-payout` branch. The protected Phase 4
baseline remains unchanged.

The automated-green implementation is committed locally at `33e54ba`. No push
or Railway deployment has been performed.

Existing `full_refund_alpha` contracts preserve their original full-return
behavior. Newly published public-deposit contracts use proportional settlement
only when the settlement capability is enabled.

## Implemented

- Integer-Luna settlement calculator with conservation and deterministic
  remainder assignment.
- Immutable settlement runs, occurrence outcomes, member entitlements, ledger
  reclassification, payout legs, payout attempts, and transfer events.
- Approved, rejected, timeout-protected, missed, and zero-recipient-restoration
  behavior.
- Positive-only payout legs and terminal `no_transfer_required` zero
  entitlements.
- Persist-before-broadcast signing with a unique per-attempt data reference.
- Hash-first chain reconciliation, execution and macro-block finality checks,
  unknown isolation, expiry, and operations-authorized retry.
- Creator-review trust disclosure and exact contract-hash consent before
  proportional funding.
- Participant settlement, creator conservation, readiness-only finalization,
  transfer status, and operations recovery screens.
- Safe completion event delivery through the Pod conversation.

## Verified gates

- Full `pnpm check`: PASS.
- Copy and lint: PASS.
- All workspace typechecks: PASS.
- 491 root, package, worker, and web tests: PASS.
- 83 PostgreSQL integration tests: PASS.
- Web and worker production builds: PASS.
- Mobile Safari settlement journey: PASS.
- Android Chromium settlement journey: PASS.
- Protected local Testnet treasury non-broadcast dry run: PASS.
  - signer address matched configured treasury;
  - validity start height `6816989`;
  - two same-value drafts produced distinct hashes;
  - broadcasts `0`.

Full evidence: `validation/phase-5-results.md`.

## Physical gate pending

Run one creator and two participant wallets through a proportional Testnet Pod:

1. Both participants fund and enter the locked roster.
2. One occurrence is approved and one is rejected or missed.
3. Finalize the conserved settlement.
4. Run the worker and confirm the real low-value Testnet payout legs.
5. Verify participant hashes and terminal settlement states after WebView
   closure and reopen.
6. Verify exact ledger conservation and zero creator entitlement.

Do not mark Phase 5 physically approved before this matrix passes.

## Runtime

- Worktree: `/private/tmp/pods-phase-04a`
- Branch: `add/phase-settlement-payout`
- LAN server: `http://192.168.29.244:3411`
- Current LAN process uses explicit local-test access so disposable browser
  wallets can authenticate.
- Local Postgres migrations include `0013`, `0014`, and `0015`.

## Next tasks

1. Run and record the physical Nimiq Pay payout gate.
2. Repair and reverify any device-only defect exposed by that walkthrough.
3. Ask Abhinav for Phase 5 approval after the physical matrix passes.
4. Request explicit authorization before any push or deployment.
