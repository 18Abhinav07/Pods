---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, domains, extensions, templates, move, architecture, planning]
---

# 21: Activity Domain Extension Contract

Status: review

Related: [[docs/mainnet-planning/04-object-graph-and-memberships|Object graph]] |
[[docs/mainnet-planning/09-pod-occurrence-and-commitment-lifecycles|Pod lifecycle]] |
[[docs/mainnet-planning/10-proof-verification-and-review|Proof contract]] |
[[docs/mainnet-planning/16-build-and-ship-protocol|Build and Ship protocol]] |
[[HANDOFF]] | [[README]]

## Purpose

Define how Pods can add Move, Reading, Study, Practice, social participation,
and future activity products without fragmenting identity, cloning the Pod
engine, weakening proof semantics, or turning a template configuration into
arbitrary executable product logic.

Build and Ship is the first complete ActivityDomain package. Move is the next
candidate, not an assumed Mainnet v1 feature.

## Universal Core

The following belong to Pods core and are never reimplemented by a domain:

- Person and profile facets;
- Organization, Team, Event, Project, Pod, and relationship graph;
- role grants and representation;
- access, visibility, consent, and eligibility;
- commands, domain facts, audit, and outbox;
- Event, Project, Team, Pod, occurrence, and commitment lifecycle primitives;
- reviewer assignment, clarification, dispute, and terminal outcome mechanics;
- economic mode, entitlement, ledger, and settlement adapter boundaries;
- ActivityMoment, Shareable, Passport, room, notification, and public
  projection primitives;
- storage authorization, moderation, retention, and release topology.

## ActivityDomainPackage

Every domain is a versioned, reviewed product package containing:

- stable domain key and semantic version;
- supported host objects;
- participant and organizer jobs;
- allowed cadence rules;
- commitment schema;
- evidence schema;
- artifact and source adapters;
- review policy vocabulary;
- terminal outcome mapping;
- allowed visibility options;
- eligible ActivityMoment projections;
- Passport signal definitions;
- economic mode compatibility;
- safety and eligibility policy;
- presentation tokens and media;
- migration and deprecation policy;
- validation evidence.

The package is data and reviewed code owned by Pods. It is not user-supplied
code.

## Configuration Boundaries

Creators may configure only package-approved choices:

- title and description;
- date range and timezone;
- allowed cadence;
- occurrence deadline inside allowed bounds;
- one of the package's commitment structures;
- approved evidence requirements;
- review authority where the package permits it;
- visibility up to the package ceiling;
- compatible economic mode and validated limits;
- capacity and application questions;
- visitor and publication options where permitted.

Creators may not:

- write arbitrary validation code;
- define an unbounded dynamic form;
- change the meaning of approved, rejected, grace, or timeout protection;
- make chat reactions count as proof;
- introduce unsupported assets or settlement rails;
- override safety, youth, consent, conflict, or privacy rules;
- create an unwinnable or deliberately ambiguous financial contract;
- convert private evidence into public content.

## Frozen Domain Contract

Publishing an Event or Pod freezes:

- domain package key and version;
- selected configuration;
- schedule and timezone rules;
- commitment and evidence schema;
- review and dispute rules;
- economic compatibility and exact terms;
- visibility and visitor terms;
- participant disclosures.

A package update never changes an active frozen contract. New contracts use the
new version. Security fixes may restrict unsafe behavior, but they cannot
silently reinterpret an owed entitlement or completed result.

## Data Model

Core lifecycle and relationship columns remain relational and typed.
Domain-specific bounded payloads may use validated JSON data with:

- package version;
- schema version;
- size and nesting limits;
- enumerated fields;
- canonical serialization;
- migration function;
- public projection allowlist.

No domain may hide financial, visibility, authority, lifecycle, or ownership
state inside opaque JSON.

## Adapter Contract

A domain may declare source adapters such as:

- GitHub for Build and Ship;
- an approved movement provider for Move;
- a document or reading source for Reading;
- calendar or session observations for Study.

An adapter produces a SourceObservation only. The domain package maps that
observation into an evidence proposal. Review and terminal outcome remain Pods
authority under Documents 09 and 10.

Every adapter declares:

- exact claim vocabulary;
- authentication and permission model;
- stable source identity;
- refresh and reconciliation behavior;
- privacy and retention;
- offline and delayed-source behavior;
- spoofing and attribution limitations;
- validation gate.

## Presentation Contract

A domain may supply:

