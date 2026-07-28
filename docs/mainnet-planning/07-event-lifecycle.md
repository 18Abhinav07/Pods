---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, events, lifecycle, entries, planning]
---

# 07: Event Lifecycle

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/04-object-graph-and-memberships|Object graph]] |
[[docs/mainnet-planning/05-access-consent-and-visibility|Access contract]] |
[[docs/mainnet-planning/06-commands-domain-facts-and-audit|Command contract]] |
[[HANDOFF]] | [[README]]

## Purpose

Define how a time-bounded Event is configured, published, populated, run,
completed, cancelled, and retained without copying the durable Teams and
Projects that participate in it.

## Event Contract

An Event draft owns:

- identity, current owner, optional `OrganizationHostsEvent` relationship,
  organizers, purpose, domain protocol, and locale;
- entry subject types and eligibility;
- application, invitation, capacity, and roster rules;
- schedule, phases, deadlines, time zone, and amendment policy;
- required Project, Team, Pod, proof, review, and public-visibility behavior;
- optional economic contract and sponsor references;
- completion, withdrawal, cancellation, dispute, and archival rules.

Publishing freezes a versioned Event contract. Material changes after
publication create an amendment proposal and require the consent defined in
Document 05. An Event series or future cycle creates a new Event linked by a
series reference rather than resetting the old Event.

## Event State Machine

`draft -> configured -> registration_open -> registration_closed
-> activation_review -> scheduled -> active -> finalizing -> completed
-> archived`

Permitted branches:

- `draft -> deleted`
- `configured -> cancelled`
- `registration_open | registration_closed | activation_review
  -> cancellation_pending -> refunding_if_required -> cancelled`
- `scheduled | active | finalizing -> cancellation_pending
  -> refunding_or_settling -> cancelled`

State names describe Event authority. Individual entries, Pods, proofs, and
transfers retain their own state machines.

Suspension and governance are overlays rather than fake lifecycle
destinations:

- `operational`: normal commands for the base state;
- `suspended`: discretionary commands pause while the base state and
  obligations remain visible;
- `governance_blocked`: commands requiring missing ownership or
  representation pause while recovery, cancellation, safety, and financial
  obligations remain available.

`ResumeEventOperations` or `RestoreEventGovernance` removes the overlay and
returns to the recorded base state. Every overlay transition states whether
deadlines continue, pause, or receive a protected extension.

## Entry Intent State Machine

Applications and invitations are intent records, not EventEntry
participation:

```text
draft -> applied | invited
applied | invited -> accepted_pending_requirements
applied -> withdrawn | declined | expired
invited -> declined | revoked | expired
accepted_pending_requirements -> requirements_satisfied | withdrawn | revoked
```

Acceptance does not create active Event participation.

## EventParticipant Intent State Machine

Every human proposed for an EventEntry receives an individual intent. A Team,
Project, representative, or organizer cannot accept participation for that
person.

```text
draft -> applied | invited
applied | invited -> accepted_pending_requirements
applied -> withdrawn | declined | expired
invited -> declined | revoked | expired
accepted_pending_requirements -> requirements_satisfied | withdrawn | revoked
```

For a Person-subject EventEntry, Pods may prefill a linked participant intent
from the accepted entry intent, but the person still receives the individual
consent and requirement checkpoint. A Team or Project roster import creates
intents only, never EventParticipant records.

## EventEntry State Machine

After an accepted intent selects a valid subject and contract, Pods creates an
EventEntry:

```text
pending_activation -> active -> completed
pending_activation -> excluded | cancelled
active -> withdrawal_pending -> withdrawn
active -> exclusion_pending -> excluded
active -> disqualified
active -> cancelled
```

An entry becomes active only after eligibility, required consent, capacity,
roster, and financial gates pass. Accepted is never presented as active or
secured.

## EventParticipant State Machine

EventParticipant is separate from EventEntry:

```text
pending_activation -> active -> completed
pending_activation -> declined | revoked | excluded
active -> exit_pending -> left | removed
active -> disqualified
active -> cancelled
```

One non-terminal EventParticipant exists per person and EventEntry. A Team or
Project entering an Event never enrolls all related people automatically.

## Lifecycle Rules

1. Only a draft may change structural entry type or domain protocol freely.
2. Registration cannot open until owner, organizer authority, schedule,
   eligibility, visibility, cancellation, and economic disclosures validate.
3. Capacity allocation is deterministic and produces allocated or excluded
   facts without deleting applications.
4. EventEntry stores Event-specific category, track, roster, submission,
   result, and award state. EventParticipant stores each person's bounded
   Event relationship.
5. The roster snapshot freezes at the disclosed lock point.
6. Active Event changes cannot make an already eligible entry ineligible
   retroactively.
