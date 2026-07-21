---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [pods, mini-app, nimiq, hackathon]
---

# Pods

Pods is a NIM-backed group activity accountability Mini App for Nimiq Pay.
Participants join a focused community, commit NIM upfront, submit evidence for
scheduled activities, and receive a deterministic settlement after centralized
Pods-team review.

## Current status

Phases 0 through 3 are physically approved. Phase 4 now implements the first
complete Build & Ship activity journey: occurrence activation, immutable task
commitment, private evidence, centralized Pods-team review, manual approval,
and connected participant projections. All automated Phase 4 gates pass. The
real Nimiq Pay activity walkthrough is the remaining Phase 4 approval gate.

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
ignored local treasury configuration, watches Nimiq RPC, and is the only
process allowed to finalize deposits, credit the ledger, apply cutoff, and sign
refunds. Signed refund bytes are persisted before broadcast and ambiguous
transfers are reconciled by hash before any retry.

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

Cycle I is custodial and centrally reviewed. It is not trustless, non-custodial,
or production-scale.

## Project references

- [[docs/implementation-plan|Phase 0 implementation plan]]
- [[validation/inbound-spike-manifest|Validated inbound deposit boundary]]
- [[validation/phase-3a-results|Phase 3A physical funding result]]
- [[validation/phase-3b-results|Phase 3B cutoff and refund gate]]
- [[validation/phase-4-results|Phase 4 activity gate]]
- [[docs/design-reference/README|Locked design references]]

Licensed under the MIT License.
