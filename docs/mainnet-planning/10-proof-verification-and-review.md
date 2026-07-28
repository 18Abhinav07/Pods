---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, proof, verification, review, disputes, planning]
---

# 10: Proof, Verification, and Review

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/05-access-consent-and-visibility|Access contract]] |
[[docs/mainnet-planning/06-commands-domain-facts-and-audit|Command contract]] |
[[docs/mainnet-planning/09-pod-occurrence-and-commitment-lifecycles|Pod lifecycle]] |
[[HANDOFF]] | [[README]]

## Purpose

Turn evidence into an explainable participant-occurrence outcome without claiming
cheat-proof verification, exposing private material, allowing self-review, or
letting integrations and social reactions decide money.

## Evidence Model

A `ProofCase` belongs to exactly one ParticipantOccurrence and owns the review
process. Each evidence attempt produces a versioned `ProofSubmission` that
references:

- person, Pod, shared Occurrence, ParticipantOccurrence, locked commitment or
  criterion, and schema version;
- result summary and participant attestation;
- one or more typed EvidenceItems;
- source visibility per item;
- provider observations and integrity signals;
- submission, receive, deadline, and review timestamps;
- reviewer assignment, decisions, clarification, and dispute history.

EvidenceItem types are protocol-owned and may include image, video reference,
document, URL, GitHub artifact, deployment, activity record, text reflection,
or supported integration observation. Media bytes and provider secrets remain
in purpose-specific stores.

## Visibility Layers

1. **Private reviewer evidence:** visible to the participant and assigned
   review authority.
2. **Context-shared artifact:** explicitly shared with eligible Pod, Project,
   Team, or Event participants.
3. **Public artifact projection:** separately approved for public timelines or
   external distribution.

Submitting one layer never publishes another. A public projection references
an allowlisted derivative and cannot expose private evidence, object keys,
wallet identity, or reviewer notes.

## Proof Case and Review State Machine

```text
integrity_checking -> reviewing
reviewing -> needs_clarification
needs_clarification -> reviewing | rejected
reviewing -> approved | rejected
rejected -> disputed -> approved | rejected | grace
integrity_checking | reviewing | needs_clarification -> timeout_protected
any non-terminal state -> cancelled through ParticipantOccurrence cancellation
```

Before submission, the ParticipantOccurrence remains in `evidence_open` and a
private EvidenceDraft may exist. `SubmitProof` atomically creates the
ProofSubmission and ProofCase in `integrity_checking`, links them to the
ParticipantOccurrence, and moves that ParticipantOccurrence to
`review_pending`. Evidence deadline with no valid submission moves the
ParticipantOccurrence to `missed` through Document 09. It does not fabricate a
ProofCase for work that was never submitted.

The frozen contract declares:

- evidence deadline;
- maximum integrity-check time;
- initial reviewer-action target;
- latest clarification-request time;
- participant clarification-response window;
- post-response reviewer window;
- one absolute initial-case deadline;
- dispute-open window;
- dispute-decision deadline.

All clarification clocks fit inside the absolute case deadline. The initial
default permits one clarification and one dispute.

Platform-owned delay during integrity checking, reviewer assignment, initial
review, or post-clarification review reaches `timeout_protected` at the
absolute initial-case deadline. Participant-owned failure to answer an
eligible clarification reaches `rejected` by default, unless the frozen
nonfinancial protocol names a neutral result. When account safety or law
prevents a required response, Document 05 requires a protected or neutral
result rather than automatic forfeiture.

Dispute inactivity reaches `grace`, not timeout protection, because a prior
rejection exists.

Every `rejected` ProofCase carries a separate `disputeAvailability` value:

- `open` with an exact expiry;
- `used`;
- `expired`;
- `not_permitted` where the frozen nonfinancial policy validly disables it.

An initial rejection with `open` is not final for NextAction. It offers the
dispute command until expiry. A rejection after the single dispute is `used`
and terminal. An undisputed rejection becomes `expired` through an explicit
deadline command. This field avoids inventing two incompatible meanings for the
same displayed rejection state and lets routes compute one deterministic
action.

`ReviewDecision` is immutable. An initial rejection with
`disputeAvailability=open` records a provisional decision but leaves the
ParticipantOccurrence in `review_pending` and blocks settlement. The
ParticipantOccurrence becomes terminal only when a command records approval,
timeout protection, grace, final rejection with `used`, `expired`, or
`not_permitted` dispute availability, missed outcome, or cancellation.

