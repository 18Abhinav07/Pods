---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, validation, spikes, releases, implementation-sequence, planning]
---

# 27: Validation and Implementation Sequence

Status: review

Related: [[docs/mainnet-planning/26-integrated-mainnet-architecture|Integrated architecture]] |
[[docs/mainnet-planning/23-security-custody-compliance-and-operations|Security contract]] |
[[docs/mainnet-planning/25-mainnet-testnet-and-release-topology|Release topology]] |
[[validation/spike-results|Testnet spike results]] |
[[HANDOFF]] | [[README]]

## Purpose

Define what must be proven before Pods can produce an implementation plan,
which architecture failures force redesign, and how independently usable
releases can progress from nonfinancial Mainnet product to controlled
real-value operation.

This is a validation and release-order contract, not the Mainnet v1
implementation plan. The v1 slice will be carved only after Abhinav supplies
his product plan and Documents 05 through 26 are reconciled.

## Gate 0: Planning Reconciliation

Before implementation planning:

1. Reconcile Abhinav's product plan against Documents 01 through 26.
2. Record amendments in every affected upstream and downstream document.
3. Select a candidate Mainnet v1 promise, object set, actor set, and capability
   boundary. Candidate selection does not lock it.
4. Decide which reviewed contracts are candidate v1 dependencies and which
   remain future.
5. Run:
   - terminology review;
   - source-of-truth review;
   - graph cycle and duplication review;
   - actor and role review;
   - access, consent, and privacy review;
   - lifecycle reachability review;
   - proof and review deadline review;
   - financial conservation review;
   - route ownership review;
   - operational ownership review;
   - environment isolation review;
   - current-code contradiction inventory.
6. Update Document 26 with the reconciled candidate and every remaining
   uncertainty.
7. Freeze one candidate Mainnet v1 scope statement for spike selection.

No implementation plan is written after Gate 0 alone. Gate 0 selects what must
be validated.

## Gate 1: Architecture-Killing Spikes

These are first because failure changes the architecture rather than merely
the implementation.

### Spike A: Canonical Authentication and Linking

Prove:

- Google and GitHub sign-in in a normal mobile browser;
- sign-in in Nimiq Pay WebView;
- one provider creates one Person;
- second provider links to the same Person through recent authentication;
- provider already linked to another Person is denied;
- username collision and alias rules;
- session rotation, inactivity, absolute expiry, and revocation;
- recovery code flow;
- account deactivation and pseudonymized continuity;
- no wallet required for nonfinancial use.

Failure returns to Documents 01, 05, 22, 23, and 25.

### Spike B: GitHub App Proof Connection

Prove:

- personal and organization installation;
- selected repositories and minimum permissions;
- public and private repositories;
- GitHub AuthenticationIdentity and GitHubWorkConnection remain separate
  grants;
- revoking work access does not remove login, and unlinking login does not erase
  historical source provenance;
- connected-account attribution with the exact attribution basis;
- unsigned commits, unknown users, unverified email associations, bots,
  coauthors, fork commits, squash merges, and differing author and committer;
- signed webhook receipt and deduplication;
- out-of-order delivery;
- reconciliation after missed webhook;
- repository rename, transfer, deletion, and visibility change;
- uninstall and authorization revocation;
- SourceObservation attachment without automatic acceptance;
- public and Passport claim wording.

Failure returns to Documents 10, 13, 16, 19, 22, and 23.

### Spike C: Durable Command and Work Processing

Prove:

- typed command, aggregate mutation, fact, audit, and outbox in one
  transaction;
- crash before commit;
- crash after commit before dispatch;
- duplicate command;
- duplicate worker delivery;
- concurrent worker leases;
- external timeout with later success;
- projection rebuild;
- poison job quarantine;
- exact correlation from command to recipient-safe projection.

Failure returns to Documents 06, 22, and 26.

### Gate 1 Decision

Spikes A, B, and C are the current architecture-killing set. The reconciled v1
slice may add slice-specific spikes but cannot silently waive one of these.
Every required spike records exact code, inputs, repeated positive and negative
runs, output, and `PASS` or `FAIL` in `validation/spike-results.md`.

- Any `FAIL` returns to the owning architecture documents and keeps the slice
  unlocked.
- After every required spike records `PASS`, amend the affected documents with
  the observed behavior, re-run Gate 0 consistency review, lock the validated
  v1 contracts, and only then write the implementation plan.

No implementation plan is written until every spike required by the selected
slice records `PASS`.

## Gate 2: Independent Product and Platform Spikes

### Information Architecture

- test complete actor and lifecycle route matrix;
- validate signed-out deep links through onboarding;
- validate 320 CSS pixel and wider mobile layouts;
- validate WebView closure and draft recovery;
- validate public metadata privacy;
- prove one NextAction across Today, Inbox, and object pages.

### Activity and Shareables

- stable ActivityMoment updates instead of duplicate cards;
- Project and Event aggregation;
- source correction and Shareable invalidation;
- native Web Share in Nimiq Pay and mobile browsers;
- clipboard and download fallback;
- public link withdrawal and safe unfurls.

