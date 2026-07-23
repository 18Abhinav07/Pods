---
created: 2026-07-23
project: pods
ecosystem: nimiq
tags: [design, phase-4, creator-review, proof, mvp]
---

# Pods Creator Review MVP Design

Related: [[HANDOFF]] |
[[docs/superpowers/specs/2026-07-21-pods-social-alpha-amendment]]

## 1. Purpose

Cycle I uses a simple group authority model:

- The Pod creator is the admin and proof verifier.
- The creator does not fund the Pod.
- The creator does not submit participant commitments or proofs.
- The creator does not receive returns, bonuses, forfeitures, or payouts.
- Funded members participate and submit proofs.

The current centralized “Pods team review” model is replaced for newly
published Pods. In user-facing language, “Pods team” means the platform
developers and must not be used as a synonym for the Pod creator.

## 2. Locked MVP Contract

Every new frozen Pod contract records:

```ts
verification: {
  verifier: "creator";
  targetReviewHours: 12;
  timeoutProtectionHours: 24;
}
```

The funding disclosure states:

> The Pod creator reviews member proofs. The creator does not fund this Pod or
> receive any member funds.

The creator remains outside the membership and financial ledgers. Roster
capacity, minimum-participant checks, deposit totals, refunds, and later payout
calculations include funded members only.

## 3. Review Lifecycle

The Phase 4 lifecycle is:

```text
draft -> reviewing -> approved | rejected | timeout_protected
```

- A successful proof submission atomically stores the submitted timestamp,
  enters `reviewing`, and sets the hard review deadline. The creator does not
  need to open or acknowledge the proof before the timeout clock starts.
- `approved`, `rejected`, and `timeout_protected` are terminal and immutable.
- Approve records a fixed `meets_commitment` reason. An optional creator note
  may be added.
- Reject requires a plain-language reason between 12 and 500 characters.
- There is no clarification round, dispute, appeal, peer vote, or second
  reviewer in this MVP.
- If the creator does not decide within 24 hours, the worker atomically moves
  the submission from `reviewing` to `timeout_protected`. This is not presented
  as creator approval. It counts as completed for progress and streaks so an
  inactive creator cannot lock or penalize a member.
- Review outcomes affect completion and streak presentation.
- Phase 4 remains full-refund alpha, so approval or rejection cannot redirect
  money to the creator or another member.

## 4. Authorization

All creator review operations use the connected Nimiq wallet session.

The server must:

1. derive the acting user from the signed session;
2. load the submission and its Pod;
3. verify `pod.creatorUserId === session.userId`;
4. verify that the submission is still `reviewing`;
5. apply exactly one terminal decision in a transaction;
6. append the review decision and realtime event.

Client-provided creator IDs, reviewer IDs, Pod IDs, or authority flags are not
trusted.

The creator may review only submissions belonging to their own Pod. A member
cannot review any submission. A visitor cannot access review routes.

## 5. Proof Privacy

The persisted internal value `reviewer_only` may remain for migration
compatibility, but all user-facing copy becomes `Creator only`.

Access rules:

| Proof data | Submission owner | Pod creator | Other member | Visitor |
|---|---:|---:|---:|---:|
| Result summary and artifact | Yes | Yes | According to Pod sharing rules | According to public sharing rules |
| Pod-shared image | Yes | Yes | Yes | Only when explicitly public |
| Creator-only evidence | Yes | Yes | No | No |
| Creator review note | Yes | Yes | No | No |
| Terminal status | Yes | Yes | Yes | Visible only on public proof projections |

Changing the verifier must not weaken the existing object-storage checks,
media sanitization, DTO allowlists, or visitor projections.

## 6. Creator Routes and Screens

Normal proof review moves out of centralized operations routes.

Creator routes:

- `/pods/:podId/admin`
  - shows a pending-proof count and `Review proofs` action;
- `/pods/:podId/admin/reviews`
  - lists only reviewing submissions from that Pod;
- `/pods/:podId/admin/reviews/:submissionId`
  - shows member identity, locked commitment, result, artifact, creator-only
    evidence, timestamps, and Approve/Reject actions.

Authenticated API routes:

