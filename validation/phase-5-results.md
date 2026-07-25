---
created: 2026-07-24
project: pods
ecosystem: nimiq
tags: [validation, phase-5, settlement, payout, testnet]
status: railway-testnet-core-live-broadcast-off
---

# Phase 5 Settlement and Payout Gate

Related: [[HANDOFF]] |
[[docs/superpowers/plans/2026-07-24-pods-settlement-payout]] |
[[docs/superpowers/specs/2026-07-24-pods-testnet-settlement-amendment]]

## Current verdict

`AUTOMATED, MOBILE BROWSER, AND PHYSICAL NIMIQ PAY PASS`

`RAILWAY TESTNET CORE LIVE`

`AUTOMATIC PAYOUT BROADCAST DISABLED PENDING EXPLICIT AUTHORIZATION`

The current Build and Ship lifecycle candidate implements consistent private
financial projections from funding through settlement and payout tracking. No
Mainnet behavior is authorized. The physical Testnet gate broadcast only the
explicitly approved participant payouts, verified their finality, and disabled
local payout broadcasting again. The same core is now deployed to Railway with
automatic payout broadcasting still disabled.

## 25 July core completion candidate

Branch `upgrade/build-ship-testnet-core` at implementation commit
`51a4b91a0c489b578dcab1f2de21e771faae0ae8` adds:

- one canonical participant and creator afterstate across Today, My Pods,
  Updates, Pod rooms, and settlement;
- private participant payout and refund projections with no public wallet or
  raw transaction data;
- permanent room access to the settlement afterstate for creators and locked
  participants;
- explicit prepared, confirming, delayed, failed, mismatched, late,
  manual-review, confirmed, and no-transfer payout presentation;
- creator-visible participant entitlements and transfer exceptions;
- refund-state isolation from proportional settlement routes;
- zero-recipient restoration and creator archive browser coverage.

The final repository gate passed on 25 July 2026:

- Root tests: 6 PASS.
- Domain tests: 86 PASS.
- UI tests: 4 PASS.
- Database unit tests: 10 PASS.
- Worker tests: 70 PASS.
- Web tests: 523 PASS.
- PostgreSQL integration tests: 94 PASS across 15 files.
- ESLint, copy, all workspace typechecks, worker build, and Next.js production
  build: PASS.
- Independent post-fix review: PASS with no remaining Critical or Important
  implementation finding.

The final mobile browser matrix passed:

- Funding, roster lock, exclusion, cancellation, and refunds: 4 of 4 across
  Mobile Safari and Android Chromium.
- Creator, participant, visitor, proportional settlement, payout afterstate,
  and zero-recipient restoration: 4 of 4 across Mobile Safari and Android
  Chromium.

This candidate is merged into `main`, pushed, and deployed to both Railway
services. The remaining gates are explicit authorization for persistent
automatic Testnet payout broadcasting and a remote Nimiq Pay smoke journey.

## Prior Testnet release hardening and staged deployment

Release candidate `upgrade/testnet-rewards` at
`1c4ae201e607e1b3e631074f274144d921be279f` adds:

- independent fail-closed controls for new deposit intake, proportional
  publication, settlement calculation, payout broadcast, legacy refunds, and
  the financial incident pause;
- reconciliation-only worker behavior while new signing and broadcast are
  disabled;
- an explicit saved-draft creator state while publication is paused;
- exact web and worker runtime identity using a full release commit;
- database readiness tied to both the latest Drizzle migration timestamp and
  its SHA-256 hash;
- a visible `Testnet beta` marker on the public, connected, creation, and Pod
  room shells.

The hardened full gate passed:

- Root tests: 6 PASS.
- Domain tests: 86 PASS.
- UI tests: 3 PASS.
- Database unit tests: 10 PASS.
- Worker tests: 70 PASS.
- Web tests: 448 PASS.
- PostgreSQL integration tests: 91 PASS.
- Lint, copy, all workspace typechecks, worker build, and Next.js production
  build: PASS.
