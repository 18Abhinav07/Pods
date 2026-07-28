---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, architecture, services, data, workers, reliability, planning]
---

# 22: Data, Services, and Background Processing

Status: review

Related: [[docs/mainnet-planning/06-commands-domain-facts-and-audit|Command and fact contract]] |
[[docs/mainnet-planning/11-economic-modes-treasury-and-settlement|Economic contract]] |
[[docs/mainnet-planning/19-github-identity-and-proof-integration|GitHub integration]] |
[[docs/mainnet-planning/23-security-custody-compliance-and-operations|Security contract]] |
[[HANDOFF]] | [[README]]

## Purpose

Assign every authoritative record, projection, integration, and side effect to
one service boundary so retries are safe, failures remain isolated, and the
Mainnet product can evolve without prematurely becoming a distributed
microservice system.

## Architecture Choice

Mainnet begins as a modular monolith with separately deployed workers:

- one Next.js web application for public pages, authenticated product
  surfaces, and an application-facing API;
- one TypeScript domain and application layer shared through packages;
- one Postgres cluster as the transactional source of truth;
- one S3-compatible object store with separate policy classes;
- one or more Node.js worker processes consuming durable work;
- external adapters for GitHub, distribution, notification, and settlement;
- independent operations authorization even if operations pages initially
  share the web deployment.

Logical module boundaries are strict in code and data access, but they do not
receive independent databases or network services until load, ownership, or
security evidence justifies that split.

## Logical Modules

| Module | Owns | Does not own |
|---|---|---|
| Identity | Person, provider connections, sessions, recovery, account state | profile claims, wallet balances |
| Profile | profile facets, attributes, discovery consent, matching intent | authoritative participation |
| Graph | objects, typed relationships, ownership, role grants, membership | lifecycle outcomes |
| Access | policy evaluation, consent receipts, eligibility decisions | UI visibility alone |
| Lifecycle | Event, Team, Project, Pod, occurrence, commitment states | proof bytes, transfer broadcast |
| Review | submissions, evidence references, assignments, decisions, disputes | reputation projections |
| Economics | economic contracts, deposit intents, entitlements, ledger, settlement runs | signer secrets |
| Activity | ActivityMoment, timelines, Shareables | source facts |
| Passport | signal definitions, derived claims, discovery index | raw proof |
| Social | rooms, messages, relationships, moderation presentation | work outcomes or money |
| Attention | notification intents, digests, realtime cursors | underlying action state |
| Integrations | external connections, receipts, observations, reconciliation | Pods commands or judgments |
| Operations | exception queues, named grants, incidents, audit access | universal mutation authority |

## Command Transaction

Every authoritative mutation follows one application path:

```text
authenticated actor
-> typed command
-> input and version validation
-> authorization, consent, eligibility, conflict, and lifecycle policy
-> transaction lock or optimistic-version check
-> aggregate mutation
-> domain fact and audit fact
-> outbox work
-> commit
-> projection response
```

The aggregate row, domain fact, audit attribution, and outbox record are
committed in one Postgres transaction. An external call never occurs while
that transaction is open.

## Persistence Boundaries

### Aggregate State

Normalized tables optimized for validating the next command:

- current object and relationship state;
- active role grants;
- current lifecycle state and version;
- current consent and eligibility references;
- current proof and review status;
- current economic contract and entitlement status.

### Domain Facts

Append-only records from Document 06 explaining what changed, why, and through
which command. Facts do not need to contain complete reconstructive snapshots
for every profile edit, but they must preserve contract, activity, review,
authority, and financial causation.

### Financial Ledger

Append-only, integer-denominated ledger records from Document 11. The ledger
cannot be reconstructed from UI status tables or chain scans alone.

### External Receipts

Webhook deliveries, chain observations, provider responses, and delivery
attempts are immutable receipts. A receipt becomes a Pods fact only through a
validated command or worker policy.

### Object Storage

Stores bytes only. Postgres owns:

- record owner and exact context;
- object key or opaque reference;
- media class;
- byte hash and size;
- content type and validation result;
- visibility class;
- retention;
- encryption or storage-policy class;
- upload and deletion state.

Reviewer evidence, context-shared media, avatars, public share assets, and
direct-message media use separate authorization and retention policies.

## Durable Work

### Outbox

Every post-commit job begins as a durable outbox row containing:

- work type and version;
- aggregate and fact reference;
- idempotency key;
- availability time;
- attempt count;
- lease owner and expiry;
- state;
- safe failure classification;
- correlation and causation IDs.

### Processing

Workers:

1. lease bounded batches using database-safe concurrent selection;
2. verify the job version and current authority;
3. perform a deterministic local effect or one external operation;
4. persist result and follow-up work;
5. mark terminal, retryable, unknown, quarantined, or manual review;
6. release or expire the lease.

Processing is at least once. Product effects become exactly once at the Pods
domain boundary through uniqueness constraints, persisted attempt identity,
and idempotent commands.

### Scheduled Work

Schedules create commands rather than mutating rows directly:

- registration and cutoff transitions;
- occurrence opening and closing;
- review timeouts;
- Event and Pod finalization;
- integration reconciliation;
- notification and digest preparation;
- settlement and transfer reconciliation;
- retention and storage cleanup.

Production time comes from a trusted server clock. The audited Clock command
remains local and Testnet-only validation infrastructure.

## Worker Isolation

Use independently observable processors even if they share a deployment:

- lifecycle processor;
- review-timeout processor;
- projection processor;
- GitHub and external-integration processor;
- notification and digest processor;
- storage processor;
- deposit and chain-observation processor;
- settlement processor;
- transfer broadcaster;
- transfer reconciler.

Each processor has its own:

