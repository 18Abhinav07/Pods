---
created: 2026-07-27
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, product-planning, architecture, index]
---

# Pods Mainnet Planning

Related: [[HANDOFF]] | [[README]] | [[docs/implementation-plan]]

## Purpose

This folder is the source of truth for designing the Pods Mainnet product from
its smallest durable unit through its complete product architecture. It does
not amend the frozen Testnet release and does not authorize implementation,
Mainnet deployment, custody, or fund movement.

Documents 01 through 04 were discussed and explicitly locked one at a time.
At Abhinav's direction, Documents 05 through 27 were then drafted as one
dependency-ordered architecture package, reviewed against one another, and held
at `review` until his Mainnet product plan is reconciled against them.

## Working Method

1. Begin with the smallest durable object and move outward through
   relationships, lifecycles, experiences, integrations, and infrastructure.
2. Record alternatives, the selected decision, invariants, permissions, data,
   commands, domain facts, state machines, failure cases, and deferred scope.
3. Mark unresolved decisions explicitly. Never carry an ambiguity silently
   into a later document.
4. A later document may reference an earlier locked decision but may not
   override it without recording an amendment in both documents.
5. Cross-document review occurs in three dependency bundles: foundation and
   lifecycles, experience and product, and integrations and production.
6. A document drafted autonomously remains `review`; internal completeness does
   not silently make it a locked product decision.
7. Do not produce an implementation plan until the integrated architecture is
   approved and its validation gates are defined.

## Document Status

- `queued`: not yet discussed
- `active`: the only subject currently being refined
- `review`: internally complete and awaiting explicit approval
- `locked`: approved source of truth
- `amended`: previously locked and later changed through an explicit decision

## Planning Sequence

### Foundation

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 01 | [[docs/mainnet-planning/01-person-account-and-identity|Person, account, and identity]] | What is a person in Pods, how do they authenticate, connect identities, recover access, and retain continuity? | locked |
| 02 | [[docs/mainnet-planning/02-profile-facets-and-privacy|Profile, facets, and privacy]] | How does one person represent builder, movement, reading, and future facets without fragmented identities or forced public exposure? | locked |
| 03 | [[docs/mainnet-planning/03-actors-roles-and-jobs|Actors, roles, and jobs]] | Which human, collective, and system actors exist, what may each do, and what does Pods do for each of them? | locked |
| 04 | [[docs/mainnet-planning/04-object-graph-and-memberships|Object graph and memberships]] | How do people, organizations, teams, Events, Projects, Pods, and memberships relate without recursive or duplicated ownership? | locked |
| 05 | [[docs/mainnet-planning/05-access-consent-and-visibility|Access, consent, and visibility]] | How are authorization, inheritance, creator ceilings, contributor choice, consent snapshots, invitations, and visitor access enforced? | review |
| 06 | [[docs/mainnet-planning/06-commands-domain-facts-and-audit|Commands, domain facts, and audit]] | How are actor intent, authoritative changes, automation, causation, visibility, and audit history represented once? | review |

### Core Lifecycles

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 07 | [[docs/mainnet-planning/07-event-lifecycle|Event lifecycle]] | How does an Event move from creation through enrollment, execution, review, settlement, completion, cancellation, and archival? | review |
| 08 | [[docs/mainnet-planning/08-team-and-project-lifecycles|Organization, Team, and Project lifecycles]] | How do durable Organizations, Teams, and Projects form, participate in Events, evolve across Events, withdraw, complete, and archive? | review |
| 09 | [[docs/mainnet-planning/09-pod-occurrence-and-commitment-lifecycles|Pod, occurrence, and commitment lifecycles]] | How do focused Pods schedule work and move occurrences and commitments through every valid state? | review |
| 10 | [[docs/mainnet-planning/10-proof-verification-and-review|Proof, verification, and review]] | How are evidence, automated checks, human judgment, clarification, disputes, privacy, and final outcomes handled? | review |
| 11 | [[docs/mainnet-planning/11-economic-modes-treasury-and-settlement|Economic modes, treasury, and settlement]] | How do participant-funded, sponsor-funded, and hybrid contracts custody, conserve, refund, reward, settle, and reconcile value? | review |

### Product Experience and Derived Systems

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 12 | [[docs/mainnet-planning/12-activity-ledger-timelines-and-shareables|Activity ledger, timelines, and Shareables]] | How does one authoritative activity fact produce clean Pod, Project, Event, person, and public timelines without duplicating chat noise? | review |
| 13 | [[docs/mainnet-planning/13-passports-reputation-and-discovery|Passports, reputation, and discovery]] | How is evidence-backed, facet-specific reputation derived, explained, protected from gaming, and used to help people connect? | review |
| 14 | [[docs/mainnet-planning/14-social-rooms-and-relationships|Social rooms and relationships]] | How do rooms, messages, replies, reactions, follows, connections, invitations, moderation, and archives support activity without becoming authoritative state? | review |
| 15 | [[docs/mainnet-planning/15-notifications-digests-and-realtime|Notifications, digests, and realtime]] | Which changes deserve immediate attention, which are summarized, and how do clients recover from delayed or missed delivery? | review |

