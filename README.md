---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [pods, mini-app, nimiq, hackathon]
---

# Pods

Pods is a NIM-backed group activity accountability Mini App for Nimiq Pay.
Participants join a focused community, commit NIM upfront, submit evidence for
scheduled activities, and receive a deterministic settlement after disclosed
creator review.

## Current status

The Build and Ship Testnet journey is implemented from public enrollment and
upfront funding through occurrence commitments, creator-reviewed proof,
deterministic proportional settlement, and durable payout tracking. The
automated repository, mobile-browser, cancellation-refund, and physical
two-wallet payout gates pass. The verified physical lifecycle conserved the
complete 0.6 NIM pool, finalized both participant payouts, transferred nothing
to the creator, and remained idempotent on later worker cycles. Railway release
and remote smoke verification remain pending.

## Local development

Requirements:

- Node.js 22
- Corepack
- Docker Desktop
- Nimiq Pay with Testnet enabled

```bash
corepack pnpm install
corepack pnpm services:up
corepack pnpm check
corepack pnpm dev:lan
corepack pnpm dev:worker
```

Open the printed LAN URL through Nimiq Pay Custom URL on a device connected to
the same Wi-Fi network.

The web process reads only the Testnet treasury address. The worker reads the
protected treasury signer, watches Nimiq RPC, and is the only process allowed
to finalize deposits, credit the ledger, apply cutoff, calculate automatic
settlement, or prepare financial transfers. Signed transfer bytes are
persisted before broadcast and ambiguous transfers are reconciled by hash
before any retry.

## Phase 0 outbound preflight

Generate or inspect the local Testnet treasury and verify the RPC connection:

```bash
corepack pnpm --filter @pods/worker preflight:generate
corepack pnpm --filter @pods/worker preflight:rpc
```

Fund the printed address with Testnet NIM. Then prepare, persist, and broadcast
one small transfer to a physical Nimiq Pay Testnet wallet:

```bash
corepack pnpm --filter @pods/worker preflight:send -- "NQ recipient" 1000
corepack pnpm --filter @pods/worker preflight:reconcile -- "transaction hash"
```

To validate an unknown broadcast response without risking a duplicate send, add
`--simulate-unknown` to the send command. The reconciliation command only looks
up the persisted hash. It never broadcasts again.

## Trust boundary

Cycle I is custodial and creator-reviewed. The creator does not fund and cannot
receive participant funds. It is not trustless, non-custodial, or
production-scale.

## Project references

- [[docs/implementation-plan|Phase 0 implementation plan]]
- [[validation/inbound-spike-manifest|Validated inbound deposit boundary]]
- [[validation/phase-3a-results|Phase 3A physical funding result]]
- [[validation/phase-3b-results|Phase 3B cutoff and refund gate]]
- [[validation/phase-4-results|Phase 4 activity gate]]
- [[validation/phase-5-results|Testnet settlement and payout gate]]
- [[docs/superpowers/plans/2026-07-25-build-ship-testnet-core|Build and Ship core completion plan]]
- [[docs/design-reference/README|Locked design references]]

Licensed under the MIT License.
