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