### Rooms and Attention

- room access changes;
- ActivityCard source updates;
- message retry and moderation;
- curated visitor projection;
- durable Inbox and Today reconciliation;
- physical realtime test.

SSE is not selected until two real sessions pass:

- foreground delivery p95 under the approved target;
- background and resume;
- connection renewal;
- network interruption;
- cursor replay;
- no loss, duplication, or cross-context leakage.

Polling remains the fallback.

### GitHub and External Distribution

- rate limiting;
- delivery lag;
- safe provider disconnect;
- no private repository leakage;
- no auto-post claim;
- destination-specific text and encoding.

## Gate 3: Security, Operations, and Recovery

Required before public nonfinancial Mainnet beta:

- threat model;
- named operators and MFA;
- role matrix;
- session and account recovery abuse tests;
- private object and media authorization;
- webhook security;
- moderation queue and audit;
- rate limits;
- backup and restore;
- migration rehearsal;
- immutable environment-instance verification across database, storage, web,
  workers, release manifest, OAuth, GitHub App, origin, RPC, treasury, and
  signer;
- distinct public Testnet, Mainnet staging, and Mainnet production GitHub Apps
  where enabled;
- incident modes;
- log and analytics redaction;
- penetration test appropriate to exposed scope.

Required before Mainnet financial beta:

- selected signer and custody architecture;
- key ceremony, rotation, backup, and recovery;
- web and signer separation;
- wallet-binding challenge domain separation, one-time nonce consumption,
  expiry, session binding, replay denial, and payout-destination replacement;
- transaction and treasury limits;
- circuit breaker and reconciliation-only mode;
- wrong network, asset, recipient, amount, and reference;
- duplicate and ambiguous broadcast recovery;
- daily independent liability reconciliation;
- incident exercise;
- qualified legal and compliance approval;
- adult financial activation and jurisdiction policy.

## Gate 4: Economic Rehearsal

Build the new Mainnet architecture on an isolated Testnet environment and
prove every selected v1 mode.

### Participant-funded matrix

- all approved;
- mixed approved and missed;
- rejected;
- timeout protected;
- grace;
- cancelled;
- zero approved recipient restoration;
- deterministic remainder;
- underfilled activation refund;
- cutoff exclusion refund;
- source-account refund;
- destination change before preparation;
- ambiguous refund and payout;
- compensating settlement.

### Sponsor-funded matrix

- fixed reward;
- equal eligible completion;
- no eligible recipient;
- unused sponsor return;
- partial Event cancellation;
- sponsor refund;
- sponsor transfer failure without participant-principal effect.

### Hybrid matrix

- independent participant and sponsor subledgers;
- principal return without sponsor reward;
- participant forfeiture without sponsor-pool mutation;
- sponsor failure without participant-principal mutation;
- full conservation.

Each scenario proves exact integer conservation and user-visible state on two
real wallets where applicable.

## Candidate Independently Usable Releases

This order minimizes rework while producing something useful after each gate.
It remains a candidate until the Mainnet v1 slice is locked.

### Release 1: Identity and Profile

- canonical Person;
- Google and GitHub authentication;
- provider linking and collision denial;
- username and display name;
- sessions and recovery;
- profile shell, facets, attributes, visibility, and matching intent;
- no wallet or money required.

Usable outcome: people can establish one Pods identity and selectively present
what they build or do.

### Release 2: Graph and Nonfinancial Work

- Organizations, Teams, Events, Projects, EventEntries, Pods;
- ownership, role grants, intents, membership, contribution, and
  participation;
- access, consent, frozen nonfinancial contracts;
- Work, Discover, Today, and Inbox foundations.

Usable outcome: groups can form real Project and Event structures without
financial risk.

### Release 3: Build and Ship

- Build and Ship domain package;
- Project charter, workstreams, milestones, and focused Pods;
- ParticipantOccurrence and commitment loop;
- manual artifacts and review;
- GitHub App observations;
- ActivityMoments and Project journey;
- public Shareables and Builder Passport.

Usable outcome: competition Projects can coordinate, show evidence, and
publish a coherent build history.

### Release 4: Organizer Season

- Event and EventEntry flows;
- Project application and activation;
- structured organizer console;
- review operations;
- Event pulse, highlights, judging packet, and recap;
- nonfinancial or externally fulfilled awards only until economics passes.

Usable outcome: a community can run a Build Season without reading every room
or manually rebuilding progress.

### Release 5: Social and Distribution

- Project, Pod, and Team rooms;
- relationships and message requests;
- curated visitor projections;
- notifications and digests;
- native share and external handoff;
- moderation and safety operations.

Usable outcome: Pods becomes a recurring execution network rather than a
static proof archive.

### Release 6: Economic Testnet Rehearsal

- selected economic modes;
- provider-neutral accounts and ledger;
- Nimiq adapter;
- complete deposit, refund, settlement, payout, and recovery matrix;
- Mainnet-shaped operations without Mainnet value.