The command that creates a terminal decision records that decision and the
ParticipantOccurrence terminal outcome in the same transaction. A ProofCase
or submission status cannot independently disagree with that outcome.

## Decision Semantics

- `approved`: requirements were satisfied under the named policy and the
  outcome is bonus or reward eligible where economics permit.
- `rejected`: requirements were not satisfied after available process.
- `timeout_protected`: no timely initial decision was produced; principal and
  completion treatment follow the contract, but the result is not treated as
  manually verified or bonus eligible.
- `grace`: a disputed or exceptional case is neutralized; participant
  principal is protected, the occurrence is excluded from success and streak
  calculations, and it is not bonus or sponsor-reward eligible.
- `missed`: no valid submission arrived by the final evidence boundary.

Review decisions store reason codes, an understandable explanation, policy
version, evidence references, reviewer, conflict declaration, and decision
time.

## Verification Sources

1. Integration observations can prove that an account, repository, device, or
   provider reported an event.
2. They cannot by themselves prove authorship quality, effort, originality,
   physical truth, or satisfaction of a human requirement.
3. Automated checks may detect ownership mismatch, duplicate artifact,
   timestamp conflict, unsupported media, malware, or missing fields.
4. Automation may approve only objective policies that were explicitly
   published and validated. Subjective acceptance remains human.
5. A manual fallback or explicit protected outcome exists when a required
   provider is unavailable.

## Reviewer Assignment and Conflict

- Self-review is prohibited.
- A financially interested reviewer is prohibited unless a later economic
  policy proves no ability to benefit from the decision.
- Creator review is allowed only when disclosed, the creator is not a
  participant or beneficiary, and no higher policy requires independent
  review.
- Reviewer access is minimum necessary and expires after operational
  retention.
- Reassignment is best effort. Product copy never promises an independent
  second reviewer unless one is structurally guaranteed.
- Peer reactions, comments, and votes never change review or economics.

## Commands and Facts

Commands include `SaveProofDraft`, `UploadEvidenceItem`,
`SetEvidenceVisibility`, `SubmitProof`, `RecordIntegrityObservation`,
`AssignReviewer`, `RequestClarification`, `RespondToClarification`,
`ApproveProof`, `RejectProof`, `OpenDispute`, `ResolveDispute`,
`CloseProofDisputeWindow`, `ApplyReviewTimeoutProtection`, and
`CancelProofCase`. `FinalizeMissedOccurrence` belongs to the
ParticipantOccurrence command family in Document 09 and closes the obligation
without fabricating a submitted ProofCase.

Every decision and override preserves the earlier state and causation chain.
Any post-terminal correction uses a named compensating decision and, after
entitlement creation, the compensating settlement process in Document 11.

## Product Flow

- Before capture, the participant sees what qualifies, examples, deadline,
  visibility, reviewer, and consequence.
- Evidence creation is a guided protocol-specific flow, not a generic form.
- Upload can resume from durable drafts.
- Review status explains who is responsible and when protection applies.
- Clarification highlights only the missing requirement.
- Rejection explains the reason and one available dispute path.
- Public or room activity cards update from authoritative state without
  duplicating submissions.

## Failure and Abuse Boundaries

- Unsupported, oversized, interrupted, unsafe, duplicate, late, and
  unauthorized evidence each have designed terminal or recovery states.
- Malware or privacy scanning failure blocks publication but can preserve a
  private pending draft.
- Provider failure never becomes automatic rejection unless the accepted
  contract explicitly assigned that risk and offered a valid fallback.
- Review inactivity cannot lock funds indefinitely.
- Suspected fraud can freeze reward eligibility while preserving refund and
  appeal rights defined by policy.
- Removed public content does not alter the authoritative outcome.

## Interdependencies

Consumes Documents 01 through 09. Document 11 maps outcomes to economics.
Document 12 projects approved activity. Document 13 derives reputation.
Document 14 hosts discussion around immutable activity cards. Document 19
supplies GitHub observations. Document 21 supplies domain evidence schemas.
Documents 22 and 23 own storage, scanning, operations, and retention.

## Review Findings

- Verification claims remain narrower than the real evidence.
- Private, context-shared, and public proof are different user decisions.
- Timeout protection and dispute grace eliminate indefinite custody.
- Creator review remains possible for small Pods without restoring
  self-interested peer voting.

## Closure Condition

Lock after every economic mode defines treatment for all six terminal
outcomes, GitHub and future provider observations remain non-authoritative,
and operational reviewer sourcing can meet the published timeout policy.
