---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [validation, phase-3a, funding, testnet, pending-physical]
status: pending-physical
---

# Phase 3A Funding Gate

Related: [[HANDOFF]] | [[validation/inbound-spike-manifest]] | [[docs/superpowers/plans/2026-07-19-phase-3-funding-reconciliation|Phase 3 plan]]

## Current verdict

`AUTOMATED PASS, PHYSICAL DEVICE PENDING`

Tasks 1 through 7 and the automated portion of Task 8 pass. Phase 3B remains
blocked until Abhinav completes one real Nimiq Pay Testnet commitment and
approves the phone flow.

## Automated evidence

- `pnpm check`: PASS.
- Copy gate: no U+2014 characters.
- Unit and component tests: 117 PASS.
- Live Postgres integration tests: 17 PASS.
- Phase 3 funding Playwright journey: 2 PASS, Mobile Safari and Android Chromium.
- Worker build and web production build: PASS.
- Live RPC parser probe against validated transaction
  `c800cff1...dc49c66`: exact 100,000 Luna, reference
  `pods-6032...f4f79`, network ID 5, execution true, block 6,407,464, batch
  56,258, current later batch observed.
- LAN health at `http://192.168.29.244:3411/`: HTTP 200.
- Local data readiness: `Pods MVP C1` has one `accepted_unfunded` membership.

## Physical evidence to record

After the device run, add the intent ID, redacted reference, transaction hash,
exact Luna amount, observation block and batch, later finality batch, ledger
idempotency key, refresh result, and Abhinav's PASS or exact blocker. Never add
the treasury private key.
