---
project: pods
last-updated: 2026-07-28 09:16 IST
last-agent: codex
mode: PLAN
---

# Pods Handoff

Related: [[README]] |
[[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/01-person-account-and-identity|Identity contract]]

## State

Testnet v0 remains frozen on `release/testnet-v0`. Mainnet planning is isolated
on `feat/rel-mainnet/planning-foundation`, and Document 01 is now the locked
canonical person, authentication, recovery, lifecycle, session, and age-tier
contract.

## In Progress

- Task: Resolve the 32-decision profile, facet, and privacy bundle.
- File: `docs/mainnet-planning/02-profile-facets-and-privacy.md`
- Stop point: Document 02 is active with recommendations recorded. Await
  Abhinav's approval or numbered amendments before converting them into the
  locked profile contract.

## Open Errors / Blockers

- No active code or documentation error.
- Youth-account implementation cannot ship until age assurance, guardian
  consent, privacy defaults, contact restrictions, and jurisdiction handling
  pass the later compliance validation gate.
- Youth accounts are non-financial in the initial Mainnet product.

## Git State

- Branch: `feat/rel-mainnet/planning-foundation`
- Working tree: clean after the identity-lock checkpoint is committed.
- Mainnet is not deployed and no Mainnet fund movement is authorized.

## Next 3 Tasks

1. Receive approval or numbered amendments for Document 02.
2. Convert the approved bundle into the locked profile contract and run its
   privacy consistency review.
3. Begin `03-actors-roles-and-jobs.md` only after Document 02 is locked.
