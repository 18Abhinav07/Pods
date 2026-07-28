---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, integrated-architecture, product, technical, invariants, planning]
---

# 26: Integrated Mainnet Architecture

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/04-object-graph-and-memberships|Object graph]] |
[[docs/mainnet-planning/16-build-and-ship-protocol|Build and Ship protocol]] |
[[docs/mainnet-planning/22-data-services-and-background-processing|Service architecture]] |
[[docs/mainnet-planning/27-validation-and-implementation-sequence|Validation sequence]] |
[[HANDOFF]] | [[README]]

## Purpose

Connect the Pods Mainnet planning contracts into one product and technical
architecture without introducing a new object, authority, lifecycle, proof
claim, economic rule, or integration shortcut.

Documents 01 through 04 are locked. Documents 05 through 25 remain review
contracts until Abhinav's product plan and the Mainnet v1 slice are reconciled.
This document is therefore a candidate synthesis, not implementation
authorization.

## Product Thesis

Pods is a network for people and groups to make bounded commitments, show
evidence of progress, collaborate around execution, preserve a trustworthy
activity history, and optionally use a clearly disclosed economic mechanism
to make showing up matter.

It is not:

- a task manager;
- a generic chat platform;
- a proof-of-personhood system;
- a universal reputation score;
- an automatic work-quality judge;
- a wallet with social features;
- a custody product disguised as an accountability application.

Build and Ship is the first complete domain protocol. It gives builders,
Projects, Teams, and Events a coherent execution record without replacing
GitHub, Linear, Notion, Discord, or the community where they already gather.

## Canonical Architecture

```text
Google or GitHub sign-in
          |
     Pods Person
          |
 profile facets, attributes, matching intent
          |
 typed product graph
 Organization, Team, Event, Project, Pod
          |
 roles, memberships, contributions, entries, participation
          |
 frozen Event and Pod contracts
          |
 shared Occurrences + per-person ParticipantOccurrences
          |
 commitments -> evidence -> ProofCase -> ReviewDecision
          |
 domain facts and ActivityMoments
          |
 timelines, rooms, passports, discovery, notifications, shareables
          |
 optional economic contract
          |
 entitlements and provider-neutral ledger
          |
 Nimiq or future validated settlement adapter
```

Every arrow is typed. No position in the diagram grants an implied permission
to the next layer.

## Object and Relationship Model

### Canonical objects

| Object | Durable purpose | Key boundary |
|---|---|---|
| Person | one human continuity across providers, wallets, Projects, Events, and domains | provider and wallet are connections, not identity |
| Organization | durable host or sponsor context | no implicit access to all descendants |
| Team | durable group of people | membership does not enroll work |
| Event | time-bounded program or season | does not copy Projects or Teams |
| Project | durable body of work | Event-specific state remains on EventEntry |
| Pod | focused accountability and execution space | one frozen primary host |

### Relationship families

| Family | Records | Meaning |
|---|---|---|
| Ownership and representation | ownership, role grants, collective representative | authority in exact scope |
| Durable belonging | OrganizationMembership, TeamMembership | ongoing membership |
| Work participation | ProjectContribution | bounded contribution |
| Event participation | EventEntry, EventParticipant | subject entry and person roster |
| Pod participation | PodParticipation | focused execution relationship |
| Hosting and association | typed Organization, Team, Event, Project, Pod edges | explainable graph, no recursive container |
| Intent | application, invitation, connection request, funding intent | provisional request, never active relationship |

Creation, ownership, membership, participation, review, moderation, funding,
beneficiary status, and social relationship remain independent.

## Identity and Profile

1. A Person begins through Google or GitHub authentication.
2. Initial onboarding creates a globally unique username and display name and
   records product consent and age category.
3. Profile facets and structured attributes are optional.
4. Matching intent states what the person currently seeks and expires.
5. Social, repository, wallet, and settlement connections are added later
   through Settings.
6. A provider already linked to another Person is denied. Merge is deferred.
7. Youth may collaborate under the locked restrictions but cannot enter
   initial Mainnet financial modes or global discovery.
8. Public profile, contextual dossier, private profile, and operator view are
   separate DTOs.

## Authority, Consent, and Visibility

Every command evaluates:

```text
actor
+ canonical Person or service identity
+ exact capability
+ exact scope
+ relationship state
+ role grant
+ object and lifecycle state
+ contract version
+ command class
+ consent
+ eligibility
+ conflict
+ visibility
= allow or safe denial
```

