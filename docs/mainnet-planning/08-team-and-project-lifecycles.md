---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, organizations, teams, projects, lifecycle, collaboration, planning]
---

# 08: Organization, Team, and Project Lifecycles

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/04-object-graph-and-memberships|Object graph]] |
[[docs/mainnet-planning/05-access-consent-and-visibility|Access contract]] |
[[docs/mainnet-planning/07-event-lifecycle|Event lifecycle]] |
[[HANDOFF]] | [[README]]

## Purpose

Preserve durable Organizations, Teams, and Projects before, during, and after
Events while making membership, contribution, ownership, public story, and
Event entry explicit.

## Organization Lifecycle

Permitted transitions:

- `draft -> active | deleted`
- `active -> dormant | dissolution_pending`
- `dormant -> active | dissolution_pending`
- `dissolution_pending -> archived`

`governance_blocked` is an operational overlay carrying the current base state.
Authorized recovery removes the overlay. Safety, member exit, cancellation,
refund, payout, and other obligation-preserving commands remain available while
blocked.

Rules:

1. An eligible authenticated Person creates an Organization draft and becomes
   its initial accountable owner. Initial Mainnet does not allow an
   Organization or Team to own another Organization.
2. Activation requires a valid owner, at least one accountable human
   representative, organization kind, membership policy, visibility policy,
   and accepted organization terms.
3. Community, club, company, nonprofit, and informal-collective kinds affect
   presentation and capability eligibility, not object identity.
4. Verification, sponsorship, financial authority, and Event-organizer
   authority are separate credentials or role grants. They are not
   Organization lifecycle states.
5. Membership applications and invitations remain separate intents.
6. Organization membership does not automatically create Team membership,
   Event participation, Project contribution, Pod participation, or room
   publishing authority.
7. Dormancy stops new discretionary Organization operations while preserving
   memberships, affiliations, hosted Events, activity, and obligations.
8. Dissolution cannot erase or transfer active Events, Projects, Pods,
   contracts, settlement, or attribution. Each dependent relationship follows
   its own explicit resolution.
9. Organization nesting and Organization merge are deferred.

## Team Lifecycle

Permitted transitions:

- `draft -> forming | deleted`
- `forming -> active | dissolution_pending`
- `active -> dormant | dissolution_pending`
- `dormant -> active | dissolution_pending`
- `dissolution_pending -> archived`

`governance_blocked` is an operational overlay carrying the current base state,
not a replacement lifecycle state. Authorized recovery removes the overlay and
returns to that base state. Cancellation, safety, exit, and obligation
commands remain available while blocked.

Rules:

1. A Team is activated only after ownership, at least one accountable human,
   and its membership policy are valid.
2. Membership applications and invitations remain separate intents.
3. Team membership does not automatically enroll members in Projects, Events,
   or Pods.
4. A Team can work across multiple Projects and Events.
5. Dormancy pauses new Team operations but preserves memberships, Project
   links, activity, and attribution.
6. Dissolution cannot erase active obligations or Event roster snapshots.
7. A Team cannot merge with another Team in the initial Mainnet product.

## Project Lifecycle

Permitted transitions:

- `draft -> forming | deleted`
- `forming -> active | cancelled`
- `active -> paused | completed | cancelled`
- `paused -> active | completed | cancelled`
- `completed -> archived`
- `cancelled -> archived`

Reopening completed work creates a named `ProjectPhase` and emits
`ProjectReopened` before the Project returns to `active`. The earlier
completion record and time range remain immutable.

`governance_blocked` is an operational overlay carrying the base state.
Recovery removes the overlay. Safety, contributor exit, cancellation, and
obligation-preserving commands remain available while blocked.

Rules:

1. A Project may be one-person, directly contributed, Team-backed, or
   multi-Team.
2. Project ownership and ProjectContribution are separate.
3. Project identity, story, repository connections, milestones, artifacts, and
   contributor attribution persist across Events.
4. Event-specific category, roster, scoring, result, and reward remain on
   EventEntry.
5. Completion is an explicit outcome with a summary and artifact references,
   not inferred from inactivity.
6. Paused means intentionally inactive and remains distinct from abandoned,
   cancelled, or completed.
7. Cloning or forking creates a new Project with provenance. It never rewrites
   the original.
8. Project merge is deferred because authorship, Event history, integrations,
   and reputation cannot be combined safely by a shallow operation.

## Membership and Contribution

- OrganizationMembership represents durable belonging to an Organization.
- TeamMembership represents durable belonging.
- ProjectContribution represents declared participation in a Project.
- Compatible lead, contributor, mentor, designer, engineer, and other
  domain-role grants attach to one relationship.
- Removing current access preserves earlier authored facts.
- Bulk Team assignment creates proposed ProjectContribution invitations.
- A contributor may narrow future public participation without removing
  already consented public artifacts from external destinations.
- A contributor with active frozen obligations moves to `exit_pending`.

Organization membership intents:

```text
draft -> applied | invited
applied | invited -> accepted | declined | revoked | expired | withdrawn
```

OrganizationMembership:

```text
pending_activation -> active
pending_activation -> cancelled | declined
active -> exit_pending -> left | removed
active -> completed
```

Team membership intents:

