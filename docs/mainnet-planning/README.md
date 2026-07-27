---
created: 2026-07-27
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

Each subject is discussed, decided, recorded, and reviewed before the next
dependent subject begins. The final architecture will connect the locked
documents rather than reinterpret them.

## Working Method

1. Work on exactly one numbered document at a time.
2. Begin with the smallest durable object and move outward through
   relationships, lifecycles, experiences, integrations, and infrastructure.
3. Record alternatives, the selected decision, invariants, permissions, data,
   commands, domain facts, state machines, failure cases, and deferred scope.
4. Mark unresolved decisions explicitly. Never carry an ambiguity silently
   into a later document.
5. A later document may reference an earlier locked decision but may not
   override it without recording an amendment in both documents.
6. Do not create empty numbered files. Create a file only when its discussion
   begins.
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
| 01 | [[docs/mainnet-planning/01-person-account-and-identity|Person, account, and identity]] | What is a person in Pods, how do they authenticate, connect identities, recover access, and retain continuity? | active |
| 02 | `02-profile-facets-and-privacy.md` | How does one person represent builder, movement, reading, and future facets without fragmented identities or forced public exposure? | queued |
| 03 | `03-actors-roles-and-jobs.md` | Which human, collective, and system actors exist, what may each do, and what does Pods do for each of them? | queued |
| 04 | `04-object-graph-and-memberships.md` | How do people, organizations, teams, Events, Projects, Pods, and memberships relate without recursive or duplicated ownership? | queued |
| 05 | `05-access-consent-and-visibility.md` | How are authorization, inheritance, creator ceilings, contributor choice, consent snapshots, invitations, and visitor access enforced? | queued |
| 06 | `06-commands-domain-facts-and-audit.md` | How are actor intent, authoritative changes, automation, causation, visibility, and audit history represented once? | queued |

### Core Lifecycles

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 07 | `07-event-lifecycle.md` | How does an Event move from creation through enrollment, execution, review, settlement, completion, cancellation, and archival? | queued |
| 08 | `08-team-and-project-lifecycles.md` | How do durable teams and Projects form, participate in Events, evolve across Events, withdraw, complete, and archive? | queued |
| 09 | `09-pod-occurrence-and-commitment-lifecycles.md` | How do focused Pods schedule work and move occurrences and commitments through every valid state? | queued |
| 10 | `10-proof-verification-and-review.md` | How are evidence, automated checks, human judgment, clarification, disputes, privacy, and final outcomes handled? | queued |
| 11 | `11-economic-modes-treasury-and-settlement.md` | How do participant-funded, sponsor-funded, and hybrid contracts custody, conserve, refund, reward, settle, and reconcile value? | queued |

### Product Experience and Derived Systems

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 12 | `12-activity-ledger-timelines-and-shareables.md` | How does one authoritative activity fact produce clean Pod, Project, Event, person, and public timelines without duplicating chat noise? | queued |
| 13 | `13-passports-reputation-and-discovery.md` | How is evidence-backed, facet-specific reputation derived, explained, protected from gaming, and used to help people connect? | queued |
| 14 | `14-social-rooms-and-relationships.md` | How do rooms, messages, replies, reactions, follows, connections, invitations, moderation, and archives support activity without becoming authoritative state? | queued |
| 15 | `15-notifications-digests-and-realtime.md` | Which changes deserve immediate attention, which are summarized, and how do clients recover from delayed or missed delivery? | queued |

### Build and Ship Product Domain

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 16 | `16-build-and-ship-protocol.md` | Which foundation rules, proof types, milestones, Pod structures, incentives, and reputation semantics make Build and Ship a complete product domain rather than a template? | queued |
| 17 | `17-organizer-seasons-and-operations.md` | How does an organizer run a Build Season across many Projects without reading every room or manually assembling progress and payouts? | queued |
| 18 | `18-participant-project-and-visitor-journeys.md` | What does each Build and Ship actor do from discovery through completion, and what does Pods do at every step? | queued |

### Integrations and Extensibility

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 19 | `19-github-identity-and-proof-integration.md` | How does GitHub connect identity, repositories, commits, pull requests, releases, deployments, ownership, and proof without overstating work quality? | queued |
| 20 | `20-distribution-integrations.md` | How do X, Discord, Skool, Telegram, WhatsApp, native sharing, previews, and exports distribute approved work with user control? | queued |
| 21 | `21-activity-domain-extension-contract.md` | Which primitives are universal and which are domain-specific when adding Move, Reading, Study, social, or future activity products? | queued |

### Production Architecture

| Order | Document | Question it must answer | Status |
|---|---|---|---|
| 22 | `22-data-services-and-background-processing.md` | Which service owns each source of truth, how are projections updated idempotently, and how do failures remain isolated? | queued |
| 23 | `23-security-custody-compliance-and-operations.md` | How are authentication, secrets, treasury authority, limits, moderation, audit, recovery, and operational escalation made production-safe? | queued |
| 24 | `24-product-information-architecture-and-routes.md` | How do the approved objects and journeys become a clean mobile information architecture without duplicated destinations or information overload? | queued |
| 25 | `25-mainnet-testnet-and-release-topology.md` | How are Mainnet, Testnet, databases, storage, workers, treasuries, domains, feature flags, and release promotion isolated? | queued |
| 26 | `26-integrated-mainnet-architecture.md` | How do all locked decisions connect into one coherent product and technical architecture with explicit invariants? | queued |
| 27 | `27-validation-and-implementation-sequence.md` | Which assumptions require spikes, what proves each subsystem, and in what order can complete usable releases be shipped? | queued |

## Current Discussion

The only active document is `01-person-account-and-identity.md`. It will not be
created until the identity alternatives and required decisions have been
discussed. All later subjects remain queued even when they are mentioned during
the identity discussion; such observations are recorded as dependencies, not
silently decided early.

## Final Integration Rule

`26-integrated-mainnet-architecture.md` may synthesize only locked decisions.
`27-validation-and-implementation-sequence.md` begins only after the integrated
architecture has passed consistency, security, financial conservation,
privacy, and scope review.
