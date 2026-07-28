---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, profiles, privacy, facets, planning]
---

# 02: Profile, Facets, and Privacy

Status: locked

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/01-person-account-and-identity|Canonical identity]] |
[[HANDOFF]] | [[README]]

## Scope

This document defines how one canonical Pods person presents themselves across
Build and Ship, Move, Reading, Study, and future activity domains without
creating fragmented identities or forcing private participation into public
view.

It covers:

- The private editable profile
- The public profile shell
- Optional activity facets
- Section and item visibility
- Public profile discovery
- Youth privacy defaults
- Provider and external-link presentation
- Profile editing, moderation, and deactivation

It does not define actor permissions, relationship mechanics, activity-ledger
facts, reputation formulas, messaging permissions, domain-specific proof
contracts, or service architecture. Those belong to later planning documents.

## Inherited Locked Constraints

1. Every profile belongs to one opaque canonical Pods person.
2. Google, GitHub, wallets, email addresses, and chain identities are private
   connections unless an explicit safe projection is approved.
3. Display name is editable and non-unique. Username is the stable,
   case-insensitive human namespace governed by Document 01.
4. Previous usernames redirect through the current profile's privacy rules.
5. Profile setup and financial setup remain separate.
6. Youth accounts are eligible for non-financial collaboration but require
   stronger privacy and contact defaults.
7. Deleting or hiding a profile must not rewrite authoritative activity,
   financial, review, or audit history.
8. A profile may display derived or referenced activity but never owns the
   authoritative source fact.

## Design Goal

The profile must answer three questions without becoming a resume form:

1. Who is this person?
2. What kinds of activity do they choose to be known for?
3. Which evidence-backed work or participation have they chosen to expose?

One person may be a builder, runner, reader, organizer, reviewer, or several of
these at once. Facets organize presentation and discovery. They never create a
second account, identity, reputation owner, or permission boundary.

## Locked Decisions

Every decision below was approved on 2026-07-28. The labels describe the
selected contract, not unresolved alternatives.

### Profile architecture

1. **One shell or separate profiles**

   Locked decision: use one profile shell with optional facets. Never create
   separate builder, movement, reading, or organizer profiles.

2. **Core editable fields**

   Locked decision: support avatar, display name, username, short headline,
   biography, optional general location, private timezone, and approved
   external links. Keep skills, activity preferences, goals, and availability
   inside facets rather than the global profile.

3. **Field limits**

   Locked decision: headline up to 80 characters, biography up to 300
   characters, general location up to 80 characters, and at most six external
   links. Do not collect a precise home address or live location.

4. **Avatar behavior**

   Locked decision: offer an art-directed Pods avatar library and a sanitized
   user upload with crop controls. Provider avatars may be suggested privately
   but are never published automatically.

### Facets and extensibility

5. **Facet activation**

   Locked decision: facets are opt-in and appear only after the person enables
   them. Activity may suggest a relevant facet, but cannot publish or enable it
   automatically.

6. **Facet extension contract**

   Locked decision: every facet has a stable type, schema version, enabled
   state, summary, visibility, display order, and domain-owned fields. Adding a
   future activity domain extends this contract without changing the canonical
   person or core profile table.

7. **Initial facets**

   Locked decision: launch the profile framework with `builder` as the complete
   Mainnet facet. Keep `move`, `reading`, `study`, and `create` registered but
   unavailable until their product domains are designed.

8. **Builder facet content**

   Locked decision: include a builder summary, selected roles, selected skills,
   collaboration interests, availability signal, linked GitHub projection,
   and references to chosen Projects or public artifacts. Exact skill
   taxonomies remain extendable.

9. **Facet ordering**

   Locked decision: let the person choose a primary facet and reorder enabled
   facets. The primary facet affects presentation, not permissions or a global
   reputation score.

10. **Facet removal**

    Locked decision: disabling a facet hides its presentation and discovery
    projection but does not delete its source activity. Re-enabling it restores
    the eligible projection.

### Public profile composition

11. **Public profile structure**

    Locked decision: show a compact identity header, enabled public facets,
    selected public work, selected participation, and later derived
    evidence-backed signals. Do not render every Pod message or activity event
    as profile content.

