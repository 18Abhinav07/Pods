---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [validation, phase-3a, funding, testnet, physical-pass]
status: pass
---

# Phase 3A Funding Gate

Related: [[HANDOFF]] | [[validation/inbound-spike-manifest]] | [[docs/superpowers/plans/2026-07-19-phase-3-funding-reconciliation|Phase 3 plan]]

## Current verdict

`PASS`

Tasks 1 through 8 pass. Abhinav completed one real Nimiq Pay Testnet
commitment, confirmed that the credited state survived reopening, and approved
Phase 3B implementation on 2026-07-20.

## Automated evidence

- `pnpm check`: PASS.
- Copy gate: no U+2014 characters.
- Unit and component tests: 134 PASS.
- Live Postgres integration tests: 17 PASS.
- Phase 3 funding Playwright journey: 2 PASS, Mobile Safari and Android Chromium.
- Worker build and web production build: PASS.
- Live RPC parser probe against validated transaction
  `c800cff1...dc49c66`: exact 100,000 Luna, reference
  `pods-6032...f4f79`, network ID 5, execution true, block 6,407,464, batch
  56,258, current later batch observed.
- LAN health at `http://192.168.29.244:3411/`: HTTP 200.
- Local data readiness: `Pods MVP C1` has one `accepted_unfunded` membership.

## Physical evidence

- Device: Nimiq Pay on the physical phone over the LAN development URL.
- Pod: `Pods MVP C1`.
- Amount: `800000` Luna, exactly `8 NIM`.
- Transaction hash: `3e2cab0647655c2cfc63f1f9f858ede62c83259493c6bd786f3208b287c1a2c3`.
- Chain observation recorded at `2026-07-20 09:05:47.544+00`.
- Macro-batch finality recorded at `2026-07-20 09:06:12.299+00`.
- Provisional credit recorded at `2026-07-20 09:06:12.308+00`.
- Deposit state: `credited_provisional`.
- Membership state: `funded_provisional`.
- Deposit exception: none.
- Ledger: exactly one `deposit_credit` movement for `800000` Luna. Its
  idempotency key is the repository-enforced `deposit-credit:<intentId>` and
  remains bound to the single local intent record.
- Refresh result: the phone continued to show `Commitment credited` after the
  status route was reopened.
- Physical verdict: PASS, approved by Abhinav before Phase 3B began.

The opaque reference, intent UUID, participant wallet, and treasury secret are
retained in the local operational database. They are intentionally not copied
into this repository artifact. The transaction hash and exact amount provide
the public non-secret chain evidence.
