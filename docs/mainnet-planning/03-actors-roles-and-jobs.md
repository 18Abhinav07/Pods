---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, actors, roles, jobs, authority, planning]
---

# 03: Actors, Roles, and Jobs

Status: locked

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/01-person-account-and-identity|Canonical identity]] |
[[docs/mainnet-planning/02-profile-facets-and-privacy|Profile contract]] |
[[HANDOFF]] | [[README]]

## Scope

This document defines the human, collective, service, and platform actors that
participate in Pods, the contextual roles they may hold, the separations
between those roles, and the job Pods must perform for each actor.

It does not define the complete object graph, membership state machines,
authorization matrix, proof-review workflow, economic contract, or system
services. Those later documents consume the actor vocabulary locked here.

## Inherited Locked Constraints

1. Roles attach to the canonical Pods person or an explicitly modeled service
   or collective actor. They never create another personal identity.
2. Public profile facets and attributes do not grant authority.
3. Youth accounts cannot perform initial Mainnet financial roles.
4. Hiding, restricting, suspending, or deleting an account cannot erase
   historical attribution or interrupt existing financial obligations.
5. Social relationships, discovery matches, and reputation signals are not
   authority grants.
6. Every public or private projection remains bounded by source visibility.

## Design Goal

Pods must avoid the overloaded `admin` pattern where creating an object
silently makes someone participant, verifier, sponsor, beneficiary, moderator,
and financial controller. Each responsibility must be named, scoped, granted,
audited, and removable independently.

## Locked Decisions

Every decision below was approved on 2026-07-28. The labels describe the
selected contract, not unresolved alternatives.

### Role model

1. **Contextual roles**

   Locked decision: roles are scoped to the platform, a collective, Event,
   Project, Team, or Pod. No product-domain role becomes a universal identity
   label.

2. **Independent authority dimensions**

   Locked decision: model governance, administration, participation, review,
   funding, beneficiary, visibility, safety, and financial operations as
   separate dimensions rather than one role hierarchy.

3. **Multiple simultaneous roles**

   Locked decision: one person may hold different roles in different contexts
   and several compatible roles in one context. Every command evaluates the
   exact role and scope required for that action.

4. **Explicit grants**

   Locked decision: authority arises from an explicit grant, accepted
   membership, frozen-contract designation, or named system policy. Profile
   claims, messages, follows, and inferred activity never grant roles.

5. **Role-grant record**

   Locked decision: every grant records actor, recipient, role, scope, source,
   start, optional expiry, current state, and revocation. Grant and revocation
   are auditable domain facts.

6. **Delegation**

   Locked decision: delegation is allowed only when the granting role explicitly
   permits it. Delegated authority cannot exceed the grantor's authority and
   may be temporary.

7. **Historical attribution**

   Locked decision: removing a current role never rewrites who created,
   approved, funded, reviewed, moderated, or operated an earlier action.

8. **Owner continuity**

   Locked decision: every active governed object has exactly one accountable
   owner person or eligible collective. Ownership transfer is explicit,
   accepted by the recipient, and historically audited.

### Human participation and governance roles

9. **Applicant, invitee, and visitor**

   Locked decision: treat applicant, invitee, and visitor as access or
   participation states, not governance roles. They receive no authority merely
   by viewing, applying, or holding an invitation.

10. **Member and participant**

    Locked decision: `member` means durable belonging to a Team or collective.
    `participant` means enrollment in a bounded Event, Project program, Pod, or
    activity. A person may be one without the other.

11. **Creator**

    Locked decision: creator is immutable historical attribution for who
    initiated an object. Creator status alone grants no permanent ownership,
    participation, review, funding, beneficiary, or moderation rights.

12. **Owner**

    Locked decision: owner is the current accountable governance authority.
    The owner may manage allowed delegation and lifecycle commands but remains
    bounded by frozen contracts and higher-scope policy.

13. **Administrator**

    Locked decision: administrator is a delegated operational role for a
    specific scope. It cannot transfer ownership, rewrite frozen terms, assume
    financial authority, or grant itself broader access.

14. **Event organizer**

    Locked decision: an organizer configures and operates an Event, defines
    eligible participation structures, communicates official updates, and
    monitors aggregate execution without receiving unrestricted access to
    private proof or conversations.

15. **Project or Team lead**

    Locked decision: a lead coordinates a Project or Team, publishes needs,
    invites or reviews prospective collaborators, structures work, and selects
    public progress. Lead status does not make that person owner of member work
    or proof.

16. **Pod lead**

    Locked decision: a Pod lead manages its schedule, allowed room operations,
    participant administration, and contract-authorized actions. The lead
    cannot alter frozen occurrences, evidence rules, or economics after
    consent.

17. **Reviewer**

    Locked decision: reviewer is a separately designated decision role with
    bounded access to the evidence needed for review. A reviewer cannot make a
    terminal decision on their own submission.