There is no graph-based role inheritance.

Source visibility is an upper bound. Context audience, profile-item
visibility, and PublicationGrant can narrow it. They cannot broaden it.

Obligation-preserving and safety-recovery commands survive account or object
restriction where needed to prevent loss, preserve evidence, complete refund,
or resolve an incident.

## Lifecycle Composition

### Event

```text
draft -> configured -> registration_open -> registration_closed
-> activation_review -> scheduled -> active -> finalizing
-> completed -> archived
```

Application and invitation intents are separate from EventEntry.
EventParticipant is separate from both.

### Team and Project

Teams persist across Projects and Events. Projects persist across Events.
Governance blockage is an operational overlay, not a fake lifecycle endpoint.

### Pod

```text
draft -> enrollment_open -> activation_evaluating -> roster_locked
-> active -> final_review -> outcome_ready
-> settling_if_required -> completed -> archived
```

Publishing freezes enrollment terms. Activation freezes roster and schedule
snapshots.

### Occurrence and ParticipantOccurrence

Occurrence is one shared schedule window.

ParticipantOccurrence is one person's obligation and terminal outcome:

```text
scheduled -> commitment_open -> evidence_open
-> review_pending -> terminal
```

Terminal:

- approved;
- rejected;
- timeout protected;
- grace;
- missed;
- cancelled.

This separation lets one participant succeed while another misses the same
scheduled day.

## Proof and Review

1. One ProofCase belongs to one ParticipantOccurrence.
2. Evidence attempts are versioned ProofSubmissions.
3. Evidence items separately select reviewer-only, context-shared, and public
   projection eligibility.
4. Integration data is a SourceObservation, not a proof outcome.
5. Automated checks may flag objective integrity conditions.
6. Human review decides subjective contracts.
7. Every case has bounded participant and platform clocks plus an absolute
   deadline.
8. Platform-owned delay reaches timeout protection.
9. Dispute inactivity reaches grace.
10. ReviewDecision and ParticipantOccurrence outcome change in one
    transaction.
11. Peer reactions and chat never affect the decision.

## Economic Composition

Every Event or Pod chooses one:

- nonfinancial;
- participant-funded commitment;
- sponsor-funded reward;
- hybrid.

Each financial contract uses one asset and one validated adapter.

### Outcome treatment

| Outcome | Principal | Participant bonus | Sponsor reward |
|---|---|---|---|
| approved | protected | eligible | eligible |
| timeout protected | protected | ineligible | ineligible |
| grace | protected | ineligible | ineligible |
| rejected | provisionally forfeited | ineligible | ineligible |
| missed | provisionally forfeited | ineligible | ineligible |
| cancelled | returned | ineligible | ineligible |

If a participant-funded occurrence has no approved recipient, every
provisional forfeiture returns to its original owner.

Participant-funded value uses a `ParticipantCommitmentSettlement` snapshot only
after every in-scope ParticipantOccurrence and dispute window is terminal.
Sponsor-funded value uses a separate `SponsorAwardSettlement` snapshot only
after eligible entries, milestone decisions, judging, cancellations, sponsor
allocation, and unused-fund treatment are terminal. Hybrid mode composes the
two independently conserved entitlement sets without combining their pools or
snapshots. The settlement adapter executes validated entitlements but never
recalculates fairness.

NIM is the intended first Mainnet adapter. Mainnet custody remains blocked
pending Document 23.

## Activity, Passport, and Social Composition

### Activity

Domain facts produce stable ActivityMoments:

- one participant occurrence updates in place from commitment to outcome;
- one milestone updates in place;
- Project and Event views aggregate without inventing facts;
- NarrativeUpdate is authored context, visually distinct from verified facts;
- Shareable is a safe versioned publication snapshot.

### Passport

Passport claims are:

- facet-specific;
- evidence-backed;
- explainable;
- time-bounded;
- explicit about claim basis and denominator.

There is no global score or popularity leaderboard.

### Rooms

Rooms host discussion around work:

- messages and replies;
- encouragement reactions;
- announcements;
- stable ActivityCards;
- moderation tombstones.

Rooms do not own commitments, proof, review, activity, permission, reputation,
or money. Public visitors see curated public activity and announcements, not
the raw member room by default.

### Attention