7. Organizers act on exceptions, aggregates, and official communication. They
   do not receive unrestricted private room or proof access.
8. Suspension stops new discretionary activity but preserves safe access,
   evidence retention, deadlines as explicitly paused, and all financial
   recovery.
9. Completion requires every required entry, Pod, review, dispute, settlement,
   award, and transfer leg to be terminal or explicitly waived by policy.
10. Archival makes the Event read-only while preserving public showcases,
    participant history, contracts, and audit.

## Commands and Facts

Event commands include `CreateEvent`, `ConfigureEvent`, `DeleteEventDraft`,
`PublishEvent`, `OpenRegistration`, `CloseRegistration`,
`BeginEventActivationReview`, `ScheduleEvent`, `StartEvent`,
`AdvanceEventPhase`, `SuspendEventOperations`, `ResumeEventOperations`,
`BlockEventGovernance`, `RestoreEventGovernance`,
`BeginEventFinalization`, `BeginEventCancellation`,
`BeginEventRefunding`, `BeginEventCancellationSettlement`,
`CompleteEventCancellation`, `CompleteEvent`, and `ArchiveEvent`.

Entry-intent commands include `CreateEventEntryIntentDraft`,
`SubmitEventEntryIntent`, `InviteEventEntry`, `AcceptEventEntryIntent`,
`DeclineEventEntryIntent`, `WithdrawEventEntryIntent`,
`RevokeEventEntryIntent`, `ExpireEventEntryIntent`, and
`SatisfyEventEntryRequirements`.

Participant-intent commands include `CreateEventParticipantIntentDraft`,
`SubmitEventParticipantIntent`, `InviteEventParticipant`,
`AcceptEventParticipantIntent`, `DeclineEventParticipantIntent`,
`WithdrawEventParticipantIntent`, `RevokeEventParticipantIntent`,
`ExpireEventParticipantIntent`, and
`SatisfyEventParticipantRequirements`.

EventEntry commands include `CreatePendingEventEntry`,
`ActivateEventEntry`, `ExcludePendingEventEntry`, `CancelPendingEventEntry`,
`BeginEventEntryWithdrawal`, `CompleteEventEntryWithdrawal`,
`BeginEventEntryExclusion`, `CompleteEventEntryExclusion`,
`DisqualifyEventEntry`, `CancelActiveEventEntry`, and
`CompleteEventEntry`.

EventParticipant commands include `CreatePendingEventParticipant`,
`ActivateEventParticipant`, `DeclineEventParticipant`,
`RevokeEventParticipant`, `ExcludeEventParticipant`,
`BeginEventParticipantExit`, `CompleteEventParticipantExit`,
`RemoveEventParticipant`, `DisqualifyEventParticipant`,
`CancelEventParticipant`, and `CompleteEventParticipant`.

`AllocateEventCapacity` and `LockEventRoster` own deterministic allocation and
the immutable roster snapshot. They never mutate an intent or participation
record implicitly.

Core facts mirror those transitions and reference the exact contract,
authorization, consent, roster snapshot, economic policy version, aggregate
version, actor, and causation required by Document 06.

## Product Flow

1. Organizer selects an Event protocol and configures one understandable
   contract.
2. A preview shows the participant, Project lead, sponsor, reviewer, and
   visitor experience before publication.
3. Entrants apply or accept invitations, satisfy requirements, and see their
   exact provisional state.
4. The Event opens into phase-aware dashboards, Projects, Pods, activity
   timelines, and official updates.
5. Finalization explains outstanding work rather than silently blocking.
6. Completion produces a permanent Event story, results, participant history,
   and financial receipts.

## Failure and Cancellation

- Missing sponsor funds, insufficient entries, unresolved eligibility, or
  unavailable required reviewers prevent activation.
- Underfilled or cancelled financial Events follow Document 11 refunds before
  terminal cancellation.
- Organizer inactivity can trigger delegated recovery but never silent
  platform ownership.
- An external integration outage pauses only dependent verification, not the
  entire Event.
- Cancellation copy distinguishes never-started, interrupted, refunded,
  partially completed, and non-financial outcomes.

## Interdependencies

Consumes Documents 01 through 06. Document 08 defines durable Team and Project
behavior across Events. Document 09 defines Event-hosted Pods. Documents 10
and 11 gate finalization. Documents 12 through 18 define public story,
operations, and journeys. Document 24 maps the lifecycle into routes.

## Review Findings

- Event state never overwrites Project or Team continuity.
- Series and cycles produce linked new Events, not reused financial contracts.
- Cancellation cannot bypass refunds or required evidence retention.
- Organizer dashboards can scale without granting access to every room.

## Closure Condition

Lock when EventEntry eligibility, activation, cancellation, suspension,
completion, and series behavior align with Documents 08 through 11 and the
Build and Ship protocol in Document 16.