18. **Sponsor**

    Locked decision: a sponsor commits value or resources under a frozen
    economic contract. Sponsorship does not automatically grant governance,
    reviewer, moderation, or private-data access.

19. **Beneficiary**

    Locked decision: beneficiary is an eligible destination under an economic
    contract. A beneficiary need not be a participant, sponsor, creator, or
    administrator.

20. **Mentor or contributor**

    Locked decision: a mentor or contributor may provide bounded assistance,
    feedback, or artifacts without becoming a participant eligible for
    rewards, streaks, or reputation unless explicitly enrolled.

21. **Guardian**

    Locked decision: guardian is a private youth-safety and consent
    relationship, not an alternate login or authority to impersonate the youth
    person. Its exact visibility and controls require later consent design.

### Platform and operational roles

22. **Community moderator**

    Locked decision: moderators may hide unsafe presentation, restrict social
    behavior, and manage reports under policy. They cannot change proof
    outcomes, memberships, frozen terms, ledger entries, refunds, or payouts.

23. **Support operator**

    Locked decision: support can inspect bounded diagnostic information and
    guide recovery flows but cannot impersonate users, bypass provider
    ownership, or silently modify authoritative state.

24. **Financial operator**

    Locked decision: financial operators reconcile deposits and transfers,
    manage approved exception queues, and execute policy-bounded recovery.
    They cannot judge proof, change entitlements, or become treasury
    beneficiaries through the operator role.

25. **Platform administrator**

    Locked decision: reserve platform administration for narrowly scoped
    configuration and emergency controls. It is not a universal bypass, and
    every exceptional action requires an immutable audit reason.

### Separation of duties

26. **No creator role bundle**

    Locked decision: creating an Event, Project, Team, or Pod does not
    automatically make the creator a participant, sponsor, beneficiary, or
    reviewer.

27. **Sponsor neutrality**

    Locked decision: a sponsor may receive contractually disclosed aggregate
    reporting but cannot approve its preferred participants or manipulate
    evidence outcomes unless a separate governance role was explicitly
    disclosed before consent.

28. **Review conflicts**

    Locked decision: self-review is forbidden. Other financial or relational
    conflicts are disclosed and handled by the proof-review policy rather than
    silently ignored.

29. **Frozen-contract ceiling**

    Locked decision: no owner, organizer, lead, administrator, sponsor,
    moderator, or operator may mutate terms that the affected participants
    already accepted.

30. **No operator impersonation**

    Locked decision: platform actions are recorded as the real operator or
    service actor. Pods never records an operator command as though the user
    performed it.

### Service and integration actors

31. **System workers**

    Locked decision: schedulers, reviewers, notification dispatchers,
    settlement workers, indexers, and moderation automation are distinct
    service actors with narrow capabilities and no public social identity.

32. **Integration actors**

    Locked decision: GitHub and future external integrations act through
    revocable installation or connection identities. They may submit
    attributed observations but cannot become a person, member, reviewer, or
    beneficiary.

33. **Automation attribution**

    Locked decision: every automated fact records the service actor, triggering
    human or system fact, integration source, policy version, and causation
    chain.

34. **Human override**

    Locked decision: an override exists only where a later policy explicitly
    defines who may perform it, which states permit it, what evidence is
    required, and how the original automated result remains visible.

### Youth role boundaries

35. **Youth participation roles**

    Locked decision: eligible youth may be non-financial members,
    participants, contributors, mentors, Project leads, and owners of
    non-financial structures, subject to later safety and consent rules.

36. **Youth restricted roles**

    Locked decision: youth cannot be sponsors, beneficiaries of redistributed
    financial value, financial operators, treasury authorities, or owners and
    administrators of funded structures in the initial Mainnet product.

37. **Guardian boundary**

    Locked decision: guardian status does not transfer authorship, reputation,
    membership, proof, or social relationships between guardian and youth.

### Jobs Pods must perform

38. **Builder or participant job**

    Locked decision: Pods helps a participant find relevant people and
    opportunities, understand the contract, commit, show work, receive fair
    review, collaborate, retain evidence-backed history, and control what
    becomes public.

39. **Lead job**

    Locked decision: Pods helps a Team, Project, or Pod lead state needs,
    assemble people, create clear working structures, monitor execution,
    communicate decisions, and produce an understandable public journey
    without reading every chat message.

40. **Organizer job**

    Locked decision: Pods helps an organizer structure participation across
    many Projects and Pods, enforce consistent rules, see aggregate risks and
    progress, communicate official updates, and reach completion without
    becoming the manual source of truth.

41. **Reviewer job**

    Locked decision: Pods gives reviewers the minimum necessary evidence,
    ordered queues, contract context, conflict disclosure, clarification tools,
    deadlines, and auditable decisions.

