---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: nimiq
tags: [mainnet, security, custody, compliance, operations, treasury, planning]
---

# 23: Security, Custody, Compliance, and Operations

Status: review

Related: [[docs/mainnet-planning/01-person-account-and-identity|Identity contract]] |
[[docs/mainnet-planning/05-access-consent-and-visibility|Access contract]] |
[[docs/mainnet-planning/11-economic-modes-treasury-and-settlement|Economic contract]] |
[[docs/mainnet-planning/22-data-services-and-background-processing|Service architecture]] |
[[HANDOFF]] | [[README]]

## Purpose

Define the security and operating boundary required before Pods may handle
Mainnet identity, private evidence, moderation, sponsor funds, participant
commitments, refunds, or payouts.

This document identifies requirements and validation gates. It does not assert
that custody, legal, compliance, privacy, age-assurance, or Mainnet launch
approval already exists.

## Trust Boundaries

1. Google or GitHub authenticates a Pods Person.
2. A wallet signature proves control of one settlement address for an
   explicit purpose. It does not create the Person or become their public
   identity.
3. Pods application policy authorizes product commands.
4. Review policy determines activity outcomes.
5. Economic policy calculates entitlements.
6. The financial ledger records value obligations.
7. A settlement adapter observes and executes on a selected rail.
8. A signer or custody system controls keys.
9. Named operators handle exceptions through scoped grants.
10. External providers remain untrusted observations until verified.

No boundary may silently assume the authority of another.

## Account Security

- OAuth state, nonce, PKCE where supported, exact callback origins, and
  provider account IDs are required.
- Session IDs rotate after sign-in, provider linking, recovery, role
  elevation, and sensitive account change.
- Document 01's inactivity and absolute session limits apply.
- Recent authentication is required for provider linking, recovery-code
  rotation, wallet binding, financial activation, payout-address changes,
  security changes, account deletion, and operator elevation.
- Recovery codes are one-time, hashed, and rate-limited.
- Provider collision denies linking rather than merging identities.
- Login, link, recovery, and wallet-signature attempts have account, address,
  device, and network-aware abuse controls without making device fingerprint a
  canonical identity.
- Account restriction preserves access to required refund and payout status.

## Wallet-Binding Challenge Protocol

A wallet signature proves control only for the exact server-issued challenge
and action. It is never a reusable login signature, generic consent, financial
authorization, or permanent proof of ownership.

The canonical signed challenge contains:

- Pods Person ID;
- immutable environment instance ID;
- public origin and domain;
- settlement network;
- normalized wallet address;
- explicit purpose and requested action;
- payout destination, deposit intent, or financial contract ID when applicable;
- cryptographically random one-time nonce;
- issued-at timestamp;
- short expiry;
- current authenticated session binding;
- challenge schema and policy version.

The server:

1. creates the nonce inside the authenticated session;
2. persists its purpose, expiry, and unused state;
3. constructs or validates the exact domain-separated message;
4. verifies the signature, address, network, origin, environment, Person,
   session, purpose, target record, and policy version;
5. atomically consumes the nonce with the authorized command;
6. rejects replay, cross-environment use, cross-origin use, stale sessions,
   changed targets, and reused generic signatures.

Changing a payout address requires recent reauthentication plus a fresh
purpose-specific challenge. A signature created for sign-in, proof, a deposit,
or another contract cannot activate financial capability or replace a payout
destination. Challenge messages, signatures, and wallet bindings remain
private security records.

## Operator Separation

Named operators use MFA and explicit expiring grants.

| Operator class | May do | Must not do |
|---|---|---|
| Support | inspect safe account state, guide recovery, open incident | impersonate, view private proof by default, alter outcomes |
| Reviewer | access assigned evidence, decide under contract | control treasury, edit contract, browse unrelated proof |
| Moderator | handle reports, suppress presentation, restrict contact | rewrite activity, review, entitlement, or ledger facts |
| Integration operator | inspect deliveries and reconcile connections | alter source observations to favor a user |
| Financial operator | reconcile deposits and transfers, pause rails | change review outcomes or entitlement math |
| Security operator | respond to account and system incidents | receive universal product mutation access |
| Auditor | read approved immutable history | perform operational mutations |

Dual authorization is required for exceptional financial actions above
approved limits, signer or treasury changes, and irreversible production
security operations.

Support cannot create a user session, use a universal bypass, or submit a
command as another Person.

## Data Classification

Every record receives one class:

