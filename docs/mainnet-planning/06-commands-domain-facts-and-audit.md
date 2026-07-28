---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, commands, domain-events, audit, projections, planning]
---

# 06: Commands, Domain Facts, and Audit

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/03-actors-roles-and-jobs|Actor and role contract]] |
[[docs/mainnet-planning/04-object-graph-and-memberships|Object graph]] |
[[docs/mainnet-planning/05-access-consent-and-visibility|Access contract]] |
[[HANDOFF]] | [[README]]

## Purpose

Represent user intent, authoritative state change, external observations,
automation, money, and presentation once. Chat messages and read models never
become accidental sources of truth.

## Command Contract

Every mutation enters through a typed command envelope containing:

- command type and schema version;
- unique command and idempotency IDs;
- authenticated actor and represented collective when applicable;
- canonical subject, exact target, and requested capability;
- expected aggregate version or explicit concurrency policy;
- client creation time as diagnostic metadata and trusted server receipt time;
- correlation and causation references;
- policy, consent, contract, and authorization-decision references;
- safe request metadata needed for security and audit.

Command handlers:

1. authenticate and authorize against Document 05;
2. load the exact aggregate and version;
3. validate invariants and state transition;
4. persist authoritative changes, domain facts, ledger entries, and an outbox
   record in one transaction;
5. return the same logical result for a repeated idempotency key;
6. never call an external provider inside the authoritative database
   transaction.

## Fact Types

### Domain facts

Immutable past-tense records such as `PodPublished`,
`EventEntryActivated`, `CommitmentLocked`, `ProofSubmitted`,
`ReviewApproved`, `SettlementCalculated`, and `OwnershipTransferred`.

Each fact records aggregate, aggregate version, actor or service identity,
policy and contract references, server time, causation, visibility
classification, and an allowlisted payload.

### External observations

Provider facts such as a GitHub webhook, chain transaction, media scan, or
delivery result remain observations until a domain policy accepts them.
`CommitObserved` never means `WorkApproved`; `TransactionObserved` never means
`DepositCredited`.

### Audit facts

Security decisions, role changes, consent, moderation, operator action,
exceptions, and denied sensitive commands use an immutable audit record with
safe reason codes. Audit presentation may redact sensitive payloads without
changing the underlying authoritative record.

### Financial ledger

Money is represented by append-only balanced ledger entries and immutable
transfer attempts, not by mutable balance fields or generic domain facts.
Document 11 owns the accounting contract.

## Projection Contract

1. Timelines, profiles, rooms, search, notifications, dashboards, and public
   pages are derived projections.
2. A projection records its source cursor or fact version and can be rebuilt.
3. Projection handlers are idempotent by source fact.
4. Presentation may lag but may never invent a state ahead of authoritative
   data.
5. A stale financial projection links to authoritative status rather than
   guessing.
6. Public projections apply visibility at projection time and store only
   allowlisted fields.
7. One source fact may feed several contextual projections, but copied
   projections never become independent authority.

## Concurrency and Time

- Optimistic version checks protect aggregate decisions.
- Serializable or equivalent locking protects capacity, username, roster,
  settlement, and ledger invariants.
- Server time is authoritative for deadlines.
- The audited Clock command exists only in isolated testing and controlled
  demonstration environments.
- Direct database timestamp or lifecycle edits are prohibited.
- Late external observations are recorded with both source and receive time
  and resolved through explicit policy.

## Automation

Every automated command records:

- the service actor;
- triggering fact and policy version;
- scheduled or observed source time;
- retry count and idempotency identity;
- resulting fact or terminal failure.

Workers may propose or execute only commands in their capability policy.
Human override requires a named command, authorized role, permitted source
state, reason, and preserved original result.

## Privacy, Retention, and Deletion

- Domain facts use canonical IDs rather than embedding provider secrets,
  emails, wallet addresses, media bytes, or raw private evidence.
- Sensitive values live in purpose-specific stores referenced by opaque IDs.
- Account deletion produces a deleted-person projection while preserving
  legally and contractually required attribution.
- Redaction creates a new redaction fact and projection behavior. It never
  edits prior facts silently.
- Schema evolution uses versioned payloads and explicit upcasting or migration.

## Product Flow Impact

- Every visible status has one authoritative source and explainable history.
- Refresh, reconnect, background workers, and multi-device use converge on the
  same state.
- Activity cards update in place from stable source IDs instead of creating
  duplicate chat messages.
- Users can inspect meaningful consent, review, financial, and ownership
  history without receiving internal secrets.
- Operators act through named recovery commands, not direct database edits.

## Failure Boundaries

- Outbox delivery failure delays projections but does not roll back accepted
  state.
- External provider timeout remains pending or unknown until reconciliation.
- Duplicate webhooks, wallet callbacks, button taps, and worker retries do not
  duplicate facts or money.
- Projection corruption is repaired by replay and never by mutating source
  facts.
- Unknown schemas stop the affected consumer and raise operations attention
  rather than discarding data.
- Audit-storage failure blocks sensitive mutation.

## Interdependencies

Consumes Documents 01 through 05. Documents 07 through 11 define their command
and fact vocabularies using this envelope. Documents 12 through 15 consume
facts into product projections. Documents 19 and 20 contribute external
observations. Document 22 implements transactional storage and workers.
Document 23 defines audit access and incident retention.

## Review Findings

- External data is never promoted to product truth by ingestion alone.
- Financial entries stay separate from social and activity projections.
- Every automated or collective action remains attributable.
- Rebuildable projections solve refresh consistency without duplicating
  authority.
- The design does not require full event sourcing for every aggregate. It
  requires immutable facts for meaningful transitions plus conventional
  current-state tables.

## Closure Condition

Lock after each lifecycle document maps its commands and facts to this
contract, the ledger boundary is consistent with Document 11, and Document 22
proves transactional outbox, idempotency, replay, and failure isolation.