Usable outcome: real end-to-end financial behavior is proven without risking
Mainnet funds.

### Release 7: Controlled Mainnet Beta

- adult-only financial access;
- NIM only initially;
- invite or allowlist;
- low per-person, per-contract, and treasury caps;
- named operations coverage;
- daily reconciliation;
- explicit canary authorization;
- immediate financial circuit breaker.

Usable outcome: a deliberately bounded cohort uses real NIM under a validated
operating model.

### Release 8: Public Mainnet v1

Only after:

- controlled beta evidence;
- no unresolved high-severity incident;
- custody and legal approval;
- complete mobile actor journeys;
- backup and incident rehearsal;
- public support and operations readiness;
- approved expansion decision.

## Reusable Testnet Evidence

The existing frozen Testnet product has already provided valuable evidence:

- schedule materialization across daylight-saving changes;
- private S3-compatible evidence storage;
- Nimiq Testnet inbound observation and reference attribution;
- macro-block finality behavior used by the Testnet flow;
- transaction-hash replay protection;
- integer-Luna settlement conservation;
- deterministic remainder handling;
- persist-before-broadcast payout behavior;
- ambiguous-hash reconciliation;
- payout idempotency;
- visitor DTO redaction;
- separate Testnet release branch and deployment.

These results reduce repeated discovery. They do not approve Mainnet identity,
custody, environment, legal, or operational boundaries.

Physical realtime reliability remains unvalidated.

## Current-Code Contradiction Ledger

1. Wallet address is the current canonical user identity.
2. Google and GitHub authentication do not exist.
3. Provider linking, aliases, recovery codes, and Mainnet session policy do not
   exist.
4. Profile visibility and attributes are narrower than the locked profile
   contract.
5. Profiles, social relationships, conversations, evidence, settlements, and
   transfers persist, but the Mainnet Organization, Team, Event, Project,
   EventEntry, general role-grant, consent, canonical-fact, and durable-outbox
   object model does not.
6. Current membership combines application, funding, allocation, roster, and
   Pod participation concerns.
7. Creator authority is central rather than general role grants.
8. Shared Occurrence and ParticipantOccurrence are not separate.
9. GitHub URLs are syntactically accepted rather than App-observed.
10. Fixed templates are not ActivityDomain packages.
11. General commands, domain facts, and transactional outbox do not exist.
12. Worker processing is coarse and sequential.
13. Operations use a shared session secret.
14. Many user-linked records cascade-delete.
15. Runtime and capabilities explicitly reject Mainnet.
16. Current treasury signing is Testnet-only.
17. Mainnet object routes do not exist.
18. Shareables and publication receipts do not exist.
19. Physical realtime remains unvalidated.
20. Testnet settlement code cannot become Mainnet by changing the network
    variable.

## Proof Required Per Release

Every release records:

- exact scope;
- accepted contracts;
- architecture decisions;
- test and property results;
- mobile browser and Nimiq Pay evidence;
- accessibility result;
- privacy and authorization matrix;
- migrations and rollback result;
- deployment commit and schema;
- known limitations;
- incident owner;
- explicit approval.

A route, button, or feature flag is not evidence that a capability works.

## Stop Conditions

Return to architecture when:

- provider linking can create duplicate Persons;
- a projection can authorize a mutation;
- an intent can bypass relationship activation;
- a state machine has unreachable or orphaned money state;
- proof and outcome can diverge;
- a platform-owned delay can forfeit a person;
- economic conservation fails;
- an unknown external effect can be blindly retried;
- private data crosses a projection or environment boundary;
- Testnet and Mainnet can share data or signer state;
- a release depends on an unapproved legal or custody assumption.

## Next Product Decision

Abhinav supplies his Mainnet product plan.

The next planning action is then:

```text
map each proposed capability to Documents 01-26
-> identify agreement, amendment, and contradiction
-> define one coherent Mainnet v1 user promise
-> choose the minimum complete object and actor set
-> select architecture-killing and slice-specific spikes
-> execute and record PASS or FAIL
-> amend architecture for every failure
-> lock the validated slice only after all required spikes pass
-> write the implementation plan
```

No implementation begins before that reconciliation.

## Interdependencies

This sequence consumes Documents 01 through 26 and the selected user product
plan. Each spike returns failures to its named owning documents. A PASS may
support locking only the exact capability and environment tested.

## Review Findings

- Product-plan reconciliation precedes v1 slice selection.
- Candidate selection precedes spike selection but does not authorize an
  implementation plan.
- Authentication and linking, GitHub work integration, and durable command
  processing are architecture-killing spikes for the current candidate.
- Product, security, economic, environment, and physical-client gates add to
  that set according to the selected slice.
- Every release must be independently usable and evidence-backed.
- No implementation plan exists until all required spikes record PASS and the
  validated slice is then locked.

## Closure Condition

Lock the sequence after the candidate Mainnet v1 promise names its exact
actors, objects, capabilities, required spikes, evidence owners, stop
conditions, and approval authority. Execute those spikes before writing the
implementation plan.
