---
project: pods
last-updated: 2026-07-19 23:31
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[AGENTS]] | [[docs/implementation-plan]] | [[validation/phase-3a-results]] | [[docs/superpowers/plans/2026-07-19-phase-3-funding-reconciliation|Phase 3 plan]]

## State

Phase 0, Phase 1, and Phase 2 are physically approved. Phase 3A Tasks 1 through
7 are implemented on `phase/03-funding`. The automated Task 8 gate passes and
the real Nimiq Pay Testnet commitment is the only open Phase 3A checkpoint.
Phase 3B cutoff, roster lock, and refunds have not started.

## In Progress (resume here)

- Phone URL: `http://192.168.29.244:3411/`.
- Web dev session was started after `.env.local` loaded the non-secret Testnet
  treasury address.
- Worker dev session is independently polling local Postgres and Nimiq Testnet
  RPC.
- `Pods MVP C1` has one `accepted_unfunded` membership ready to test.
- On the accepted member wallet, open Today, continue to funding, review the
  disclosures, accept the frozen terms, and commit the displayed NIM amount.
- Wait for the rail to reach `Commitment credited`, close and reopen the
  Mini App, and verify the same intent, hash, and credited state remain.

## Open Errors / Blockers

- No automated Phase 3A error is open.
- Physical Nimiq Pay Testnet approval is pending.
- Phase 3B is intentionally blocked until the physical Phase 3A verdict is PASS.
- The shared treasury remains a bounded custodial Testnet hot wallet. Its key
  stays only in ignored `.runtime` storage and must never be printed or committed.

## Verification

- `pnpm check`: PASS.
- Copy gate: PASS, no U+2014 characters.
- Unit and component tests: 117 PASS.
- Live Postgres integration tests: 17 PASS.
- Phase 3 funding Playwright: 2 PASS across Mobile Safari and Android Chromium.
- Live known-transaction RPC parser probe: PASS.
- LAN root health: HTTP 200.

## Git State

- Branch: `phase/03-funding`.
- Latest implementation commit before the Task 8 checkpoint: `cd23855`.
- Task 8 automated and route-guard changes are ready to commit.
- Safe ignored local web configuration exists at `apps/web/.env.local`.

## Next 3 Tasks

1. Complete the real phone deposit and capture the finality and ledger evidence.
2. Record Abhinav's Phase 3A PASS in `validation/phase-3a-results.md` and commit it.
3. Only after PASS, begin Task 9, the audited local Clock for Phase 3B.
