---
created: 2026-07-23
project: pods
ecosystem: nimiq
tags: [validation, visitor-room, privacy, moderation, railway]
---

# Public Visitor Role Validation

Related: [[HANDOFF]] | [[history/session-log]]

## Product Contract

A creator may opt a public V2 Pod into a public read-only room before
publication. After roster lock, visitors may read public room messages,
creator announcements, system events, and proof fields explicitly frozen as
public. Visitors cannot apply after cutoff, message, react, submit activity,
see reviewer-only evidence, see financial details, or alter authoritative Pod
state.

## Automated Result

PASS.

- V2 publication freezes `roomAudience` into the contract hash.
- Creator publication, public application, and participant funding flows
  disclose the visitor boundary before irreversible actions.
- Existing V1 Pods remain `members_only`.
- Anonymous reads use a dedicated public DTO and never return wallet addresses,
  user IDs, conversation IDs, object keys, reviewer evidence, or financial
  details.
- Private profiles receive a Pod-scoped contributor projection only.
- Proof images require an explicitly public submission and are blocked when
  content is suppressed.
- Reports require an authenticated session but not membership.
- Public suppression and room suspension never mutate messages, submissions,
  review outcomes, membership, or financial records.
- Durable rate-limit buckets use HMAC-derived opaque keys.
- Final-review and completed Pods retain permanent read-only archives for
  creators, members, and eligible visitors.
- Completed Pods no longer appear as current work on Today or as cancelled in
  My Pods.

Final repository gate:

- Copy lint: PASS with no U+2014 characters.
- Web: 77 files, 267 tests.
- Worker: 13 files, 48 tests.
- Domain: 9 files, 45 tests.
- Integration: 13 files, 57 tests.
- All typechecks and production builds: PASS.

## Local Browser Result

PASS for routes represented by real local data.

- Clean anonymous Chrome context.
- Mobile viewport: 390 by 844, touch enabled.
- Discover Open, Live, and Recent controls render as intentional compact
  lifecycle navigation.
- Public V1 preview renders without wallet connection.
- Template filters remain horizontally scrollable without clipping the page.
- Bottom navigation remains fixed to the safe-area edge.
- No browser console errors, warnings, or issues.
- Malformed canonical and room routes fail safely.

An active V2 visitor room was not fabricated through direct database edits, so
its browser route remains part of the physical matrix below.

## Railway Result

PASS.

- Project: `shimmering-empathy`
- Service: `Pods`
- Environment: `production`
- Domain: `https://pods-nimiq-activity.up.railway.app`
- Deployment: `86df48a4-e871-4661-8d53-a72c994c1b27`
- Terminal status: `SUCCESS`
- Predeploy database migrations applied.
- `/health/ready`: web, database, and evidence storage ready.
- `/`: HTTP 200.
- `/discover?stage=live`: HTTP 200.
- `/pods/not-a-pod/room`: HTTP 404.
- Visitor rooms, moderation, durable rate limits, and a production HMAC key
  are enabled.

## Physical Nimiq Pay Matrix

PENDING. Use the normal product flow only. Do not edit database timestamps.
Advance lifecycle time only through the audited Clock command.

### Setup

1. Wallet A creates a public Build and Ship Pod.
2. Wallet A enables `Visitors can watch after roster lock`.
3. Confirm the review step states that visitors can read the public room and
   public proofs but cannot interact or see private evidence or finances.
4. Wallet B applies, accepts the visitor disclosure, is accepted, and funds.
5. Complete the normal funding-finality and roster-lock path.

### Creator and participant checks

1. Wallet A and Wallet B open the same Pod room and retain full member controls.
2. Wallet B locks one commitment.
3. Wallet B submits a result, public artifact, one public supporting image, and
   separate reviewer-only evidence.
4. Wallet A can see the public room card but cannot see reviewer-only evidence.
5. The Pods reviewer can see the private reviewer layer.

### Visitor checks

1. Open the shared room URL in an anonymous browser or a signed-in nonmember
   context.
2. The room opens without application or funding controls.
3. Public messages, public proof summary, artifact, review status, and the
   public image are visible.
4. Reviewer-only evidence, wallet addresses, NIM amounts, and private
   participant consequences are absent.
5. No composer, reaction, reply, commitment, evidence, member list, or
   financial control is available.
6. A signed-in nonmember can report eligible public content.
7. Refresh and WebView closure preserve the same read-only route.

### Lifecycle checks

1. During final review, the room becomes an archive and remains readable.
2. After completion, creator, participant, and visitor routes still open the
   permanent archive.
3. Completed Pods appear under Recent, not Live.
4. Completed Pods do not create a Today action.

## Gate Decision

`AUTOMATED_BROWSER_DEPLOYED_PASS_PHYSICAL_V2_ROOM_PENDING`
