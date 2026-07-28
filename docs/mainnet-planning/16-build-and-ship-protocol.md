---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, build-and-ship, protocol, builders, planning]
---

# 16: Build and Ship Protocol

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/07-event-lifecycle|Event lifecycle]] |
[[docs/mainnet-planning/08-team-and-project-lifecycles|Project lifecycle]] |
[[docs/mainnet-planning/09-pod-occurrence-and-commitment-lifecycles|Pod lifecycle]] |
[[docs/mainnet-planning/12-activity-ledger-timelines-and-shareables|Activity ledger]] |
[[HANDOFF]] | [[README]]

## Purpose

Define Build and Ship as Pods' first complete activity domain: a protocol for
making a ship promise, working in short accountability loops, linking real
artifacts, receiving fair review, collaborating, and producing a durable
public or private build journey.

It does not replace GitHub, Linear, Notion, source hosting, issue tracking, or
team communication tools outside the execution ritual Pods owns.

## Domain Graph

```text
Build Season Event
  -> EventEntry representing a durable Project
     -> EventParticipants
     -> ProjectContribution relationships
     -> focused Project or EventEntry Pods
        -> occurrences
        -> locked commitments
        -> artifacts and proof
        -> review outcomes
     -> milestones
     -> Project journey
     -> builder Passport eligibility
```

Build and Ship adds domain records, not another canonical container.

## Project Build Profile and Event Entry Charter

`ProjectBuildProfile` is the durable, mutable Project-level definition:

- problem and intended user;
- general ship direction;
- source and deployment links;
- contribution needs and relevant skills;
- public-building preference.

`EventEntryBuildCharter` is created only after an EventEntry exists and
freezes:

- Season-specific ship promise and expected artifact;
- track and milestones;
- roster policy, required roles, capacity, and allocation rules;
- review-policy references;
- public or private Event story terms;
- expected final Event artifact;
- Event-specific economic and judging references.

`EventRosterSnapshot` is a separate immutable record created after individual
EventParticipant requirements, consent, applicable funding, capacity
allocation, and roster lock succeed. It contains the exact participant IDs,
roles, representative scope, charter version, allocation result, and lock
time. The charter defines who may qualify; the roster snapshot records who
actually qualified.

Flow:

```text
create or update ProjectBuildProfile
-> apply to Event
-> create pending EventEntry
-> satisfy entry-level requirements
-> accept and freeze EventEntryBuildCharter
-> collect and resolve EventParticipant intents and individual requirements
-> allocate and lock the participant roster
-> freeze EventRosterSnapshot
-> activate entry
```

Reviewer authority belongs to the EventEntry, Pod, milestone, or proof policy.
It never belongs to the durable ProjectBuildProfile.

## Workstreams and Pods

A Project may create focused Pods for workstreams such as product, frontend,
backend, contracts, design, research, launch, or documentation. Each Pod owns
its exact schedule and occurrence contract.

Workstreams organize accountability, not backlog hierarchy. Pods does not add
epics, tickets, story points, arbitrary dependencies, time sheets, or source
branches.

## Commitment Loop

1. A participant sees the Project goal, current milestone, and next Pod
   occurrence.
2. They lock one concrete short-horizon deliverable.
3. They work in their existing specialist tools.
4. They attach one or more observed or manual artifacts.
5. They choose private reviewer, context-shared, and public visibility.
6. They submit against the exact commitment.
7. Review produces the terminal ParticipantOccurrence outcome.
8. One ActivityMoment updates in place.
9. Eligible work becomes part of the Project journey and builder Passport.
10. The next occurrence opens without losing the earlier record.

Cadence may be daily, selected-day, weekly, or explicit-date according to the
Pod contract. A missed commitment is not silently replaced with an easier one.

## Artifacts

Supported BuildArtifact classes include:

- commit or commit range;
- pull request or merged change;
- issue resolution;
- release;
- deployment;
- live demo;
- design;
- research or decision document;
- documentation;
- validated external deliverable.

Artifact provenance and eligibility are separate:

```text
proposed -> source_observed | manually_attested
source_observed | manually_attested -> eligibility_pending
eligibility_pending -> eligible | ineligible
eligible -> invalidated
```

An artifact has no global `accepted` quality state. A ProofCase or
MilestoneSubmission records context-specific acceptance. The same artifact
may support one requirement and fail another.

