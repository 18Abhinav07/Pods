---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, passports, reputation, discovery, matching, planning]
---

# 13: Passports, Reputation, and Discovery

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/02-profile-facets-and-privacy|Profile contract]] |
[[docs/mainnet-planning/04-object-graph-and-memberships|Object graph]] |
[[docs/mainnet-planning/12-activity-ledger-timelines-and-shareables|Activity ledger]] |
[[HANDOFF]] | [[README]]

## Purpose

Help people find trustworthy collaborators and communities through
explainable, facet-specific evidence without reducing a person to a global
score or rewarding wealth, popularity, and constant posting.

## Passport Model

One Person has one Passport shell inside the one profile shell from Document
02. The Passport contains independently visible facet views over eligible
ActivityMoments. A facet view or extract can be shared separately, but it is
not a second Passport, identity, account, or route owner.

The Passport may show:

- selected structured attributes and active matching intent;
- completed Projects, Events, and Pods;
- sample size, time window, role, and protocol for each metric;
- approved or independently observed artifacts;
- consistency, completion, collaboration, review, or organizer indicators;
- selected milestones, references, and public story;
- the locked top-level claim basis:
  `self_declared`, `connected_source`, `evidence_backed`, or `derived`;
- an exact provenance subtype such as `connected_source.github_commit`,
  `evidence_backed.reviewer_approved`,
  `evidence_backed.organizer_awarded`, or
  `derived.build_submission_timeliness`.

Build, Move, Reading, and future facets have separate Passport views and
semantics. No universal Pods reputation score exists.

## Reputation Signals

Signals must be:

1. derived from terminal authoritative facts;
2. contextual to a protocol, role, and time window;
3. accompanied by sample size and claim basis;
4. independent of stake size, wallet balance, follower count, and payment
   volume;
5. recomputable after correction or policy version change;
6. private until the person enables a safe projection.

Examples:

- Build submission record: submitted by deadline, manually approved,
  timeout-protected, grace, rejected, and missed counts shown separately with
  one explicit denominator.
- Shipping history: linked releases, deployments, demos, or accepted artifacts
  with provider and review basis.
- Collaboration: completed shared Projects, contextual roles, and retained
  teammate acknowledgements.
- Organizer record: terminal Events completed, published-rule conformance,
  cancellation resolution, and payout completion.
- Reviewer record: terminal review-deadline performance and decisions changed
  after dispute, shown only where safe and statistically meaningful.

Timeout protection and grace cannot be labeled verified. Rejection and missed
outcomes remain in private calculations where relevant but are not turned into
public punishment.

Active unresolved exceptions are operational signals in Document 17, not
Passport reputation.

## Discovery and Matching

Discovery combines:

- public profile and facet visibility;
- structured taxonomy attributes from Document 02;
- active, expiring matching intent;
- requested context such as Event, Project, role, skill, pace, distance, or
  availability;
- relationship and safety policy;
- contextual evidence signals where the person exposed them.

Results state why they match, such as `Rust + backend + open to Cycle II`.
There is no opaque compatibility percentage.

Global discovery is query-first and bounded. It is not a complete member
directory. Youth remain excluded from global discovery in the initial
Mainnet product.

## Anti-Gaming

- One source fact contributes once per defined signal.
- Repeated low-effort occurrences cannot inflate unrelated skill claims.
- Self-review, duplicate accounts, circular endorsements, collusive Pod
  outcomes, imported history, and provider identity changes receive explicit
  controls or lower claim basis.
- Minimum samples apply before comparative labels.
- Time-sensitive signals show recency or decay rather than permanent ranking.
- Users can inspect and appeal incorrect source attribution.
- Search ordering balances relevance, availability, safety, and diversity; it
  does not sell hidden reputation rank.
- A person may hide a complete signal but cannot publish a ratio with
  unfavorable eligible outcomes removed from its denominator.

## Connections and References

Private references or teammate acknowledgements may be requested after shared
context. They remain distinct from evidence verification and cannot grant
roles or contact permission. A reference records context, relationship,
visibility, and revocation policy.

## Product Flow

1. A person enables a facet and structured attributes.
2. Activity produces private eligible signals.
3. The person previews and publishes selected passport sections.
4. They activate a time-bounded matching intent.
5. Others search by need and receive explainable matches.
6. A profile or passport leads to follow, connection request, Project
   invitation, Team invitation, or Event application according to policy.

## Failure and Safety Boundaries

- No activity produces a public passport automatically.
- Sparse data displays facts, not speculative quality labels.
- A disconnected integration removes the current connected indicator and
  stops future observation. Historical artifacts retain the exact provider,
  integration identity, policy version, and accepted claim basis they had when
  observed. Only a claim that explicitly requires a currently live connection
  becomes unavailable.
- Blocking and visibility changes remove discovery promptly.
- Moderation can suppress unsafe presentation while correction of source facts
  follows Document 06.
- Passport unavailability never blocks participation or settlement.

## Interdependencies

Consumes Documents 02, 04, 05, 06, and 12. Document 14 controls contact.
Document 16 defines Build and Ship signals. Document 19 defines GitHub claim
basis. Document 21 defines domain-specific metrics. Documents 22 and 23 own
projection integrity, abuse controls, and appeals. Document 24 owns discovery
routes.

## Review Findings

- Reputation remains useful for team formation without becoming one punitive
  number.
- Money cannot buy a better passport.
- Attribute search, matching intent, and evidence remain distinct.
- Organizer and reviewer reliability are accountable without exposing private
  participant cases.

## Closure Condition

Lock after each domain defines meaningful signals, anti-gaming tests, minimum
sample behavior, appeal mechanics, and public projection rules.