42. **Sponsor job**

    Locked decision: Pods lets sponsors define a transparent commitment,
    understand where value can go, observe permitted aggregate outcomes, and
    verify conservation without influencing individual review.

43. **Visitor and community job**

    Locked decision: Pods gives visitors a clean, read-only narrative of
    explicitly public progress, milestones, and artifacts rather than exposing
    private rooms or raw operational noise.

44. **Guardian job**

    Locked decision: Pods gives guardians understandable consent, safety, and
    escalation information without silently turning them into the youth
    person's account operator.

45. **Moderator and financial-operator job**

    Locked decision: Pods provides prioritized exception queues, precise
    authority boundaries, evidence, safe actions, and audit trails without
    allowing operational tools to reinterpret product outcomes.

### Role presentation and derived meaning

46. **Context labels**

    Locked decision: display roles only in the context where they apply, such
    as `Organizer of Cycle II` or `Reviewer for Pod 4`. Do not place a universal
    `Admin` badge on a profile.

47. **Relationships are not roles**

    Locked decision: following, friendship, blocking, matching, and shared
    context affect discovery or contact but never grant governance or access
    authority by themselves.

48. **Roles are not reputation**

    Locked decision: holding owner, organizer, reviewer, sponsor, or lead roles
    does not itself prove quality or trustworthiness. Later reputation derives
    from attributable outcomes and behavior.

49. **Role removal and suspension**

    Locked decision: revocation or suspension disables future commands but
    preserves historical attribution. Required ownership is transferred or the
    governed object enters an explicit blocked state rather than becoming
    ownerless silently.

### Collective actors

50. **Collective role holder**

    Locked decision: an eligible Team, organization, club, or community may be
    the named owner, organizer, sponsor, or beneficiary where the later object
    and economic contracts permit it. A collective is not a canonical person.

51. **Human representation**

    Locked decision: every command performed for a collective is authenticated
    by a specific person or service actor with an explicit representative
    grant. Collective membership alone does not authorize representation.

52. **No shared collective credentials**

    Locked decision: a collective never signs in through a shared Google,
    GitHub, recovery-code, or person session. Collective wallets and integration
    installations are separate scoped connections operated by authorized
    representatives.

## Actor and Role Data Ownership

### Actor

Identifies a canonical person, eligible collective, service identity, or
platform operator that can be attributed as the source of a command or fact.
Actor type never substitutes for a permission check.

### Role definition

Owns the stable role identifier, authority dimension, eligible scope types,
delegation rules, incompatibilities, and whether assignment requires
acceptance.

### Role grant

Owns actor, recipient, role, scope, source, grantor, start, optional expiry,
state, revocation, and audit references. It never owns the historical actions
performed while the grant was active.

### Representative grant

Owns the authority for a person or service to act for an eligible collective
within an exact scope. It does not make the collective a person or share the
representative's login.

### Service actor

Owns one machine identity, capability policy, credential lifecycle, deployment
boundary, and operational status. It cannot acquire social relationships,
public profile facets, participant reputation, or economic benefit.

## Locked Invariants

1. Roles are contextual grants, not identity attributes.
2. No role silently bundles governance, participation, review, funding,
   beneficiary, moderation, or financial authority.
3. Creator attribution is immutable and distinct from current ownership.
4. Every active governed object has one accountable owner or an explicit
   blocked ownership state.
5. Delegated authority cannot exceed the grantor or frozen contract.
6. Role grants and revocations are auditable.
7. Role removal never rewrites historical attribution.
8. Self-review is forbidden.
9. Sponsorship does not imply governance, review, or private-data access.
10. Moderation cannot mutate authoritative activity or financial state.
11. Financial operations cannot reinterpret proof or entitlement outcomes.
12. Platform and support operators never impersonate a person.
13. Youth accounts cannot receive initial Mainnet financial roles.
14. Collective actions resolve to an identified representative actor.
15. Services and integrations cannot become people, members, beneficiaries, or
    holders of participant reputation.
16. Relationships, matching, and reputation never grant authority.

## Deferred Dependencies

- The object and membership graph belongs to Document 04.
- Permission evaluation, inheritance, consent, and visibility ceilings belong
  to Document 05.
- Command and audit representation belongs to Document 06.
- Lifecycle-specific actor powers belong to Documents 07 through 11.
- Reputation treatment belongs to Document 13.
- Relationship and contact behavior belongs to Document 14.
- Organizer and participant journeys belong to Documents 17 and 18.
- Service credentials and operational controls belong to Documents 22 and 23.

## Closure

All 52 actor, role, separation, job, youth, service, presentation, and
collective decisions required for the initial Mainnet actor contract are
resolved. No role silently bundles governance, participation, review, funding,
beneficiary, moderation, or financial authority.