- an accent palette;
- imagery and motion direction;
- iconography;
- commitment and evidence affordances;
- domain-specific progress visualization;
- copy vocabulary.

It may not change:

- core navigation;
- semantic status colors;
- financial safety states;
- authorization feedback;
- accessibility minimums;
- terminal outcome meaning;
- responsive and reduced-motion requirements.

The result should feel purpose-built for each activity without becoming a
different application.

## Economic Compatibility

Each package explicitly allows one or more modes from Document 11:

- nonfinancial;
- participant-funded commitment;
- sponsor-funded reward;
- hybrid.

Compatibility requires domain-specific review of:

- meaningful completion unit;
- reasonable evidence burden;
- verifier conflict risk;
- participant comprehension;
- abuse and collusion surface;
- refund and cancellation semantics;
- legal and age constraints.

A package may remain nonfinancial even when the core settlement engine exists.

## Package Lifecycle

```text
proposal
-> research
-> contract_draft
-> technical_validation
-> safety_and_economic_review
-> internal_pilot
-> testnet_or_nonfinancial_beta
-> available
-> deprecated
-> retired
```

An unavailable package cannot be selected through a hidden flag or arbitrary
API input.

## Build and Ship Package

Build and Ship is the reference implementation because it already defines:

- Project and Event relationship;
- workstreams and focused Pods;
- artifact vocabulary;
- GitHub source integration;
- occurrence and milestone distinction;
- team collaboration;
- public build story;
- evidence-backed Builder Passport signals;
- all four economic modes at the product-contract level.

It must pass its own end-to-end validation before its internals are generalized
into a framework.

## Move Package Candidate

Move should not be reduced to "fitness with a photo." Its later research must
define:

- actual user segments, such as general movement, run crews, or event
  challenges;
- cadence and completion semantics;
- manual, device, and provider evidence;
- distance, duration, attendance, or session units;
- health-data privacy;
- device and account attribution limits;
- injury, safety, weather, and accessibility exceptions;
- organizer-funded and participant-funded suitability;
- falsification and collusion boundaries;
- public profile and share wording.

Until those questions and source adapters pass validation, Move remains a
future package and is not represented as Mainnet-ready.

## Extension Review Checklist

Before a new package becomes available:

1. The user problem and recurring use case are evidenced.
2. It reuses universal core rather than cloning it.
3. Every configuration field has a defined product purpose.
4. Every commitment has one understandable terminal path.
5. Every evidence field has privacy and review semantics.
6. Every source claim states what it does and does not prove.
7. Every economic mode preserves Document 11 invariants.
8. Every public projection respects Document 05.
9. Every signal is explainable under Document 13.
10. Every failure has a user-visible recovery or terminal state.
11. Every state is reachable and no funds or obligations can become orphaned.
12. The package passes mobile, accessibility, abuse, and operator workflows.

## Failure States

- package unavailable;
- package version retired;
- configuration invalid;
- adapter not connected;
- source delayed;
- evidence requirement unsupported;
- economic mode incompatible;
- creator attempts prohibited customization;
- active contract references deprecated package;
- projection cannot render package version.

## Non-goals

- A marketplace for third-party executable plugins.
- Arbitrary custom forms in initial Mainnet.
- User-authored validation scripts.
- One generic template with changed icons.
- Launching several shallow activity categories.
- Allowing domain presentation to redefine core semantics.

## Interdependencies

- Documents 01 through 06 own identity, graph, permission, and facts.
- Documents 07 through 11 own reusable lifecycle, proof, and economics.
- Documents 12 through 15 own reusable projections and interaction.
- Document 16 is the reference complete domain.
- Documents 19 and 20 provide optional source and distribution adapters.
- Document 22 owns package boundaries and workers.
- Document 23 owns security, data classification, and legal gates.
- Document 24 owns shared information architecture.
- Document 25 owns environment availability.
- Documents 26 and 27 decide when the package system itself is validated.

## Review Findings

- Domain packages extend evidence, cadence, review, presentation, and optional
  adapters without creating another identity or settlement engine.
- The core lifecycle remains stable across Build and Ship, Move, Reading, and
  future domains.
- Declarative packages cannot execute user-authored code or weaken privacy,
  review, or economic invariants.
- A new domain must be deep enough to pass complete user and operator journeys,
  not merely change labels and artwork.

## Closure Condition

Lock after one non-Build domain package proves versioning, evidence privacy,
terminal-state reachability, accessibility, package retirement, contract
continuity, and economic compatibility without adding domain conditionals to
the canonical core.