- public;
- internal;
- private person;
- context confidential;
- reviewer evidence;
- financial;
- security secret;
- youth restricted.

Each class defines:

- storage and encryption;
- query authorization;
- log redaction;
- notification preview;
- export eligibility;
- retention;
- deletion or pseudonymization;
- operator access;
- breach response.

Private evidence, credentials, recovery codes, wallet bindings, signer
material, raw financial observations, and youth records never enter analytics
or public search.

## Treasury and Signer Separation

The current Testnet pattern of one shared treasury and a raw private key in a
protected local file or Railway secret is not approved for Mainnet.

Mainnet requires an explicitly selected signer and custody design with:

- documented asset and network scope;
- key-generation ceremony;
- backup and recovery;
- credential rotation;
- signer isolation from web;
- destination, transaction, daily, and aggregate exposure limits;
- circuit breaker and reconciliation-only mode;
- immutable signing-attempt identity;
- allowlisting where compatible with product flows;
- dual authorization for exceptional transfers;
- independent balance and obligation reconciliation;
- incident and disaster-recovery runbook;
- named owner and secondary coverage;
- tested signer unavailability and compromise response.

The web service never receives signer credentials.

## Settlement Adapter Security

Every adapter implements the conceptual sequence from Documents 11 and 22:

```text
deposit intent
-> independently observed transaction
-> network and asset validation
-> finality
-> ledger credit
-> entitlement
-> prepared transfer attempt
-> persisted immutable transaction identity
-> signature
-> broadcast
-> independent reconciliation
-> confirmed or manual review
```

For Nimiq, the Mini App provider is a user-facing wallet interface, while
server-side chain observation and transaction handling require independent
RPC connectivity. The public API reference documents injected Nimiq and
Ethereum providers for Mini Apps.

Source:
https://www.nimiq.com/developers/mini-apps/api-reference

Nimiq RPC exposes transaction lookup and raw transaction broadcast operations
for server-side services.

Source:
https://www.nimiq.com/developers/rpc/

Required rules:

- wrong network, asset, recipient, amount, sender constraint, or reference
  enters exception review;
- a client callback never credits money;
- finality policy is versioned per adapter;
- a signed transfer is persisted before broadcast;
- ambiguous broadcast reconciles immutable transaction identity before any
  new signing attempt;
- entitlement is never recomputed inside the adapter;
- adapter outage cannot mutate review or activity;
- manual adjustment uses balanced ledger entries and named authorization;
- chain data cannot reveal private Pods product context through an avoidable
  memo.

## Financial Risk Controls

Before controlled Mainnet beta:

- adult financial activation only;
- supported jurisdictions only;
- NIM only unless another adapter passes independently;
- per-deposit, per-person, per-Pod, per-Event, daily transfer, and total
  treasury caps;
- maximum contract duration;
- bounded sponsor reward;
- no charity routing until legal and beneficiary validation;
- no organizer-controlled custody in initial Mainnet;
- no mixed-asset contract;
- no automatic rail fallback;
- explicit incident pause;
- owed refunds and reconciliation remain operable during pause;
- daily liabilities versus assets reconciliation;
- exception aging and escalation.

Limits are server-enforced policy records, not environment-only UI flags.

## Legal and Compliance Validation

Qualified review must determine, for selected launch jurisdictions and exact
economic modes:

- custody, safeguarding, money-transmission, payment-service, and
  consumer-protection obligations;
- sanctions and restricted-jurisdiction controls;
- KYC, age assurance, source-of-funds, and transaction-limit requirements;
- competition, prize, forfeiture, tax, and charity treatment;
- enforceability and disclosure of participant commitments and reviewer
  authority;
- refunds, unclaimed funds, abandoned accounts, and charge or reversal
  treatment;
- Nimiq Pay and infrastructure-provider Mainnet conditions;
- privacy impact, retention, data-subject rights, and cross-border processing;
- youth access, guardian verification, communication safety, and discovery;
- sponsor and organizer responsibilities.

Until this review passes, Mainnet financial features remain unavailable even
if technical code exists.

## Moderation and Safety Operations

- reporting is available on profiles, public content, messages, and public
  object projections;
- emergency and ordinary reports have different queues;
- evidence access is least privilege and time-bound;
- moderation hides or restricts presentation without rewriting immutable
  contract, work, review, or ledger facts;
- blocking stops optional contact but not shared obligations;
- appeals and operator actions retain audit attribution;
- content safety, malware, and media validation occur before broader
  distribution;
