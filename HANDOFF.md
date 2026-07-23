---
project: pods
last-updated: 2026-07-23 15:32
last-agent: codex
mode: HACKATHON
---

## State

The latest public visitor release and native-friendly Pods web metadata are
deployed. Production Postgres now contains the transaction-verified local
`Pods in Pods` graph, and the empty `Agentic commerce` test Pod is removed.

## In Progress (resume here)

- Task: make `Pods in Pods` lifecycle-ready without weakening its frozen contract.
- Production Pod: `430296c7-9554-43e6-9b43-bfd063391028`.
- Current graph: 1 application, 1 funded membership, 1 finalized 700 NIM
  deposit, 7 scheduled occurrences.
- File: `validation/spike-results.md` still contains the pending V2 visitor
  room device matrix.

## Open Errors / Blockers

- Production deposits are deliberately disabled:
  `PODS_DEPOSIT_MODE=off`, no web treasury address, and the only service runs
  as `PODS_SERVICE_KIND=web`.
- No dedicated Railway worker is deployed, so cutoff, occurrence activation,
  and reconciliation will not advance automatically.
- `Pods in Pods` is a V1 contract with no `roomAudience`. It remains public
  during enrollment but cannot become a visitor-readable V2 room after lock
  without violating the frozen participant contract.
- The database contradicts the reported two funded participants. Only one
  finalized 700 NIM deposit exists in both local and production ledgers.
- Nimiq Pay labels unknown custom Mini Apps by URL. The deployed site now
  publishes the correct `pods` manifest and icon set, but the native wallet
  tile still requires official Nimiq Pay list registration.
- Physical V2 room proof remains pending.
- Financial settlement and treasury payout features remain outside this release.

## Git State

- Product release commit: `7f43f49 feat: package pods native app identity`.
- `origin/main` and `origin/phase/04a-social-alpha-foundation` were synchronized before this handoff update.
- Railway deployment `3f8039ec-4b29-451a-9c29-b53d52269884`: `SUCCESS`.
- Production health, Discover, manifest, PNG icon, and public Pod route all
  passed read-back verification.

## Next 3 Tasks

1. Decide whether `Pods in Pods` remains V1 member-only after lock or is
   replaced with a new V2 visitor-enabled contract.
2. Provision a real Railway worker and safe production funding configuration
   before accepting another deposit.
3. Complete normal two-wallet funding, finality, cutoff, and the physical
   Nimiq Pay V2 room matrix.
