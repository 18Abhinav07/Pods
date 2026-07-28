---
project: pods
last-updated: 2026-07-28 13:16 IST
last-agent: codex
mode: PLAN
---

# Pods Handoff

Related: [[README]] |
[[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/26-integrated-mainnet-architecture|Integrated candidate architecture]] |
[[docs/mainnet-planning/27-validation-and-implementation-sequence|Validation sequence]]

## State

Testnet v0 remains frozen on `release/testnet-v0`. The complete Mainnet
planning candidate is on `feat/rel-mainnet/planning-foundation`: Documents 01
through 04 are locked and Documents 05 through 27 remain in review.

## In Progress

- Task: Reconcile Abhinav's Mainnet product plan against the candidate package.
- File: `docs/mainnet-planning/README.md`
- Stop point: the 27-document dependency package is internally consistent and
  awaiting product-scope reconciliation before any document after 04 can lock.

## Open Errors / Blockers

- Abhinav's Mainnet product plan must be mapped against the candidate package
  as agreement, amendment, contradiction, or deferred scope.
- Spike A must validate primary authentication and secondary identity linking.
- Spike B must validate GitHub App installation, work authorization,
  observation attribution, revocation, and reconciliation.
- Spike C must validate durable command, fact, outbox, replay, and
  idempotency behavior.
- Any selected financial slice must pass its custody, legal, signer, limit,
  reconciliation, environment-isolation, and physical-device gates.
- No implementation plan may be written until every spike required by the
  selected slice records PASS.

## Git State

- Branch: `feat/rel-mainnet/planning-foundation`
- Working tree: planning package ready for its documentation checkpoint.
- Testnet source and deployment branches remain unchanged.
- Mainnet is not deployed; no Mainnet fund movement is authorized.

## Next 3 Tasks

1. Map Abhinav's Mainnet product plan to Documents 01 through 27.
2. Select the smallest coherent Mainnet v1 promise and its required spikes.
3. Run those spikes, amend the affected documents, and lock only validated
   scope before writing an implementation plan.