`source_unavailable` is a current availability overlay, not a rewrite of
provenance or eligibility history. Reconciliation may restore availability.
An eligibility decision stores scope, evaluator, objective rule, source
references, reason, and policy version. `ineligible` covers an ownership
mismatch, duplicate artifact, invalid scope, unsupported type, missing required
observation, or other frozen objective rule. `invalidated` requires a later
attributable eligibility decision and cannot silently reverse an already
terminal ProofCase or settlement; affected contexts use their correction
process.

Observation proves only the provider fact it actually establishes. It never
proves quality, originality, usefulness, effort, authorship of every line, or
absence of AI assistance.

## Milestones and Completion

BuildMilestones are meaningful outcome checkpoints, not task lists.

Milestone:

```text
planned -> active -> submission_open -> review_pending
planned | active | submission_open -> withdrawn | cancelled
submission_open -> not_met
review_pending -> achieved | not_met | timeout_protected | grace
review_pending -> withdrawn | cancelled where frozen policy permits
```

Concrete terminal Milestone outcomes are `achieved`, `not_met`,
`timeout_protected`, `grace`, `withdrawn`, and `cancelled`. A submission
deadline with no valid MilestoneSubmission produces `not_met`. A milestone
cannot use a generic `terminal` presentation state.

One `MilestoneSubmission` uses the review protections from Document 10:

```text
draft -> submitted | withdrawn
submitted -> integrity_checking
integrity_checking -> reviewing
reviewing -> needs_clarification
needs_clarification -> reviewing | rejected
reviewing -> accepted | rejected
rejected -> disputed | not_met_final
disputed -> accepted | not_met_final | grace
integrity_checking | reviewing | needs_clarification -> timeout_protected
submitted | integrity_checking | reviewing | needs_clarification -> withdrawn
any non-terminal state -> cancelled through Event cancellation policy
```

The frozen EventEntry milestone policy owns reviewer assignment, evidence,
clarification count, dispute count, conflicts, hard deadlines, timeout
protection, grace, and withdrawal.

The absolute initial-case deadline moves `integrity_checking`, `reviewing`, or
`needs_clarification` to `timeout_protected` when platform-owned work is late.
Participant-owned clarification expiry produces `rejected` with the exact
dispute window. `rejected` is non-terminal while
`disputeAvailability=open`; expiry or a used dispute moves it to
`not_met_final`. Dispute decision inactivity produces `grace`.

The terminal MilestoneSubmission result and BuildMilestone outcome change in
one transaction:

| MilestoneSubmission result | BuildMilestone outcome |
|---|---|
| `accepted` | `achieved` |
| `not_met_final` | `not_met` |
| `timeout_protected` | `timeout_protected` |
| `grace` | `grace` |
| `withdrawn` | `withdrawn` |
| `cancelled` | `cancelled` |

Outcome effects:

- Project completion may cite `achieved`; neutral or adverse outcomes do not
  prove the Project shipped.
- EventEntry completion applies the frozen required-milestone policy and cannot
  relabel timeout protection or grace as achievement.
- Passport uses `accepted` as evidence-backed, labels timeout protection and
  grace separately, and keeps `not_met` private by default.
- Public Project or Event stories include only deliberately published,
  audience-eligible milestone projections with exact outcome wording.
- Sponsor awards use only the outcomes named by the frozen sponsor policy;
  timeout protection, grace, withdrawal, cancellation, and `not_met` are not
  reward eligible by default.
- Milestone outcomes never redirect participant-funded principal.

Occurrence review and milestone review are distinct. Completing all
ParticipantOccurrences does not automatically prove the Project shipped.

A private authoritative BuildCompletionRecord states what shipped, where it
can be experienced, which milestones reached each outcome, every contributor,
and which Event contract governed the result. Its public projection includes
only contributors who opted into that exact Project or Event public context
and never reveals hidden contributor counts.

Milestone outcomes affect sponsor awards only where the frozen sponsor policy
explicitly references them. They never redirect participant-funded principal.

The Project continues after an EventEntry completes.

## Economics

Build and Ship supports all Document 11 modes:

- non-financial accountability;
- participant-funded commitment;
- sponsor-funded rewards;
- hybrid commitment plus sponsor reward.