- Today owns current action.
- Work owns relationship inventory.
- Discover owns eligible opportunity and query-based matching.
- Inbox owns Messages, Requests, and Updates.
- Notifications and realtime only deliver or invalidate projections.

## Build and Ship Product Flow

```text
organizer creates Build Season Event
-> Project or Team applies through EventEntryIntent
-> accepted subject forms EventEntry and person roster
-> Project freezes its Season charter and milestones
-> Project creates focused Pods for workstreams
-> participants join and satisfy Pod contract
-> each scheduled window creates ParticipantOccurrences
-> each person locks a deliverable
-> GitHub or manual source proposes artifacts
-> person selects proof visibility
-> reviewer decides under frozen policy
-> ActivityMoment and Project journey update
-> room discusses the work
-> organizer sees structured Event progress
-> public Shareables communicate selected progress
-> final Project, Event, Passport, and optional settlement outcomes persist
```

The Project remains durable after the Season. The EventEntry preserves
Season-specific roster, result, and award.

## External Integration Boundary

| External system | Provides | Never becomes |
|---|---|---|
| Google or GitHub OAuth | AuthenticationIdentity observation | work-source permission, Person history, or authority |
| GitHubWorkConnection and GitHub App | separately authorized repository access and source observations | login, automatic proof, or code-quality score |
| Nimiq Pay | user wallet interaction | server-side deposit truth |
| Nimiq RPC | chain observation and broadcast | economic policy |
| X, Discord, Skool, Telegram, WhatsApp | user-selected distribution destination | publishing truth without confirmation |
| Future activity provider | scoped source observation | automatic human outcome |

Every adapter has its own grant, receipt, reconciliation, revocation, and
privacy lifecycle.

## Service Architecture

```text
Public and authenticated clients
              |
       Next.js web and BFF
              |
   application command boundary
              |
 authorization + lifecycle + consent
              |
      Postgres transaction
 aggregate + fact + audit + outbox
       /          |           \
projections   integration    economic work
    |             |              |
safe DTOs   GitHub/share   settlement adapter
    |             |              |
UI/realtime observations   chain reconciliation
```

Mainnet begins as a modular monolith with separately deployed durable workers.
All side effects use prepare, persist identity, execute, reconcile, and
terminal closure.

## Source-of-Truth Matrix

| Concern | Authoritative source | Derived consumers |
|---|---|---|
| human identity | Person and AuthenticationIdentity | sessions, profile, actor DTO |
| authority | ownership, role grant, relationship, access decision | route and action projections |
| accepted terms | frozen contract and consent receipt | UI disclosures, policy |
| lifecycle | aggregate state plus domain fact | Today, Work, object pages |
| proof | ProofCase, evidence references, ReviewDecision | ActivityMoment, Passport |
| money | economic contract, ledger, settlement snapshot, transfer leg | funding and settlement UI |
| external source | delivery receipt and SourceObservation | proof proposal, source status |
| activity | domain facts and immutable ActivityEntryVersion | ActivityMoment, contextual timelines, rooms, Passport, Shareables |
| social | conversation and message records | room and Inbox |
| delivery | notification intent and delivery attempt | Updates and badges |
| public story | PublicationGrant and Shareable snapshot | public pages and external handoff |

No derived consumer authorizes an upstream write.

## Failure Ownership Matrix

| Failure | Owning system | Product effect |
|---|---|---|
| provider sign-in unavailable | identity | existing sessions continue where safe; no new sign-in |
| GitHub delayed | integration | source shows delayed; manual proof may remain |
| review delay | review | bounded timeout protection or grace |
| notification failure | attention | canonical action remains in Today |
| room failure | social | work, proof, and settlement continue |
| projection lag | projection | show updating and fetch authoritative state |
| chain RPC outage | settlement adapter | pending or unknown; no fabricated failure |
| signer outage | financial operations | broadcast paused, reconciliation continues |
| custody mismatch | security and finance | new financial action paused |
| public distribution outage | distribution | private activity and completion continue |
| governance loss | object overlay | discretionary governance pauses, obligations continue |

## Integrated Invariants

1. Each Pods account has one canonical Person. Provider linking never silently
   creates or merges another Person. Duplicate established Persons may remain
   separate until a future audited merge capability exists.
