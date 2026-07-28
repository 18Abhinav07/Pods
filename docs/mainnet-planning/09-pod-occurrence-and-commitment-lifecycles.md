---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, pods, occurrences, commitments, lifecycle, planning]
---

# 09: Pod, Occurrence, and Commitment Lifecycles

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/04-object-graph-and-memberships|Object graph]] |
[[docs/mainnet-planning/06-commands-domain-facts-and-audit|Command contract]] |
[[docs/mainnet-planning/07-event-lifecycle|Event lifecycle]] |
[[docs/mainnet-planning/08-team-and-project-lifecycles|Team and Project lifecycles]] |
[[HANDOFF]] | [[README]]

## Purpose

Define Pods as the reusable accountability engine beneath Build and Ship and
future domains. Scheduling, commitment, proof, review, and economics remain
separate state machines that converge at a terminal outcome.

## Frozen Pod Contract

`PublishPod` freezes the enrollment contract before `enrollment_open`:

- activity protocol and version;
- primary host context;
- purpose, criterion or commitment mode, cadence, timezone, windows, and
  occurrence count;
- join, capacity, roster, visibility, visitor, and room policy;
- evidence schema, reviewer authority, clarification, dispute, and timeout
  rules;
- economic contract reference or explicit non-financial mode;
- cancellation, amendment, finalization, and archival behavior.

A draft may change freely. After publication, a material change creates a new
contract version, stops new acceptance and deposits against the superseded
version, requires fresh consent from affected people, and offers an explicit
withdrawal and refund path. No published economic or proof term changes
silently.

Activation later freezes a roster snapshot, allocation result, materialized
occurrence schedule, and each participant's generated obligations. Those
activation snapshots do not replace the earlier accepted enrollment contract.

## Pod State Machine

`draft -> enrollment_open -> activation_evaluating -> roster_locked
-> active -> final_review -> outcome_ready -> settling_if_required
-> completed -> archived`

Branches:

- `draft -> deleted`
- `enrollment_open | activation_evaluating
  -> cancellation_pending -> refunding_if_required -> cancelled`
- `roster_locked | active | final_review
  -> cancellation_pending -> resolving_obligations -> cancelled`
- terminal rooms may remain open or become read-only according to contract.

Non-financial Pods skip funding and settlement gates but retain explicit
activation and completion.

`suspended` and `governance_blocked` are operational overlays carrying the
current Pod base state. Recovery returns to that base state. The overlay
records which deadlines continue, pause, or receive a protected extension.
Safety, clarification, dispute, cancellation, refund, settlement, and
reconciliation remain available as required.

## Occurrence State Machine

An `Occurrence` is the shared schedule window:

```text
scheduled -> open -> closed -> finalized
scheduled | open -> cancelled
```

It stores local display time, authoritative UTC boundaries, cadence source,
required evidence schema, review policy, and schedule version. It does not
store one participant outcome.

For every rostered participant, activation creates one
`ParticipantOccurrence`:

```text
scheduled -> commitment_open -> evidence_open -> review_pending -> terminal
```

Its terminal outcome is exactly one of:

`approved`, `rejected`, `timeout_protected`, `grace`, `missed`, or
`cancelled`.

`ParticipantOccurrence` owns the participant obligation, commitment
reference, proof case, review clocks, terminal outcome, and immutable source
decision. Settlement consumes these records, not the shared Occurrence.

## Commitment State Machine

`available -> draft -> locked -> evidence_due -> terminal`

Branches:

- `available -> not_required`
- `draft -> abandoned`
- `locked -> cancelled` only through an authorized occurrence cancellation.

A Commitment belongs to one ParticipantOccurrence. A locked commitment is
immutable. Correction of a mistaken task requires an
allowed pre-deadline replacement that preserves the earlier version and never
reduces requirements retroactively. Repeating-criterion protocols may use one
frozen criterion instead of a unique commitment each occurrence.

## Scheduling Rules

1. Protocols support selected weekdays, interval cadence, and explicit dates.
2. Deadlines are stored in UTC with the contract timezone and offset context.
3. Daylight-saving transitions preserve the intended local schedule according
   to the published policy.
4. Production time comes from trusted server time.
5. A missed outcome is created only after the evidence deadline and all
   allowed grace behavior end.
6. Review may continue after the next occurrence opens, so timelines must
   represent a past occurrence awaiting decision.
7. Roster changes after financial or schedule lock cannot rewrite existing
   occurrence obligations.
8. Future occurrences may be cancelled explicitly but never silently removed.

## Participation Rules

- Pod application and invitation records are intents and never participation.
- One non-terminal PodParticipation exists per person and Pod.
- Accepted, funded, allocated, and roster locked remain distinct.
- Join after roster lock is unavailable unless a non-financial contract
  explicitly supports later cohorts with separately generated obligations.
- Leaving with unresolved occurrences or economics produces `exit_pending`.
- The creator participates only through a separate PodParticipation and is
  subject to the same conflict and economic rules.

PodParticipationIntent:

```text
draft -> applied | invited
applied | invited -> accepted_pending_requirements
applied -> withdrawn | declined | expired
invited -> declined | revoked | expired
accepted_pending_requirements -> requirements_satisfied | withdrawn | revoked
```