- Independent post-fix review: PASS with no remaining safety, authorization,
  lifecycle, readiness, or secret-leakage finding.

The clean release candidate was pushed to GitHub and deployed with payout
broadcast still disabled:

- Web deployment `bce1a1fe-454e-4265-a153-be8b51600c24`: `SUCCESS`.
- Worker deployment `d17e7e7b-34d7-41e8-8085-82d7c78e7c62`: `SUCCESS`.
- Live web readiness: configuration, database, evidence storage, and schema
  all `ready`.
- Live runtime: `testnet`, `nimiq-testnet`, commit `1c4ae201e607`, schema
  `0017_robust_loners`.
- Live 390 px browser inspection: PASS with no console warnings.

Before and after deployment, production contained one unchanged active
`full_refund_alpha` Pod, two confirmed refund legs, zero settlement runs, and
zero payout legs. New proportional publication and settlement processing are
enabled for the physical gate. New payout signing and broadcast remain
disabled until the settlement snapshot is inspected.

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

## Physical Testnet gate

The complete physical gate passed with Pod
`5638572a-7e78-4258-bf03-e6527846e187`.

- Two participants each funded 0.3 Testnet NIM.
- Occurrence 1 settled approved/approved.
- Occurrence 2 settled approved/missed.
- Occurrence 3 settled missed/missed after User 1 locked a commitment without
  submitting proof.
- Day 3 correctly closed with no bonus recipient and restored both missed
  slices to their original owners.
- The immutable settlement conserved exactly 60,000 Luna.
- Abhinav inspected and explicitly approved entitlements of 40,000 Luna for
  User 1 and 20,000 Luna for User 2 before broadcast.
- User 1 transaction
  `55b86a13fdbe8c71cb7bb8749f0b0b679c8836d753c868e68f1514268a84e8c1`
  executed successfully and finalized at Testnet block `6959461`.
- User 2 transaction
  `e2bae3f34f81763e9423cb4ce3b07f8a68171e8018d11835f57212bf120cecdf`
  executed successfully and finalized at Testnet block `6959462`.
- Terminal state is Pod `completed`, settlement `settled`, two confirmed
  entitlements, two payout ledger rows totaling 60,000 Luna, zero open payout
  or refund legs, and zero creator transfers.
- A later broadcast-disabled worker cycle preserved exactly two transfer
  attempts and two confirmed payout rows, proving idempotency.

The underfilled cancellation path also passed independently: the only funded
participant received the exact 10,000 Luna refund and the unfunded participant
received no transfer.

## Railway release

- GitHub `main` and `upgrade/build-ship-testnet-core` contain the physically
  approved release through
  `06ccae8f4da4927eb9f7d0293eb553615eaaae3f`.
- Web deployment `ad16e9f3-5acf-444b-9604-1b7da1485e82`: `SUCCESS`.
- Worker deployment `0f2b94d7-fdf9-41fd-b742-2df303ffb4d7`: `SUCCESS`.
- Live web readiness reports configuration, database, evidence storage, and
  schema `ready`, runtime `06ccae8f4da4`, and schema
  `0017_robust_loners`.
- The worker deployment passed Railway's `/health/ready` gate on the exact
  source commit.
- Railway runs Nimiq Testnet with public deposits, proportional publication,
  settlement, cancellation refunds, and the financial incident circuit
  breaker configured.
- The worker treasury address and private signer are present; the private
  signer is absent from the web service.
- The pre-enable production safety audit found two confirmed historical
  refunds, zero open payouts, zero open refunds, zero payout exceptions, one
  active Pod, and zero settlement runs.
- `PODS_PAYOUT_BROADCAST_ENABLED=false` remains confirmed on web and worker.
- Enabling persistent automatic payout broadcasting was not attempted after
  the authorization boundary was enforced.
- No Mainnet transaction was prepared or broadcast.