- lease key;
- concurrency limit;
- retry policy;
- backlog and age metrics;
- circuit breaker;
- quarantine or manual-review queue;
- health status.

One poisoned GitHub delivery cannot stop payouts. One signer outage cannot
stop chat or nonfinancial work. One notification outage cannot change a
deadline.

## Projection Contract

Projections are recipient-safe read models:

- app and public DTOs;
- Today;
- Work;
- Event, Project, and Pod summaries;
- ActivityMoment and timeline;
- Passport and discovery;
- room and message lists;
- Updates and digest;
- operations queues.

Rules:

1. A projection cannot authorize a command.
2. Every projection records its source cursor or last fact.
3. Projection handlers are idempotent.
4. Rebuilds occur from domain facts plus authoritative current records where
   the fact model is intentionally partial.
5. A lagging projection says `updating` or retrieves the authoritative state.
   It never invents a terminal result.
6. Public and private DTO builders remain separate allowlists.
7. Projection consumers cannot query raw tables through generic serialization.

## Realtime Transport

Postgres and HTTP reconciliation remain durable truth.

Initial contract:

- client fetches the current recipient-safe projection;
- server may emit an authenticated change hint;
- client refetches or advances by cursor;
- clients reconcile on mount, foreground, reconnect, and network recovery;
- cursor gaps trigger a full bounded refresh;
- polling remains the production fallback.

SSE is selected only after the physical reliability gate in Document 27 passes
inside Nimiq Pay and supported browsers. `pg_notify`, SSE, and client callbacks
are hints, not durable queues.

## External Side-Effect Pattern

Every external side effect uses:

```text
prepare intent
-> persist immutable attempt identity
-> execute or broadcast
-> record immediate result
-> reconcile independently
-> confirm, retry, quarantine, or manual review
```

The pattern applies to:

- settlement transfers;
- refunds;
- GitHub API reconciliation;
- future direct social publishing;
- email or push delivery;
- public media generation.

Unknown is a first-class state. A timeout never means the operation did not
happen.

## Data Deletion and History

- Person deactivation and deletion use Documents 01 and 05.
- Historical contractual, review, contribution, and financial records become
  pseudonymized rather than cascade-deleted where retention is required.
- Social and optional profile content follows its shorter deletion policy.
- Object deletion is usually archival or tombstoning after publication.
- Raw integration receipts and abandoned uploads have bounded retention.
- Destructive jobs are independently auditable and retry-safe.

## Observability

The public health surface exposes only:

- liveness;
- a safe release identity;
- environment identity.

Schema compatibility, process role, worker compatibility, per-processor health,
oldest pending work age, quarantine and manual-review counts, projection lag,
integration availability, and signer availability are operational information.
They are available only through authenticated, role-scoped operations
observability and alerts. Public readiness never reveals backlog shape, security
posture, financial-rail state, or incident detail.

Logs use correlation, command, fact, job, and attempt IDs. They exclude
credentials, raw private proof, raw webhook payloads, wallet secrets, and
private object keys.

## Required Validation Gate

- crash before transaction commit;
- crash after commit but before outbox dispatch;
- duplicate client command;
- duplicate worker delivery;
- two workers leasing the same logical effect;
- concurrent ownership, seat, commitment, and settlement commands;
- external timeout followed by success;
- projection rebuild;
- poison job and quarantine;
- database lock contention;
- object storage outage and orphan cleanup;
- database backup, restore, and point-in-time recovery;
- old and new process overlap during migration;
- multi-instance worker leasing;
- public DTO redaction;
- per-processor circuit breaker;
- physical realtime gate.

## Current Testnet Contradictions

The existing Testnet product is reference behavior, not this architecture:

- most state is mutated through large repository modules;
- there is no general command envelope, domain-fact store, or transactional
  outbox;
- `realtime_events` is conversation-oriented rather than a durable work
  system;
- several worker cycles execute sequentially within one coarse process health
  loop;
- worker processors do not expose independent backlog and quarantine
  contracts;
- current user foreign keys often cascade-delete product history;
- profiles, social relationships, conversations, evidence, settlements, and
  transfers already have persistent Testnet records, but the Mainnet object
  graph does not yet persist Organizations, Teams, Events, Projects,
  EventEntries, general role grants, consent receipts, canonical domain facts,
  or a durable transactional outbox.

## Non-goals

- Independent service and database for every module in Mainnet v1.
- Kafka or a distributed event platform before measured need.
- Event-sourcing every mutable draft.
- Performing external calls inside authoritative transactions.
- Treating realtime delivery as source of truth.

## Interdependencies

- Document 06 owns command, fact, receipt, audit, and causation vocabulary.
- Documents 07 through 11 own lifecycle and financial state.
- Documents 12 through 15 own projections and recipient experiences.
- Documents 19 and 20 define integration and distribution jobs.
- Document 21 defines versioned domain packages.
- Document 23 owns operational separation and security.
- Document 25 owns deployment and schema compatibility.
- Document 26 synthesizes these module boundaries.
- Document 27 validates them before implementation planning.

## Review Findings

- A modular monolith with separately deployed workers preserves clear domain
  ownership without premature service fragmentation.
- Commands, aggregate changes, facts, ledger entries, and outbox records share
  one transaction where required.
- Every external effect has a persisted identity, bounded retry, reconciliation,
  quarantine, and owning processor.
- Realtime and projections remain replaceable delivery systems, never
  authority.
- Processor-specific health and circuit breakers prevent one integration from
  stopping unrelated obligations.

## Closure Condition

Lock only after Spike C proves crash recovery, duplicate handling, concurrent
leases, transactional outbox behavior, projection replay, poison-work
quarantine, schema compatibility, and complete causation across the selected
Mainnet v1 commands.