- `GET /api/pods/:podId/admin/reviews`
- `GET /api/pods/:podId/admin/reviews/:submissionId/evidence`
- `POST /api/pods/:podId/admin/reviews/:submissionId/decision`

The decision body is:

```ts
type CreatorReviewDecision =
  | { decision: "approve"; note?: string }
  | { decision: "reject"; reason: string };
```

The creator command center links directly to the queue. Empty, loading, saved,
already-decided, unauthorized, and media-unavailable states are designed
surfaces rather than generic alerts.

## 7. Participant Surfaces

Participant copy changes include:

- `Pods team review` -> `Creator review`
- `Pods reviewer only` -> `Creator only`
- `Your work is with the Pods team` -> `Your proof is with the Pod creator`
- `A Pods reviewer manually approved` -> `The Pod creator approved`

After a decision:

- Approved shows verified progress and the updated streak.
- Rejected shows `Not verified`, the private rejection reason, and no appeal
  action.
- Timeout-protected shows `Protected after review timeout`, counts the
  occurrence as complete, and does not attribute approval to the creator.
- Pod room activity cards update in place without creating a duplicate
  message.
- Today, My Pods, Updates, submission detail, and proof history use the same
  terminal state and wording.

## 8. Operations Boundary

The platform operations account remains responsible only for platform safety,
reports, and public-content moderation.

Normal activity proof decisions are removed from the operations navigation and
cannot be mutated through the old operations approval API. This prevents two
simultaneous authorities from making contradictory decisions.

## 9. Compatibility

- New contracts freeze `verification.verifier = "creator"`.
- The production application database was reset before this release, so no
  live financial migration is required.
- The `review_decisions.reviewer_id` column remains unchanged and stores the
  creator user ID.
- An additive schema migration expands review decisions to
  `approved | rejected`, expands submission presentation to include
  `rejected | timeout_protected`, and enforces at most one review decision per
  submission. The uniqueness boundary is the submission ID, not the
  submission-and-action pair.
- The internal `reviewer_only` proof-share value remains readable while its UI
  label changes to `Creator only`.
- Public safety moderation remains backward compatible.

## 10. Failure Handling

- A repeated terminal decision returns a stable `already decided` response and
  does not append another audit row.
- A creator decision and worker timeout that race at the hard deadline use the
  same transactional state guard. Exactly one terminal transition wins.
- An unauthorized creator receives a safe not-found response that does not
  reveal private evidence.
- Missing or failed evidence media does not expose object keys or storage
  details.
- Reject without a valid reason fails before any state mutation.
- Realtime delivery failure cannot roll back or duplicate the authoritative
  review decision.

## 11. Test and Release Gate

Required automated coverage:

- creator can list and open only their Pod’s pending submissions;
- creator can read creator-only evidence;
- member, applicant, unrelated creator, and visitor cannot read it;
- creator can approve once;
- creator can reject once with a valid reason;
- repeated or concurrent decisions create one terminal result and one audit
  row;
- worker timeout creates one immutable `timeout_protected` result and prevents
  a later creator decision;
- creator inactivity cannot delay the start of the timeout clock;
- rejection reason is private to creator and submission owner;
- room, Today, Updates, and submission projections agree;
- no user-facing `Pods team review` or `Pods reviewer only` copy remains;
- old operations approval endpoints cannot mutate submissions;
- funding, cutoff, refunds, visitor privacy, and social features remain green.

Physical Nimiq Pay gate:

1. Creator publishes `Pods in Pods`.
2. Member applies, is accepted, and funds.
3. Worker credits and roster-locks the member.
4. Member submits public artifact plus creator-only evidence.
5. Creator reviews from the connected creator wallet and approves.
6. A second submission is rejected with a reason.
7. Member sees the correct private decision while another member and a visitor
   cannot see creator-only evidence or the rejection reason.

## 12. Deferred Mainnet Questions

The following are explicitly outside this MVP:

- independent or paid reviewers;
- peer voting;
- creator bonds;
- appeals and disputes;
- clarification rounds;
- verifier SLAs and reputation;
- financially interested verifier controls;
- reward settlement and forfeiture redistribution.

These require a separate Mainnet trust and incentive design. The MVP must not
imply that those protections already exist.