Objective commitment settlement and subjective Event prizes remain separate.
A judge cannot redirect deterministic participant principal. Stake size,
wallet balance, and reward amount never improve a Passport.

## Public Building

Public building is opt-in at Project, milestone, artifact, and contributor
levels.

- Raw room chat is not a public build log.
- The Project journey is built from ActivityMoments and NarrativeUpdates.
- Multi-contributor artifacts preserve credit.
- Leads select only material already eligible for Project publication.
- A contributor can remain private while the Project publishes other eligible
  work.
- Visitors see ship promise, current stage, milestones, public artifacts,
  contributors who opted in, and an understandable journey.

## Actor Jobs

- **Builder:** know what to ship next, prove it once, collaborate, and retain
  portable evidence.
- **Project lead:** form a team, define milestones, create focused Pods,
  understand risk, and publish a coherent story.
- **Reviewer:** judge the frozen commitment with minimum necessary evidence.
- **Organizer:** understand entry progress without reading rooms.
- **Mentor:** contribute feedback or artifacts without automatic participant
  economics.
- **Visitor:** follow real progress and discover credible builders or Projects.

## Commands and Facts

Domain commands include `UpdateProjectBuildProfile`,
`FreezeEventEntryBuildCharter`, `FreezeEventRosterSnapshot`,
`CreateBuildMilestone`, `ActivateBuildMilestone`,
`OpenBuildMilestoneSubmissionWindow`, `ProposeBuildArtifact`,
`RecordBuildArtifactSource`, `AttestManualBuildArtifact`,
`EvaluateBuildArtifactEligibility`, `MarkBuildArtifactIneligible`,
`InvalidateBuildArtifact`, `MarkBuildArtifactSourceUnavailable`,
`MarkBuildArtifactSourceAvailable`, `LinkBuildArtifact`,
`SubmitMilestone`, `RequestMilestoneClarification`,
`RespondToMilestoneClarification`, `AcceptMilestone`,
`MarkMilestoneNotMet`, `DisputeMilestoneDecision`,
`ResolveMilestoneDispute`, `ApplyMilestoneTimeoutProtection`,
`CloseMilestoneDisputeWindow`, `WithdrawMilestone`, `CancelMilestone`,
`CompleteBuildEntry`, and `PublishProjectChapter`.

Representative facts include `EventRosterSnapshotFrozen`,
`BuildArtifactSourceObserved`, `BuildArtifactManuallyAttested`,
`BuildArtifactEligible`, `BuildArtifactIneligible`,
`BuildArtifactInvalidated`, `BuildArtifactAvailabilityChanged`,
`MilestoneSubmissionAccepted`, `MilestoneSubmissionRejected`,
`MilestoneTimeoutProtected`, `MilestoneGraceApplied`,
`BuildMilestoneAchieved`, and `BuildMilestoneNotMet`.

They compose upstream lifecycle commands rather than bypassing them.

## Failure Boundaries

- GitHub is optional unless the frozen protocol requires it with a valid
  fallback.
- Repository disconnection does not erase accepted history.
- Duplicate or transferred artifacts cannot produce duplicate credit.
- Team change does not rewrite Event roster or artifact attribution.
- Event completion does not archive the Project.
- Reviewer or provider outage follows Documents 10 and 15.
- Public-story failure cannot block occurrence or financial completion.

## Interdependencies

Consumes Documents 01 through 15. Document 17 operationalizes Build Seasons.
Document 18 defines actor journeys. Document 19 verifies GitHub observations.
Document 20 distributes public stories. Document 21 defines the reusable
activity-domain boundary. Documents 22 through 25 implement and present it.

## Non-Goals

- General-purpose project management.
- Code hosting or code-quality scoring.
- Mandatory public building.
- Commit-count productivity ranking.
- Crypto-first product identity.
- One Pod containing the complete Project organization.

## Review Findings

- Build and Ship now operates across Events, Projects, people, and focused
  Pods instead of remaining a template.
- The repeat-use loop produces both execution and distribution value.
- Teams keep their existing tools while Pods owns commitment, proof, review,
  story, and portable history.
- Non-financial mode ensures the product remains useful without money.

## Closure Condition

Lock after GitHub provenance, milestone review, organizer operations, actor
journeys, domain-extension boundaries, and Mainnet v1 scope agree with
Documents 17 through 21.
