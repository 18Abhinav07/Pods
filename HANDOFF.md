---
project: pods
last-updated: 2026-07-20 18:25
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[AGENTS]] | [[PRODUCT]] | [[validation/phase-3a-results]] | [[validation/phase-3b-results]] | [[docs/superpowers/plans/2026-07-19-phase-3-funding-reconciliation|Phase 3 plan]]

## State

Phase 0, Phase 1, Phase 2, and Phase 3A are physically approved. Phase 3B is
implemented and passes every automated gate. The only remaining Phase 3B gate
is the real Nimiq Pay phone cutoff and refund. Phase 4 must not begin before
that physical result is recorded as `PASS` in `validation/phase-3b-results.md`.

Phase 3B includes the audited Clock, serialized cutoff barrier, deterministic
roster lock, safe cancellation, Postgres-backed refund transfers, conservation
ledger confirmation, participant waiting room, creator-safe funding overview,
and canonical post-credit routing across Today and My Pods.

## Live Runtime

- Phone URL: `http://192.168.29.244:3411/`.
- PostgreSQL, MinIO, the web dev server, and the funding worker are running.
- `Pods MVP C1` is the only real public Pod and remains `enrollment_open`.
- The physical Phase 3A deposit remains `credited_provisional`; membership is
  `funded_provisional`.
- Real database safety snapshot after implementation: zero Clock events and
  zero refund transfer legs.
- Real cutoff: `2026-07-20T18:30:00.000Z`, midnight Asia/Kolkata.
- Current expected result: one funded participant is below the minimum of two,
  so cutoff should queue and execute one full `8 NIM` Testnet refund.

The running worker will apply the cutoff when effective time reaches it. Do not
run the audited Clock command early without Abhinav's explicit approval.

## Verification

- `pnpm check`: PASS.
- Copy gate: PASS, no U+2014 characters.
- Unit and component tests: 150 PASS.
- Live Postgres integration tests: 26 PASS.
- Worker and production web builds: PASS.
- Phase 3 mobile browser gate: 4 PASS.
- Combined Phase 1 through Phase 3 mobile regression: 16 PASS.
- Browser profiles: Mobile Safari and Android Chromium.
- Automated cutoff used a disposable database and port 3412. Both were removed
  after validation. The real database was never advanced by automation.

## Open Boundary

- Physical Phase 3B evidence is pending.
- The shared treasury remains a bounded custodial Testnet hot wallet. Its key
  stays only in ignored local configuration and must never be printed or
  committed.
- `mismatched`, `late`, `retryable_failed`, and `manual_review` transfer legs
  intentionally stop automatic execution for operations handling.
- Cycle I creator rows use participant-safe ordinal labels because public handle
  setup is not implemented yet. No wallet-derived label is shown.

## Git State

- Branch: `phase/03-funding`.
- Phase 3A evidence commit: `94f2150`.
- Audited Clock commit: `18195e6`.
- Cutoff and refund engine commit: `9dc8304`.
- Waiting room commit: `715e94c`.
- Task 14 browser evidence and documentation are ready for the final commit.

## Next 3 Tasks

1. Run or observe the real phone cutoff only with Abhinav present.
2. Verify the full `8 NIM` Testnet refund by transaction hash and record the
   physical evidence in `validation/phase-3b-results.md`.
3. Stop for Abhinav's approval. Begin Phase 4 only after Phase 3B is physically
   marked `PASS`.
