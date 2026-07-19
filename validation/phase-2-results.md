---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [validation, phase-2, enrollment, applications, invitations]
---

# Phase 2 Validation Results

Related: [[HANDOFF]] | [[validation/phase-1-results]] | [[validation/phase-2-spike-results]] | [[docs/superpowers/plans/2026-07-19-phase-2-enrollment|Phase 2 plan]]

## Scope

This checkpoint covers public discovery, public applications, creator decisions,
private invitation acceptance, enrollment-aware personal surfaces, and the guarded
Phase 3 funding handoff. It does not create deposit intents, send NIM, lock a roster,
collect evidence, settle a Pod, or broadcast payouts.

## Automated result

PASS.

- Public discovery returns only frozen, public, enrollment-open Pods.
- Private and unknown Pods share the same public unavailable surface.
- Applications snapshot the frozen creator questions and derive the applicant from the signed session.
- Only the creator can make a terminal accept or reject decision.
- Accepted participants reach `accepted_unfunded`; acceptance does not reserve capacity.
- Private invitations are opaque, expiring, revocable, single-use, and atomically consumed.
- Today prioritizes accepted funding, creator review, public recruiting, then discovery.
- My Pods separates participant and creator roles.
- Rules is restricted to the creator or an accepted participant.
- The funding handoff contains no transaction control and explicitly states that Phase 2 requests no NIM.

## Verification evidence

- Lint and no-U+2014 copy gate: PASS
- Workspace typecheck: PASS
- Unit and component tests: 60 PASS
- Live PostgreSQL integration tests: 12 PASS
- Production build: PASS
- Full mobile browser suite: 16 of 16 PASS
- Phase 2 two-wallet mobile journeys: 4 of 4 PASS across Safari and Android profiles

## Invitation bearer hardening

The planned `/invite/:token` route was rejected during the security gate because
Next.js and hosting access logs record request paths. The one-tap share URL is now
`/invite#token`. Browser fragments are not sent in HTTP request paths. Preview and
acceptance send the bearer in a JSON request body to fixed endpoints.

Runtime evidence from the clean LAN test contains only:

- `GET /invite`
- `POST /api/invitations/preview`
- `POST /api/invitations/accept`
- `GET /invite/unavailable` after replay

No bearer appeared in those request paths. PostgreSQL reported 33 invitation rows,
all with a 64-character `token_hash`. The table has no raw-token column.

## Security assertions

- Non-creators receive the same 404 surface for creator administration as an unknown path.
- Client requests cannot select an applicant, creator, application state, or membership state.
- Application decisions lock and transition only an `applied` row.
- Concurrent use of one private invite produces exactly one accepted membership.
- Revoked, expired, malformed, used, and replayed invitations converge on the same unavailable state.
- Source scanning found no Nimiq transaction, deposit-intent, treasury, or payment broadcast implementation in the Phase 2 web/API surface.

## Physical gate

PASS. Abhinav explicitly accepted the complete Phase 2 phone checkpoint on
2026-07-19 after the creator self-application path, historical test fixtures,
and application-review action contrast were corrected and reverified.

The approved checkpoint covered:

1. Public discovery and template filtering.
2. Application submission from a second wallet.
3. Creator application review and acceptance.
4. Accepted participant Today, My Pods, Rules, and funding-boundary screens.
5. Private link creation, sharing, connection, consent, and acceptance.
6. Used-link replay showing the generic unavailable screen.
7. Mobile spacing, motion, back navigation, and touch behavior.

The Phase 2 approval gate is closed. Phase 3 funding and reconciliation may now
proceed through its own plan, validation, implementation, and phone checkpoint.
