---
project: pods
last-updated: 2026-07-23 14:20
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[validation/spike-results]] | [[history/session-log]]

## State

The approved public visitor role is implemented end to end, automated-pass,
mobile-browser-pass where current local data permits, and deployed-pass.

The release adds the V2 frozen Pod contract, opt-in public read-only rooms,
public proof sharing, anonymous room reads, scoped contributor identities,
reports, reversible public-content suppression, room suspension, durable
rate limits, and permanent final-review/completed archives. Financial,
membership, evidence-review, and payout authority remain separate from the
public room.

## Deployed

- Project: `shimmering-empathy`
- Service: `Pods`
- Environment: `production`
- Domain: `https://pods-nimiq-activity.up.railway.app`
- Deployment: `86df48a4-e871-4661-8d53-a72c994c1b27`
- Railway status: `SUCCESS`
- Migrations: `0010_watery_wasp.sql` and `0011_salty_tarot.sql` applied
- Production flags:
  - `PODS_PUBLIC_VISITOR_ROOMS_ENABLED=true`
  - `PODS_MODERATION_ENABLED=true`
  - `PODS_RATE_LIMITS_ENABLED=true`
  - `PODS_RATE_LIMIT_HMAC_SECRET` present

## Verification

- Final `pnpm check`: PASS
- Copy lint: PASS, no U+2014 characters
- Web: 77 files, 267 tests
- Worker: 13 files, 48 tests
- Domain: 9 files, 45 tests
- Integration: 13 files, 57 tests
- Web and worker production builds: PASS
- Local anonymous mobile Discover and public preview at 390 by 844: PASS
- Browser console warnings/errors: none
- Production readiness: web, database, and evidence storage ready
- Production landing: HTTP 200
- Production Live directory: HTTP 200
- Production malformed room: HTTP 404

## Remaining Proof Boundary

The local and production databases do not contain an active V2 visitor-enabled
Pod. No record was bypass-seeded for a demo. Therefore, the actual public room
must still be walked through inside Nimiq Pay after a V2 Pod reaches roster
lock through the normal application, funding, finality, cutoff, and audited
Clock flow.

This is a physical-device proof gap only. The visitor room component, public
DTO, proof privacy, contributor projection, report path, moderation separation,
rate limits, lifecycle archive, and terminal-state projections are all covered
by automated tests.

## Next 3 Tasks

1. Create one new public V2 Pod with visitors enabled.
2. Complete the two-wallet roster-lock path and run the physical matrix in
   `validation/spike-results.md`.
3. Record PASS or the exact WebView-only defect before announcing the public
   room to the community.