```text
draft -> applied | invited
applied | invited -> accepted | declined | revoked | expired | withdrawn
```

TeamMembership:

```text
pending_activation -> active
pending_activation -> cancelled | declined
active -> exit_pending -> left | removed
active -> completed
```

Project contribution intents:

```text
draft -> applied | invited
applied | invited -> accepted | declined | revoked | expired | withdrawn
```

ProjectContribution:

```text
pending_activation -> active
pending_activation -> cancelled | declined
active -> exit_pending -> left | removed
active -> completed
```

There is at most one non-terminal OrganizationMembership per person and
Organization, one non-terminal TeamMembership per person and Team, and one
non-terminal ProjectContribution per person and Project.

## Ownership and Continuity

Ownership transfer requires offer and acceptance. A collective owner acts
through representatives. If the only authorized owner becomes unavailable,
the Team or Project enters `governance_blocked`; it never silently transfers to
the platform or the most active member.

Archived Organizations or Teams do not cascade archive Projects. A Project
retains its original affiliation history and may obtain a new eligible owner
through explicit transfer.

## Commands and Facts

Organization lifecycle commands include `CreateOrganization`,
`ActivateOrganization`, `DeleteOrganizationDraft`,
`MarkOrganizationDormant`, `ReactivateOrganization`,
`BeginOrganizationDissolution`, `ArchiveOrganization`,
`BlockOrganizationGovernance`, and `RestoreOrganizationGovernance`.

Team lifecycle commands include `CreateTeam`, `BeginTeamFormation`,
`ActivateTeam`, `DeleteTeamDraft`, `MarkTeamDormant`, `ReactivateTeam`,
`BeginTeamDissolution`, `ArchiveTeam`, `BlockTeamGovernance`, and
`RestoreTeamGovernance`.

Project lifecycle commands include `CreateProject`, `BeginProjectFormation`,
`ActivateProject`, `DeleteProjectDraft`, `ConnectProjectSource`,
`PauseProject`, `ResumeProject`, `ReopenProjectPhase`, `CompleteProject`,
`CancelProject`, `CloneProject`, `ArchiveProject`,
`BlockProjectGovernance`, and `RestoreProjectGovernance`.

One typed relationship-intent command family owns OrganizationMembership,
TeamMembership, and ProjectContribution intents. Every command includes the
requested relationship type and exact target:

- `CreateRelationshipIntentDraft`;
- `SubmitRelationshipApplication`;
- `SendRelationshipInvitation`;
- `AcceptRelationshipIntent`;
- `DeclineRelationshipIntent`;
- `WithdrawRelationshipIntent`;
- `RevokeRelationshipIntent`;
- `ExpireRelationshipIntent`.

Accepted intent resolution uses `CreatePendingRelationship`,
`ActivateRelationship`, `CancelPendingRelationship`,
`DeclinePendingRelationship`, `BeginRelationshipExit`,
`CompleteRelationshipExit`, and `CompleteRelationship`. Target-specific
policy selects OrganizationMembership, TeamMembership, or ProjectContribution
without changing command semantics.

Context commands include `ChangeOrganizationRole`, `ChangeTeamRole`,
`ChangeProjectContributionRole`, `LinkTeamToProject`, and
`UnlinkTeamFromProject`.

Every link, unlink, role change, ownership transfer, pause, completion, and
archive emits a typed fact with actor and effective interval. Every command
above has a corresponding past-tense fact carrying the aggregate version,
intent or relationship identity, actor, policy, and causation required by
Document 06.

## Product Flow

- A person may create a Project first and add a Team later.
- A person may create an Organization, invite or accept members, then explicitly
  affiliate Teams and Projects or host Events without enrolling every member.
- A Team may discover an Event, create or select a Project, then form one
  EventEntry without duplicating either object.
- A Project page explains current goal, contributors, active Pods, Event
  entries, authoritative activity, and selected public story.
- A Team page explains people, active Projects, open needs, shared history, and
  contextual roles without becoming a second profile for each person.
- After an Event, the Project and Team retain continuity and can enter another
  Event with a new roster snapshot.

## Failure Boundaries

- An expired invitation does not create a ghost member.
- An unavailable repository does not pause the Project.
- A blocked or removed person cannot take future actions but retains
  attribution.
- A Team dissolution does not cancel a Project, EventEntry, or Pod
  automatically.
- Organization dormancy or dissolution does not silently cancel or transfer a
  Team, Project, Event, EventEntry, or Pod.
- Completing a Project does not auto-complete active Pods or financial
  contracts.

## Interdependencies

Consumes Documents 01 through 07. Document 09 attaches Pods to Teams,
Projects, and EventEntries. Documents 12 and 13 build timelines and passports.
Document 14 owns rooms. Document 16 adds Build and Ship milestones and source
connections. Document 18 defines actor journeys.

## Review Findings

- Durable Organization and Team belonging, Project work, and Event
  participation remain separate.
- Teams do not become mandatory wrappers around Projects.
- Project status never derives from chat volume or integration activity alone.
- Ownership, belonging, and contribution remain distinct.

## Closure Condition

Lock after Project milestone semantics, Event entry handoff, Pod host behavior,
public story, and contributor exit align with Documents 09, 12, 16, and 18.