12. **Showcase model**

    Locked decision: allow up to six pinned references to public Projects,
    Events, approved artifacts, or later shareables. Store stable references,
    not copied titles, images, metrics, or proof records.

13. **Reputation presentation**

    Locked decision: do not introduce one global Pods score. Later reputation
    is facet-specific, evidence-backed, explainable, and owned by Document 13.
    This profile document defines only where approved projections may appear.

14. **Profile completeness**

    Locked decision: use contextual setup prompts instead of a public
    completion percentage. An incomplete profile remains usable and is never
    penalized in ranking.

### Visibility and discovery

15. **Visibility levels**

    Locked decision: use four explicit levels for eligible profile sections and
    items: `private`, `shared_context`, `connections`, and `public`.
    `shared_context` means people who share an authorized Event, Project, Pod,
    or team context.

16. **Default adult visibility**

    Locked decision: a new adult profile is private until the person explicitly
    publishes it. Publishing the shell does not automatically publish facets,
    participation, work, or external links.

17. **Private-profile route behavior**

    Locked decision: an existing private username resolves to a minimal
    `This profile is private` state, while an unknown username returns not
    found. Neither state reveals activity, relationships, providers, or age
    tier.

18. **People discovery**

    Locked decision: only explicitly public adult profiles appear in global
    people search. Private profiles remain reachable only through authorized
    shared contexts and direct username entry.

19. **Search-engine indexing**

    Locked decision: all profiles use `noindex` initially. A later explicit
    opt-in may allow a public adult profile to be indexed after abuse and
    removal controls are validated.

20. **Participation visibility**

    Locked decision: participation is hidden by default and published per
    Event, Project, or Pod. A person cannot expose participation when the
    source object's access policy forbids public projection.

21. **Proof and artifact visibility**

    Locked decision: raw proof and reviewer-only evidence never appear on a
    profile. Only an approved, sanitized public artifact or shareable can be
    selected, and selection requires explicit action by its owner.

22. **Live activity**

    Locked decision: current availability or active-building signals are
    optional and coarse. Never expose exact live location, device status, or a
    precise presence timeline.

### Youth safety

23. **Youth profile default**

    Locked decision: youth profiles are private, excluded from global search
    and search-engine indexing, and expose only the minimum identity needed
    inside authorized shared contexts.

24. **Youth public publishing**

    Locked decision: do not ship globally public youth profiles in the initial
    Mainnet release. A future guardian-approved publishing mode requires
    validated age assurance, consent, moderation, contact restrictions, and
    jurisdiction rules.

25. **Age disclosure**

    Locked decision: never display exact age, birth date, age tier, guardian
    identity, or guardian-consent state on profiles.

### Providers, links, and verification

26. **Provider presentation**

    Locked decision: Google is never a public badge. A linked GitHub identity is
    displayed only when the person enables the builder projection. Email,
    provider subject identifiers, and wallet addresses never appear.

27. **External links**

    Locked decision: support a bounded allowlist of HTTPS website and social
    links. Ownership-verified integrations receive a source-specific
    `Connected` indicator. Manually entered links never receive a verification
    badge.

28. **Verification language**

    Locked decision: avoid a universal verified-person badge. State exactly
    what is verified, such as `GitHub account connected` or `Artifact ownership
    verified`.

### Editing, moderation, and privacy feedback

29. **Editing model**

    Locked decision: profile edits publish immediately after validation. Keep a
    bounded private moderation history, but do not expose public edit history.
    Show an accurate preview before publishing a private section or facet.

30. **Moderation**

    Locked decision: profiles support reporting, blocked-name enforcement,
    image sanitation, text and link safety checks, and auditable operator
    action. Operators may hide unsafe presentation but cannot rewrite source
    activity or financial records.

31. **Profile analytics**

    Locked decision: provide privacy-preserving aggregate profile views to the
    owner, delayed and thresholded where necessary. Do not expose a named list
    of profile viewers.

32. **Customization**

    Locked decision: allow avatar, optional cover image, and a small curated
    accent selection. Do not allow custom CSS, arbitrary layouts, autoplay
    media, or facet-specific identities.

### Attribute-based discovery and matching

