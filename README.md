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

Phase 0 foundation is in progress. Product features are not yet available.

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
```

Open the printed LAN URL through Nimiq Pay Custom URL on a device connected to
the same Wi-Fi network.

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
- [[docs/design-reference/README|Locked design references]]

Licensed under the MIT License.
