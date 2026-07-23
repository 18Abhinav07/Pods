---
project: pods
last-updated: 2026-07-23 16:05
last-agent: codex
mode: HACKATHON
---

## State

Pods is on a verified local and production clean slate. The latest V2 public
visitor release is deployed from the same commit as `origin/main`.

- Local Postgres: all 32 application tables are empty.
- Production Postgres: all 32 application tables are empty.
- Migration history: 12 Drizzle migrations preserved in both databases.
- Local evidence storage: no bucket or stored evidence exists.
- Production `pods-evidence` bucket: 0 objects, 0 bytes.
- Production Discover: empty state verified, with no stale `Agentic commerce`
  or `Pods in Pods` records.
- Existing sessions were intentionally removed. Every wallet must reconnect
  and complete profile onboarding again.

## In Progress (resume here)

- Task: create a new `Pods in Pods` contract using the current V2 flow.
- For a build-in-public Pod, choose Public activity and enable the
  visitor-readable room before freezing the contract.
- The creator can publish, share, review applications, and build the public
  visitor surface on the current deployment.
- File: `validation/spike-results.md` still contains the pending physical V2
  visitor room device matrix.

## Open Errors / Blockers

- Production NIM deposits are disabled:
  `PODS_DEPOSIT_MODE=off`, no treasury address, and no treasury private key.
- Railway contains only the Pods web service and Postgres. No dedicated
  worker is deployed, so deposit reconciliation, cutoff, occurrence
  activation, and later automation will not advance in production.
- Do not ask participants to send NIM until the worker and treasury
  configuration are deployed and verified with low-value Testnet funds.
- Nimiq Pay labels unknown custom Mini Apps by URL. The deployed site publishes
  the correct `pods` manifest and icon set, but the native wallet tile still
  requires official Nimiq Pay list registration.
- Financial settlement and treasury payout features remain outside this
  release.
- Physical V2 visitor-room proof remains pending.

## Git and Deployment State

- `HEAD`, `origin/main`, and
  `origin/phase/04a-social-alpha-foundation` are synchronized at session close.
- The integration gate serializes files because all integration suites share
  one local Postgres schema.
- Railway deployment `be2364f4-14f5-40d6-bdd4-83c779237ad6`: `SUCCESS`.
- Production health reports configuration, database, and evidence storage
  ready.
- Manifest name and short name are `pods`; the production PNG icon returns
  successfully.

## Next 3 Tasks

1. Reconnect the creator wallet, complete profile onboarding, and create the
   new V2 visitor-enabled `Pods in Pods` contract without funding it.
2. Provision and verify a dedicated Railway worker plus isolated Testnet
   treasury configuration before enabling deposits.
3. Complete the two-wallet funding, cutoff, occurrence, and physical Nimiq Pay
   visitor-room matrix.
