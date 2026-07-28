---
created: 2026-07-28
project: pods
ecosystem: nimiq
tags: [testnet, proof-review, clarification, appeal, reconciliation]
status: approved-for-implementation
---

# Pods Testnet Proof Reconciliation and Appeal Amendment

Related: [[HANDOFF]] |
[[docs/superpowers/specs/2026-07-23-pods-creator-review-mvp-design]] |
[[docs/superpowers/specs/2026-07-24-pods-testnet-settlement-amendment]]

## Purpose

This amendment replaces terminal first-decision rejection for newly published
Testnet Pods with a bounded, auditable Proof Review Thread. It preserves the
creator as reviewer for the Testnet MVP while giving a participant one chance
to clarify evidence and one chance to appeal a provisional rejection.

Existing published V1 and V2 contracts keep their frozen no-appeal behavior.
Only newly published V3 contracts opt into this protocol.

## Authority boundary

- The Pod creator is the reviewer.
- The reviewer is not automatically followed, friended, or added to a direct
  message conversation.
- Review communication lives in a private, structured Proof Review Thread.
- Pod-room replies may provide advisory member context when the participant
  explicitly shares review context with the Pod.
- Member comments never approve, reject, reverse, or settle a submission.
- The same creator reconsiders an appeal in this Testnet protocol. The product
  does not promise an independent reviewer.

## Canonical states

Submission states are:

`draft -> reviewing -> approved | rejected | timeout_protected | grace`

ProofCase stages are:

`initial_review -> awaiting_clarification -> post_clarification_review -> appeal_open -> appeal_review -> resolved`

A provisional rejection does not write `submission.state = rejected`. The
submission remains `reviewing` until the participant accepts the rejection,
the appeal window expires, or an appeal resolves to rejection.

## Deadlines

- Review target: 12 hours.
- Initial-review hard timeout: 24 hours.
- Clarification response window: 12 hours.
- Post-clarification reviewer window: 12 hours.
- Appeal-open window: 12 hours.
- Appeal-review window: 12 hours.
- Absolute ProofCase cap: 72 hours from submission.

The absolute cap wins over every derived deadline.

## Timeout outcomes

- Reviewer misses the initial or post-clarification deadline:
  `timeout_protected`.
- Participant misses the clarification response deadline: provisional
  rejection with an appeal window.
- Participant does not appeal before the appeal deadline: `rejected`.
- Reviewer misses the appeal decision deadline: `grace`.
- Any still-open case at the 72-hour cap: `grace`, except a case still waiting
  for its first reviewer action resolves as `timeout_protected`.

## Participant actions

A participant may:

- answer one clarification request with a note and optional replacement
  evidence;
- accept a provisional rejection immediately;
- file one appeal with a reason and optional supporting evidence;
- share a sanitized rejection or appeal summary with the Pod;
- create a linked recovery commitment in a later open occurrence.

The participant cannot overwrite the original submission or its frozen proof
versions. Recovery work is a new commitment and never rewrites the prior
financial outcome.

## Reviewer actions

The reviewer may:

- approve with an optional note;
- request clarification once, with structured reason, requested change, and
  optional reference fields;
- provisionally reject with a required category, detailed reason, unmet
  criteria, and suggested correction;
- approve, reject, or grant grace after an appeal.

Every action is validated against actor, case stage, deadline, and immutable
contract version.

## Evidence reservation

To protect submissions started just before an occurrence closes, a participant
may reserve an evidence upload before the deadline.

- The server records the occurrence, membership, expected media hash, frozen
  evidence digest, reservation time, and expiry.
- The reservation expires 10 minutes after the occurrence closes.
- A reservation cannot change the locked commitment or proof summary.
- The final media must match the expected hash.
- A reservation created after occurrence close is invalid.
- An expired or mismatched reservation cannot create a submission.

This is an upload-completion grace period, not extra time to invent or change
the proof.

## Financial semantics

- `approved`: principal returned, bonus eligible, streak completed.
- `timeout_protected`: principal returned, not bonus eligible, streak completed.
- `grace`: principal returned, not bonus eligible, neutral for streak and
  completion-rate denominator.
- `rejected`: occurrence slice forfeited and streak broken.
- `missed`: occurrence slice forfeited and streak broken.

Settlement remains blocked while any submission is `reviewing`. Provisional
rejection therefore cannot settle early.

## Privacy projections

Participant and reviewer see the full Proof Review Thread.

Other locked members see only:

- the normal public-within-Pod proof card;
- the terminal review state;
- advisory room replies;
- sanitized review context explicitly shared by the participant.

Visitors see only the already approved public proof projection and terminal
status. They never receive clarification text, rejection details, appeal text,
private media, private notes, or financial consequences.

## Audit and idempotency

- Proof review events are immutable and sequenced per case.
- Every mutation has an idempotency key.
- Submission versions are immutable snapshots.
- Terminal review decisions remain a one-row projection used by settlement.
- A transaction locks both the submission and ProofCase before validating and
  applying a transition.
- Notification and realtime rows are delivery projections, never lifecycle
  truth.

## Compatibility

- V1 and V2 contracts retain the old direct review decision flow.
- V3 freezes the reconciliation protocol and all durations into the published
  contract hash.
- Existing submissions are not backfilled into ProofCases.
- Missing ProofCase data always means legacy behavior, not partial migration.