- youth contact and discovery remain disabled initially;
- rate limits are durable and scoped by action risk;
- abuse controls cannot silently seize or redirect funds.

## Incident Modes

Named modes:

- normal;
- elevated monitoring;
- new financial actions paused;
- settlement broadcast paused;
- reconciliation only;
- social posting paused;
- integration isolated;
- account security hold;
- full maintenance.

Each mode defines:

- authorized activator;
- exact blocked and permitted capabilities;
- user-facing copy;
- operator alerts;
- exit criteria;
- audit fact.

No incident mode deletes, redirects, or recalculates an owed entitlement.
Transfer execution may enter a disclosed security or legal hold when required.
The person retains access to the amount, reason category, responsible
escalation path, and next review point. A hold cannot change destination or
beneficiary, remain indefinite without named escalation, or be represented as
paid. Where technically and legally possible, already owed funds continue to
transfer.

## Audit and Reconciliation

Operators can reconstruct:

```text
actor or service
-> command
-> policy and consent version
-> aggregate version
-> domain fact
-> outbox job
-> external attempt
-> external receipt
-> ledger entry
-> current projection
```

Financial reconciliation compares:

- on-chain treasury assets;
- finalized but uncredited observations;
- credited participant and sponsor liabilities;
- protected principal;
- provisional forfeiture;
- finalized entitlements;
- prepared and broadcast transfers;
- confirmed payouts and refunds;
- fees and explicit adjustments.

Any difference becomes an incident, not an automatic balancing mutation.

## Required Technical Validation

- formal threat model;
- OAuth and provider-link collision tests;
- wallet challenge domain separation, expiry, replay, target change,
  cross-session, cross-origin, cross-environment, and cross-network rejection;
- payout-address replacement with recent reauthentication and one-time nonce
  consumption;
- session fixation and recovery abuse;
- operator MFA and least-privilege matrix;
- secret scanning and dependency review;
- forged and replayed webhook delivery;
- object-key and signed-URL leakage;
- public DTO and metadata leakage;
- backup restoration;
- signer rotation and unavailability;
- wrong-network and wrong-treasury startup;
- RPC disagreement and finality anomaly;
- duplicate and ambiguous broadcast recovery;
- conservation property tests;
- circuit breaker and reconciliation-only exercise;
- complete audit reconstruction;
- privacy and deletion exercise;
- external penetration test before public Mainnet financial use.

## Current Testnet Contradictions

- canonical users are wallet-first;
- sessions use a seven-day fixed expiry rather than the locked Mainnet policy;
- operations authorization uses a shared session secret;
- reviewer identity can be represented as an operator string;
- the worker accepts a raw Nimiq private key from environment or local file;
- one shared Testnet treasury is used;
- many user-linked records cascade-delete;
- named operators, provider identities, recovery codes, consent receipts, and
  general role grants do not exist;
- runtime and capabilities explicitly reject Mainnet.

## Non-goals

- Enabling Mainnet with the current Testnet key.
- Treating a Railway secret as complete custody architecture.
- Universal administrator access.
- Mainnet youth financial participation.
- USDT before independent rail validation.
- Claiming legal approval from an architecture document.

## Interdependencies

- Documents 01 through 05 own identity, eligibility, authority, and consent.
- Document 06 owns immutable attribution.
- Document 10 owns review authority and conflict handling.
- Document 11 owns economic math and ledger conservation.
- Document 19 owns GitHub credentials and webhook security.
- Document 22 owns process and storage boundaries.
- Document 25 owns environment isolation.
- Document 27 converts every unresolved security or legal premise into a
  blocking validation gate.

## Review Findings

- Mainnet custody cannot reuse the Testnet environment-key model.
- Consumer, reviewer, moderator, organizer, sponsor, and financial-operator
  authority remain separately granted and audited.
- Restriction and incident response pause discretionary risk without erasing
  evidence, refunds, entitlements, or reconciliation.
- Data classes, retention, deletion, and public DTOs follow purpose rather
  than table convenience.
- Technical architecture cannot substitute for custody, sanctions, tax,
  consumer-protection, youth-safety, or jurisdiction review.

## Closure Condition

Lock only after custody and signer selection, legal and compliance review,
named operator controls, limits, incident runbooks, backup recovery,
penetration testing, privacy exercises, and financial fail-safe rehearsals
record explicit PASS for the selected Mainnet scope.
