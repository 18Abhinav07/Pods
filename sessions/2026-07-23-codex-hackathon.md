---
created: 2026-07-23
project: pods
ecosystem: nimiq
tags: [session, codex, hackathon]
---

# 2026-07-23 Public Visitor Release

Related: [[HANDOFF]] | [[sessions/INDEX]]

## Completed

- Froze opt-in visitor access into the V2 Pod contract and consent flow.
- Added strict public room, proof-image, and contributor projections.
- Added authenticated reports, reversible public suppression, room suspension,
  append-only moderation history, and durable HMAC-keyed rate limits.
- Preserved member and creator access through final review and completion.
- Corrected the mobile Discover lifecycle navigation after browser inspection.
- Deployed migrations 0010 and 0011 and enabled visitor, moderation, and
  rate-limit capabilities in Railway production.
- Synchronized the feature branch and main without force-pushing over the
  user's separate workflow deletion.

## Decisions

- Visitor access is opt-in, public-read-only, and frozen before publication.
- Public projections are separate allowlisted DTOs, never filtered copies of
  member or reviewer records.
- Moderation can hide only the public projection and cannot mutate activity,
  review, membership, or financial authority.
- A completed Pod room is a permanent archive.

## Verification

- Final `pnpm check`: PASS.
- Web: 267 tests.
- Worker: 48 tests.
- Domain: 45 tests.
- Integration: 57 tests.
- Anonymous mobile Discover and public preview: PASS at 390 by 844.
- Production deployment `86df48a4-e871-4661-8d53-a72c994c1b27`: SUCCESS.
- Production readiness and route probes: PASS.

## Open

- The physical Nimiq Pay walkthrough of an active V2 public room remains
  pending. No production or local record was bypass-seeded to fake this proof.

## Phase 4 Funding Release

### Completed

- Polished profile saving, Pod audience selection, and creator application
  identity.
- Corrected the production worker module runtime and added a regression check.
- Installed the explicitly authorized Testnet treasury signer only on the
  dedicated Railway worker.
- Enabled the public web funding surface in `allowlist_refund_only` mode.
- Deployed web and worker from commit `e93c55f`.

### Verification

- Full `pnpm check`: PASS.
- Web deployment `b0d2e841-d0a5-43db-9f2a-ca63224c918d`: `SUCCESS`.
- Worker deployment `de570b13-dd66-4e8c-939b-f7fc177f333c`: `SUCCESS`.
- Live health, capabilities, and Discover probes: PASS.
- Web and worker startup/cycle error logs: clean.

### Remaining

- Run one real two-wallet funding journey in Nimiq Pay. This cannot be replaced
  by automated browser proof because each transaction requires the user's
  wallet confirmation.
