---
project: pods
last-updated: 2026-07-28 10:09 IST
last-agent: codex
mode: PLAN
---

# Pods Handoff

Related: [[README]] |
[[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/03-actors-roles-and-jobs|Actor and role contract]] |
[[docs/mainnet-planning/04-object-graph-and-memberships|Object graph]]

## State

Testnet v0 remains frozen on `release/testnet-v0`. Mainnet planning is isolated
on `feat/rel-mainnet/planning-foundation`. Documents 01 through 03 are locked,
and Document 04 is the active object, relationship, ownership, membership, and
enrollment contract.

## In Progress

- Task: Resolve the 60-decision object graph and membership bundle.
- File: `docs/mainnet-planning/04-object-graph-and-memberships.md`
- Stop point: Document 04 is active with recommendations recorded. Await
  Abhinav's approval or numbered amendments before converting them into the
  locked graph contract.

## Open Errors / Blockers

- No active code or documentation error.
- Youth-account implementation cannot ship until age assurance, guardian
  consent, privacy defaults, contact restrictions, and jurisdiction handling
  pass the later compliance validation gate.
- Youth accounts are non-financial in the initial Mainnet product.

## Git State

- Branch: `feat/rel-mainnet/planning-foundation`
- Working tree: contains the Document 03 lock and active Document 04 planning
  checkpoint until it is committed.
- Mainnet is not deployed and no Mainnet fund movement is authorized.

## Next 3 Tasks

1. Receive approval or numbered amendments for Document 04.
2. Convert the approved bundle into the locked graph contract and run its
   cycle, duplication, ownership, and membership consistency review.
3. Begin `05-access-consent-and-visibility.md` only after Document 04 is
   locked.