Satisfying an intent creates one `PodParticipation` in
`pending_activation`. The intent remains the source of application,
invitation, acceptance, and requirement history but grants no room, roster, or
financial authority.

PodParticipation:

```text
pending_activation -> funding_if_required -> allocated -> roster_locked -> active
active -> completed
active -> exit_pending -> left | removed
pending_activation | funding_if_required -> cancelled
allocated | roster_locked | active | exit_pending
  -> cancellation_resolving -> cancelled
```

Branches from `pending_activation` or `funding_if_required` include
`excluded_at_cutoff`. Cancellation before allocation may close directly after
every applicable deposit is refund-bound. Cancellation after allocation enters
`cancellation_resolving` until open proof, review, settlement, refund, and
transfer obligations are either completed or bound to their own durable
lifecycles. A financial refund remains on the Deposit and Transfer lifecycles
rather than becoming a participation state. A state cannot be skipped merely
because a Pod is nonfinancial; the non-applicable gate records an explicit
pass fact before allocation.

## Commands and Facts

Pod commands include `CreatePod`, `DeletePodDraft`, `PublishPod`,
`BeginPodActivationEvaluation`, `LockPodRoster`, `ActivatePod`,
`BeginPodFinalReview`, `FinalizePodOutcome`, `BeginPodSettlement`,
`CompletePod`, `BeginPodCancellation`, `ResolvePodCancellationObligations`,
`CompletePodCancellation`, `SuspendPodOperations`, `ResumePodOperations`,
`BlockPodGovernance`, `RestorePodGovernance`, and `ArchivePod`.

Participation-intent and participation commands include
`CreatePodParticipationIntent`,
`ApplyToPod`, `InviteToPod`, `AcceptPodParticipationIntent`,
`DeclinePodParticipationIntent`, `WithdrawPodParticipationIntent`,
`RevokePodParticipationIntent`, `ExpirePodParticipationIntent`,
`SatisfyPodParticipationRequirements`, `CreatePendingPodParticipation`,
`FundPodParticipation`, `EvaluatePodActivation`, `ExcludePodParticipation`,
`AllocatePodParticipation`, `LockPodParticipation`,
`ActivatePodParticipation`, `BeginPodParticipationExit`,
`CompletePodParticipationExit`, `CancelPendingPodParticipation`,
`BeginPodParticipationCancellation`,
`CompletePodParticipationCancellation`, and
`CompletePodParticipation`.

Occurrence commands include `MaterializeOccurrenceSchedule`,
`OpenOccurrence`, `CloseOccurrence`, `FinalizeOccurrence`,
`CancelOccurrence`, `OpenParticipantOccurrence`,
`OpenParticipantEvidenceWindow`, `CloseParticipantEvidenceWindow`,
`FinalizeParticipantOccurrence`, `FinalizeMissedOccurrence`, and
`CancelParticipantOccurrence`.

Commitment commands include `MakeCommitmentAvailable`,
`SaveCommitmentDraft`, `AbandonCommitmentDraft`, `LockCommitment`,
`MarkCommitmentEvidenceDue`, `MarkCommitmentNotRequired`,
`FinalizeCommitment`, and `CancelCommitment`.

Each command emits a corresponding typed fact under Document 06. A command
that resolves several aggregates, such as roster lock or review finalization,
updates them and writes their facts in one transaction rather than relying on
projection callbacks.

Scheduled automation emits commands through Document 06. It never edits
timestamps or state directly.

## Product Flow

- Creation is a staged contract builder with preview, not one overloaded form.
- A participant sees one next action and the exact consequence of missing it.
- The Pod room contains projected activity cards but does not own commitment
  or review state.
- A participant's occurrence history shows pending, protected, grace,
  rejected, missed, current, and upcoming states without implying those are
  shared outcomes for the whole roster.
- Final review explains what remains before outcome or settlement.
- Completed Pods retain the room, timeline, contract, and receipts as a
  permanent archive.

## Failure Boundaries

- Underfilled activation follows cancellation and refund policy.
- Scheduler delay never shortens a participant's published window.
- Integration outage can trigger clarification, alternate evidence, grace, or
  protection only as the contract permits.
- Review inactivity follows Document 10 rather than leaving funds locked.
- Settlement failure changes financial afterstate, not ParticipantOccurrence
  outcome.
- Duplicate jobs cannot open, miss, finalize, or settle an occurrence or
  ParticipantOccurrence twice.
- Settlement cannot begin until every ParticipantOccurrence is terminal and
  every dispute window is closed or resolved.

## Interdependencies

Consumes Documents 01 through 08. Document 10 owns submission and review.
Document 11 owns funding and settlement. Documents 12, 14, and 15 project
activity, rooms, and attention. Document 16 defines Build and Ship protocol
fields. Document 21 defines future activity protocol extensions.

## Review Findings

- Pod, occurrence, commitment, submission, and settlement remain separate.
- Non-financial and funded Pods share execution without fake payment states.
- The Testnet lifecycle maps forward without making creator review or NIM
  mandatory for every future protocol.
- Time and automation cannot bypass auditable commands.

## Closure Condition

Lock after outcome names, missed behavior, amendment limits, scheduler
protection, review transitions, and economic terminal gates align with
Documents 10, 11, 16, and 21.