33. **Structured facet attributes**

    Locked decision: each facet supports typed attributes such as `role`,
    `skill`, `interest`, `activity`, `goal`, and `experience`. Attributes
    belong to the facet projection, not the canonical identity record.

34. **Curated and extensible taxonomy**

    Locked decision: globally filterable attributes come from a managed,
    versioned taxonomy with aliases and canonical identifiers. A person may
    suggest a custom attribute, but it remains display-only until reviewed or
    mapped to a canonical entry.

35. **Claim basis**

    Locked decision: every exposed attribute identifies whether it is
    `self_declared`, `connected_source`, `evidence_backed`, or `derived`.
    Connected activity may support a claim but must not be described as proof
    of professional competence.

36. **Attribute visibility and discovery consent**

    Locked decision: every attribute follows the profile visibility levels.
    Only public, explicitly discovery-enabled attributes enter global search.
    Visibility alone does not imply that the person accepts contact.

37. **Matching intent**

    Locked decision: a person separately opts into intents such as `open to
    teams`, `open to collaboration`, `open to mentoring`, `looking for
    training partners`, or `available for this Event`. An intent has a scope
    and optional expiry so availability does not remain stale.

38. **Explainable contextual matching**

    Locked decision: matching combines a person's eligible facet attributes,
    a Team, Project, or Event requirement, and current matching intent.
    Initial matching uses transparent filters and human-readable reasons, not
    an opaque compatibility score. Youth matching is limited to authorized
    shared contexts.

## Profile Data Ownership

### Canonical editable profile

Owns the person's avatar reference, display name projection, headline,
biography, optional general location, private timezone, external-link
references, customization choices, and publication state.

### Facet profile

Owns the facet type, schema version, enabled state, summary, primary and display
order, domain-owned fields, selected attribute references, visibility, and
discovery state.

### Matching intent

Owns the intent type, facet, scope, optional Event or Project context, start and
expiry time, visibility, and active state. It does not create membership or
grant contact permission by itself.

### Taxonomy and claim projection

The taxonomy owns canonical attribute identifiers, categories, labels,
aliases, versions, and moderation state. A person's claim projection owns the
selected attribute, claim basis, visibility, and source reference when one
exists.

### Public profile projection

The public projection is an allowlisted derivative of the editable profile,
enabled facets, eligible attributes, selected references, and later approved
reputation signals. It never reads a private source object directly at render
time.

## Locked Invariants

1. One person has one profile shell regardless of how many facets they enable.
2. A facet never becomes a separate identity, authentication record, or
   permission boundary.
3. Adult and youth profiles begin private.
4. A source object's visibility is an upper bound on every profile projection.
5. Raw proof, reviewer evidence, email, wallet addresses, provider subjects,
   age facts, and guardian facts never enter a public profile projection.
6. Self-declared and evidence-backed attributes remain visibly distinct.
7. Only explicitly discovery-enabled public attributes enter global search.
8. Matching intent is separate from attribute visibility and contact
   permission.
9. Initial matching is explainable and contains no universal compatibility
   score.
10. Youth profiles and attributes never enter global discovery in the initial
    Mainnet product.
11. Disabling a facet or hiding a profile does not delete source activity.
12. Profile pins and showcases store references, not copied authoritative
    records.
13. No universal Pods reputation score is introduced by the profile system.
14. Public profile DTOs are built from explicit allowlists.

## Deferred Dependencies

- Actor roles and system permissions belong to Document 03.
- Object ownership and membership visibility belong to Document 04.
- Visibility inheritance and consent snapshots belong to Document 05.
- Timeline and shareable selection rules belong to Document 12.
- Reputation derivation belongs to Document 13.
- Relationships, blocking, and contact permissions belong to Document 14.
- Build and Ship profile fields are finalized with Document 16.
- External provider verification belongs to Documents 19 and 20.
- Data storage, projections, caching, and deletion execution belong to
  Documents 22 and 23.

## Closure

All 38 profile, facet, privacy, attribute, discovery, and matching decisions
required for the initial Mainnet profile contract are resolved. Youth defaults
remain compatible with Document 01, and every public surface is derived from
an explicit allowlisted projection rather than a private source record.