2. Provider, wallet, social, and repository accounts are connections.
3. No intent record is an active relationship.
4. No graph edge grants unlisted authority.
5. Collective commands resolve to a human representative or named service.
6. One Pod has one frozen primary host.
7. Published terms freeze before consent or funding.
8. Shared Occurrence and per-person outcome remain separate.
9. ReviewDecision is the only source of a reviewed terminal outcome.
10. Chat and reactions cannot mutate activity, reputation, or money.
11. Source visibility is an upper bound.
12. External observations are never Pods commands.
13. Every financial unit is conserved in integer base units.
14. Protected principal never enters a bonus pool.
15. Settlement adapters execute but do not calculate entitlements.
16. Unknown external effects reconcile before retry.
17. Account restriction cannot erase history or owed value.
18. Service failure remains isolated from unrelated domains.
19. Every external effect has persisted identity and idempotent recovery.
20. Testnet and Mainnet share no authoritative data, secrets, or funds.
21. Youth remain nonfinancial and outside global discovery initially.
22. Mainnet financial activation requires technical and legal gates.
23. GitHub authentication and GitHub work-source authorization remain separate
    grants with independent revocation.
24. A wallet can change financial capability or payout destination only through
    a fresh, purpose-bound, one-time challenge in the current session.
25. Every process and resource proves one immutable environment instance before
    it can serve, lease, observe, sign, or broadcast.
26. ActivityMoment is a rebuildable projection and can never authorize an
    upstream mutation.

## Dependency Order

```text
01 Identity
-> 02 Profile
-> 03 Actors
-> 04 Object graph
-> 05 Access
-> 06 Commands and facts
-> 07-11 Lifecycles, proof, economics
-> 12-15 Activity, Passport, rooms, attention
-> 16-18 Build and Ship and journeys
-> 19-21 Integrations and extensions
-> 22-25 Services, security, IA, environments
-> 26 Integration
-> 27 Validation and release sequence
```

No lower layer may be implemented by copying a higher-layer projection back
into authority.

## Known Mainnet Blockers

- provider-link collision and recovery not validated;
- GitHub App proof integration not validated;
- general command, fact, and outbox model not implemented;
- named operator and role-grant systems not implemented;
- Mainnet custody and signer not selected or approved;
- legal and compliance review not complete;
- Mainnet environment isolation not implemented;
- physical Web Share and realtime gates not complete;
- youth safety and age-assurance policy not complete;
- the Testnet repository persists profiles, social relationships,
  conversations, evidence, settlements, and transfers, but lacks the Mainnet
  Organization, Team, Event, Project, EventEntry, general role-grant, consent,
  canonical-fact, durable-outbox, and isolated-environment architecture.

## Consistency Gate

Before this document can lock, complete and resolve:

- object by owner, actor, lifecycle, visibility, and route matrix;
- command by role, consent, state, command class, and fact matrix;
- proof type by source, privacy, review, and claim matrix;
- economic mode by funder, beneficiary, outcome, refund, custody, and
  settlement matrix;
- fact by projection-consumer matrix;
- environment by service, data, secret, integration, network, and signer
  matrix;
- failure by owner, retry, user state, escalation, and audit matrix.

Any cell without one answer remains an architecture gap.

## Non-goals

- Selecting the final Mainnet v1 slice before Abhinav provides the product
  plan.
- Treating every review document as locked.
- Starting implementation from this synthesis.
- Enabling Mainnet funds.

## Interdependencies

This synthesis consumes every contract in Documents 01 through 25. Documents
01 through 04 are locked inputs. Documents 05 through 25 remain candidate
dependencies whose approval depends on the selected Mainnet v1 promise.
Document 27 validates and sequences only the reconciled subset and may not
weaken any invariant here.

## Review Findings

- Canonical identity, relationships, execution, proof, economics, activity,
  social interaction, integration, and infrastructure have distinct sources
  of truth.
- Application and invitation intents cannot create active relationships.
- Per-person outcomes, participant-funded settlement, and sponsor-award
  settlement remain independent and composable.
- Rooms, notifications, ActivityMoments, Passport, and Shareables are derived
  consumers and cannot authorize upstream changes.
- Every external provider and asset rail is an adapter behind validated
  capability and environment boundaries.
- The architecture remains a candidate until the user product plan selects
  one complete promise and the required spikes pass.

## Closure Condition

Lock only after Abhinav's product plan is reconciled, every selected upstream
document is approved, the consistency matrices have no unanswered cell, and
all architecture-killing and slice-specific spikes required by Document 27
record PASS.
