---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, organizers, seasons, operations, sponsors, planning]
---

# 17: Organizer Seasons and Operations

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/07-event-lifecycle|Event lifecycle]] |
[[docs/mainnet-planning/10-proof-verification-and-review|Review contract]] |
[[docs/mainnet-planning/11-economic-modes-treasury-and-settlement|Economic contract]] |
[[docs/mainnet-planning/16-build-and-ship-protocol|Build and Ship]] |
[[HANDOFF]] | [[README]]

## Purpose

Give an organizer a complete operating system for running a Build Season
across many Projects without reading every room, recreating spreadsheets,
manually narrating progress, or receiving hidden power over proof and money.

## Season Contract

A Build Season is an Event configured with:

- purpose, ship outcome, dates, timezone, phases, and checkpoints;
- entry subject, eligibility, tracks, capacity, and one-entry rules;
- application questions and selection policy;
- roster and Project requirements;
- Build protocol and allowed Pod contracts;
- proof, reviewer, conflict, clarification, dispute, and SLA policy;
- public-story and showcase policy;
- non-financial, participant-funded, sponsor-funded, or hybrid economics;
- objective settlement and separate judging rules;
- sponsor reporting, cancellation, refund, and unused-fund rules;
- moderation and safety policy.

The organizer previews what each actor will accept before publication.

## Organizer Roles

Season ownership, administration, application review, proof review,
moderation, judging, sponsorship, and financial operations are separate role
grants. One person may hold compatible grants, but the UI and audit show which
authority powers each action.

Organizers cannot:

- inspect private Project or Pod rooms without explicit access;
- view private proof without review authority;
- change frozen participant or sponsor terms;
- redirect deterministic settlement;
- make themselves beneficiaries implicitly;
- publish contributor material beyond its visibility ceiling.

## Operations Console

The organizer sees structured queues and summaries:

- recruitment funnel and capacity;
- incomplete applications or activation;
- roster and consent readiness;
- Project and Pod activation;
- approaching commitments and milestones;
- proof awaiting review or clarification;
- reviewer load, conflict, and SLA risk;
- Project health signals;
- sponsor funding and liability coverage;
- aggregate deposit, refund, settlement, and payout exception counts,
  affected Event or Pod, blocked consequence, and escalation status;
- public-story and showcase readiness.

`At risk` is an explainable private operational condition, not a public
reputation penalty.

Participant-specific wallet, deposit, ledger, refund, payout, and transfer
details belong to the named financial operator queue. Organizer authority
alone cannot view or act on them.

## Organizer Flow

```text
Create Season
-> configure and preview frozen contract
-> publish and recruit
-> review entries
-> allocate and roster-lock
-> freeze each EventRosterSnapshot
-> activate eligible entries
-> run kickoff
-> monitor exceptions and aggregate progress
-> publish phase pulse
-> operate checkpoints and review queues
-> begin finalization
-> finalize participant occurrence outcomes
-> freeze and calculate ParticipantCommitmentSettlement where applicable
-> complete disclosed judging and milestone decisions
-> freeze and calculate SponsorAwardSettlement where applicable
-> conservation-verify both independent entitlement sets
-> confirm transfers
-> publish showcase and recap
-> archive Event while Projects continue
```

The next cycle clones selected configuration into a new Event and contract.

The participant lane uses only terminal ParticipantOccurrence inputs. The
sponsor lane uses terminal eligible-entry, milestone, judging, cancellation,
allocation, and unused-fund inputs. Hybrid mode can show one lane ready while
the other remains blocked; transfer execution starts only for a
conservation-verified entitlement set and never nets the two pools.

## Review and Judging

- Occurrence review follows Document 10.
- MilestoneSubmission review follows Document 16 and inherits the bounded
  clarification, dispute, conflict, timeout, and grace protections from
  Document 10.
- Subjective final judging uses a frozen rubric, named panel, conflict
  declarations, attributable scores or decisions, tie policy, and dispute
  boundary.
- Subjective prizes remain independent of deterministic participant-funded
  settlement.
- Judge inactivity has a disclosed fallback before the Event launches.

## Sponsor Operations

Sponsors accept one exact contract and fund before promised rewards become
active. They receive permitted aggregate progress, liability coverage,
conservation, allocation, and outcome reports. They do not receive private
evidence or authority to prefer participants outside the frozen judging
contract.

If sponsor rewards are part of accepted Event or entry terms, affected
entries cannot activate until complete liability coverage is finalized. A
nonfinancial fallback is valid only when frozen before acceptance or when
every affected participant accepts a versioned amendment before activation.
Funding failure therefore produces delayed activation, cancellation and
refund, or a consented nonfinancial amendment, never an unfunded advertised
reward.

## Public Season Pulse

The Event pulse uses aggregate ActivityMoments, official announcements,
Project NarrativeUpdates, and selected artifacts. It explains:

- what the Season is trying to ship;
- active Projects and public contributors;
- current phase and checkpoint;
- recent milestones;
- ways to participate or follow;
- final ships and outcomes.

It never exposes raw room chat, private proof, participant finances, or hidden
entries. Counts and aggregates include only entries explicitly eligible for
the public Event projection. Any future aggregate over private entries
requires a separately accepted reporting purpose and privacy thresholds that
prevent inference.

## Metrics

Meaningful organizer metrics:

- qualified applications;
- activated entries;
- active Projects and Pods;
- commitments made and terminal outcomes with denominators;
- milestone progress;
- artifact-linked work;
- review turnaround and backlog;
- final shipped Projects;
- opt-in public stories;
- refund, settlement, and payout completion.

Message volume, reaction count, funds staked, and follower count are not
success metrics.

## Failure Boundaries

- No or insufficient applications produces a designed cancellation or smaller
  cohort path.
- Missing sponsor coverage prevents activation of every entry whose accepted
  terms include that reward, unless the frozen fallback or consented
  amendment path completes.
- Reviewer backlog escalates before timeout protection.
- Organizer authority loss enters governance recovery.
- Event delay uses a consented amendment where possible.
- Project withdrawal preserves history and resolves economics.
- Settlement or payout exception blocks only dependent completion.
- No public opt-ins produces a private completion recap, not forced exposure.

## Interdependencies

Consumes Documents 03 through 16. Document 18 maps actor journeys. Documents
20 and 24 own distribution and routes. Documents 22 and 23 own operations,
security, and custody. Document 27 turns this into releasable slices.

## Non-Goals

- Learning management system.
- Generic conference or community-chat platform.
- Employee surveillance.
- Hidden prize discretion.
- Organizer-controlled reputation scores.
- Manual reading of every Project room.

## Review Findings

- Organizer value comes from structured progress, exceptions, review, sponsor
  reporting, and showcase generation.
- The dashboard scales with Projects rather than message count.
- Sponsor and organizer powers remain separated from participant economics.
- Each new Season is auditable and cannot mutate prior history.

## Closure Condition

Lock after the Event lifecycle, Build protocol, judging boundary, sponsor
contract, operations queues, public pulse, and actor journeys form one
complete Season flow.