### Build and Ship Product Domain

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 16 | [[docs/mainnet-planning/16-build-and-ship-protocol|Build and Ship protocol]] | Which foundation rules, proof types, milestones, Pod structures, incentives, and reputation semantics make Build and Ship a complete product domain rather than a template? | review |
| 17 | [[docs/mainnet-planning/17-organizer-seasons-and-operations|Organizer seasons and operations]] | How does an organizer run a Build Season across many Projects without reading every room or manually assembling progress and payouts? | review |
| 18 | [[docs/mainnet-planning/18-participant-project-and-visitor-journeys|Participant, Project, and visitor journeys]] | What does each Build and Ship actor do from discovery through completion, and what does Pods do at every step? | review |

### Integrations and Extensibility

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 19 | [[docs/mainnet-planning/19-github-identity-and-proof-integration|GitHub identity and proof integration]] | How does GitHub connect identity, repositories, commits, pull requests, releases, deployments, ownership, and proof without overstating work quality? | review |
| 20 | [[docs/mainnet-planning/20-distribution-integrations|Distribution integrations]] | How do X, Discord, Skool, Telegram, WhatsApp, native sharing, previews, and exports distribute approved work with user control? | review |
| 21 | [[docs/mainnet-planning/21-activity-domain-extension-contract|Activity-domain extension contract]] | Which primitives are universal and which are domain-specific when adding Move, Reading, Study, social, or future activity products? | review |

### Production Architecture

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 22 | [[docs/mainnet-planning/22-data-services-and-background-processing|Data, services, and background processing]] | Which service owns each source of truth, how are projections updated idempotently, and how do failures remain isolated? | review |
| 23 | [[docs/mainnet-planning/23-security-custody-compliance-and-operations|Security, custody, compliance, and operations]] | How are authentication, secrets, treasury authority, limits, moderation, audit, recovery, and operational escalation made production-safe? | review |
| 24 | [[docs/mainnet-planning/24-product-information-architecture-and-routes|Product information architecture and routes]] | How do the approved objects and journeys become a clean mobile information architecture without duplicated destinations or information overload? | review |
| 25 | [[docs/mainnet-planning/25-mainnet-testnet-and-release-topology|Mainnet, Testnet, and release topology]] | How are Mainnet, Testnet, databases, storage, workers, treasuries, domains, feature flags, and release promotion isolated? | review |
| 26 | [[docs/mainnet-planning/26-integrated-mainnet-architecture|Integrated Mainnet architecture]] | How do all locked and candidate decisions connect into one coherent product and technical architecture with explicit invariants? | review |
| 27 | [[docs/mainnet-planning/27-validation-and-implementation-sequence|Validation and implementation sequence]] | Which assumptions require spikes, what proves each subsystem, and in what order can complete usable releases be shipped? | review |

## Dependency Map

```text
Person and Account
-> Profile, Facets, and Privacy
-> Actors, Roles, and Jobs
-> Object Graph and Relationships
-> Access, Consent, and Visibility
-> Commands, Facts, and Audit
-> Event, Organization, Team, Project, Pod, Occurrence, and Proof Lifecycles
-> Participant and Sponsor Economic Lanes
-> Activity, Passport, Rooms, and Attention
-> Build and Ship Protocol and Organizer Operations
-> Actor Journeys and Product Routes
-> GitHub, Distribution, and Future Domain Adapters
-> Data, Security, Custody, and Environment Topology
-> Integrated Architecture
-> Validation Spikes
-> Validated Mainnet v1 Slice
-> Implementation Plan
```

No downstream layer may silently redefine an upstream identity, authority,
relationship, state, privacy, or economic term. A downstream document may add
context-specific detail only while preserving the earlier contract.

## Canonical Product Flow

```text
authenticate
-> establish one Person and account
-> configure private profile and optional public facets
-> discover or create a context
-> create an application, invitation, or contribution intent
-> accept terms and satisfy eligibility, consent, capacity, and funding gates
-> activate the exact relationship and freeze required snapshots
-> enter an Event, Project, or Pod workspace
-> receive a per-person occurrence or milestone requirement
-> lock commitment
-> submit evidence with explicit visibility
-> complete integrity checks, review, clarification, and dispute
-> record one exact terminal outcome
-> calculate participant and sponsor settlements through separate barriers
-> reconcile every transfer to terminal closure
-> project authoritative activity into contextual timelines
-> derive explainable Passport claims and deliberate Shareables
-> complete or archive the bounded context while Person, Team, and Project continuity remains
```

Chat, reactions, notifications, search results, and public pages are
projections around this flow. They never activate a relationship, approve
proof, calculate reputation, or move value.

## Current Discussion

Documents 01 through 04 are locked. Documents 05 through 27 form an internally
reviewed candidate architecture package and remain `review`. There is no active
per-document discussion. The next discussion is Abhinav's proposed Mainnet
product plan, which will be mapped to this package as agreement, amendment,
contradiction, or deferred scope before a Mainnet v1 slice is locked.

## Active Product Reconciliation

The editable
[[docs/mainnet-planning/first-launch-slice-workbook|First Launch Slice Decision Workbook]]
now consolidates the recommended product wedge, complete actor journeys,
first-launch scope, research findings, open choices, and a recommendation for
each choice. It is a proposal for Abhinav's edits, not a locked specification
or implementation plan.

## Final Integration Rule

`26-integrated-mainnet-architecture.md` is a candidate synthesis. It treats
Documents 01 through 04 as locked and Documents 05 through 25 as review
dependencies. It cannot convert a candidate dependency into a locked decision.
Document 27 is likewise a candidate validation and release sequence. No
implementation plan begins until the product-plan reconciliation selects a
coherent Mainnet v1 promise, the affected documents are approved, and their
blocking validation gates are chosen.
