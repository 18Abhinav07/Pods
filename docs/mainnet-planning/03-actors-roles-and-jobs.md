---
created: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, actors, roles, jobs, authority, planning]
---

# 03: Actors, Roles, and Jobs

Status: active

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

## Decision Bundle Awaiting Approval

### Role model

1. **Contextual roles**

   Recommendation: roles are scoped to the platform, a collective, Event,
   Project, Team, or Pod. No product-domain role becomes a universal identity
   label.

2. **Independent authority dimensions**

   Recommendation: model governance, administration, participation, review,
   funding, beneficiary, visibility, safety, and financial operations as
   separate dimensions rather than one role hierarchy.

3. **Multiple simultaneous roles**

   Recommendation: one person may hold different roles in different contexts
   and several compatible roles in one context. Every command evaluates the
   exact role and scope required for that action.

4. **Explicit grants**

   Recommendation: authority arises from an explicit grant, accepted
   membership, frozen-contract designation, or named system policy. Profile
   claims, messages, follows, and inferred activity never grant roles.

5. **Role-grant record**

   Recommendation: every grant records actor, recipient, role, scope, source,
   start, optional expiry, current state, and revocation. Grant and revocation
   are auditable domain facts.

6. **Delegation**

   Recommendation: delegation is allowed only when the granting role explicitly
   permits it. Delegated authority cannot exceed the grantor's authority and
   may be temporary.

7. **Historical attribution**

   Recommendation: removing a current role never rewrites who created,
   approved, funded, reviewed, moderated, or operated an earlier action.

8. **Owner continuity**

   Recommendation: every active governed object has exactly one accountable
   owner person or eligible collective. Ownership transfer is explicit,
   accepted by the recipient, and historically audited.

### Human participation and governance roles

9. **Applicant, invitee, and visitor**

   Recommendation: treat applicant, invitee, and visitor as access or
   participation states, not governance roles. They receive no authority merely
   by viewing, applying, or holding an invitation.

10. **Member and participant**

    Recommendation: `member` means durable belonging to a Team or collective.
    `participant` means enrollment in a bounded Event, Project program, Pod, or
    activity. A person may be one without the other.

11. **Creator**

    Recommendation: creator is immutable historical attribution for who
    initiated an object. Creator status alone grants no permanent ownership,
    participation, review, funding, beneficiary, or moderation rights.

12. **Owner**

    Recommendation: owner is the current accountable governance authority.
    The owner may manage allowed delegation and lifecycle commands but remains
    bounded by frozen contracts and higher-scope policy.

13. **Administrator**

    Recommendation: administrator is a delegated operational role for a
    specific scope. It cannot transfer ownership, rewrite frozen terms, assume
    financial authority, or grant itself broader access.

14. **Event organizer**

    Recommendation: an organizer configures and operates an Event, defines
    eligible participation structures, communicates official updates, and
    monitors aggregate execution without receiving unrestricted access to
    private proof or conversations.

15. **Project or Team lead**

    Recommendation: a lead coordinates a Project or Team, publishes needs,
    invites or reviews prospective collaborators, structures work, and selects
    public progress. Lead status does not make that person owner of member work
    or proof.

16. **Pod lead**

    Recommendation: a Pod lead manages its schedule, allowed room operations,
    participant administration, and contract-authorized actions. The lead
    cannot alter frozen occurrences, evidence rules, or economics after
    consent.

17. **Reviewer**

    Recommendation: reviewer is a separately designated decision role with
    bounded access to the evidence needed for review. A reviewer cannot make a
    terminal decision on their own submission.

18. **Sponsor**

    Recommendation: a sponsor commits value or resources under a frozen
    economic contract. Sponsorship does not automatically grant governance,
    reviewer, moderation, or private-data access.

19. **Beneficiary**

    Recommendation: beneficiary is an eligible destination under an economic
    contract. A beneficiary need not be a participant, sponsor, creator, or
    administrator.

20. **Mentor or contributor**

    Recommendation: a mentor or contributor may provide bounded assistance,
    feedback, or artifacts without becoming a participant eligible for
    rewards, streaks, or reputation unless explicitly enrolled.

21. **Guardian**

    Recommendation: guardian is a private youth-safety and consent
    relationship, not an alternate login or authority to impersonate the youth
    person. Its exact visibility and controls require later consent design.

### Platform and operational roles

22. **Community moderator**

    Recommendation: moderators may hide unsafe presentation, restrict social
    behavior, and manage reports under policy. They cannot change proof
    outcomes, memberships, frozen terms, ledger entries, refunds, or payouts.

23. **Support operator**

    Recommendation: support can inspect bounded diagnostic information and
    guide recovery flows but cannot impersonate users, bypass provider
    ownership, or silently modify authoritative state.

24. **Financial operator**

    Recommendation: financial operators reconcile deposits and transfers,
    manage approved exception queues, and execute policy-bounded recovery.
    They cannot judge proof, change entitlements, or become treasury
    beneficiaries through the operator role.

25. **Platform administrator**

    Recommendation: reserve platform administration for narrowly scoped
    configuration and emergency controls. It is not a universal bypass, and
    every exceptional action requires an immutable audit reason.

### Separation of duties

26. **No creator role bundle**

    Recommendation: creating an Event, Project, Team, or Pod does not
    automatically make the creator a participant, sponsor, beneficiary, or
    reviewer.

27. **Sponsor neutrality**

    Recommendation: a sponsor may receive contractually disclosed aggregate
    reporting but cannot approve its preferred participants or manipulate
    evidence outcomes unless a separate governance role was explicitly
    disclosed before consent.

28. **Review conflicts**

    Recommendation: self-review is forbidden. Other financial or relational
    conflicts are disclosed and handled by the proof-review policy rather than
    silently ignored.

29. **Frozen-contract ceiling**

    Recommendation: no owner, organizer, lead, administrator, sponsor,
    moderator, or operator may mutate terms that the affected participants
    already accepted.

30. **No operator impersonation**

    Recommendation: platform actions are recorded as the real operator or
    service actor. Pods never records an operator command as though the user
    performed it.

### Service and integration actors

31. **System workers**

    Recommendation: schedulers, reviewers, notification dispatchers,
    settlement workers, indexers, and moderation automation are distinct
    service actors with narrow capabilities and no public social identity.

32. **Integration actors**

    Recommendation: GitHub and future external integrations act through
    revocable installation or connection identities. They may submit
    attributed observations but cannot become a person, member, reviewer, or
    beneficiary.

33. **Automation attribution**

    Recommendation: every automated fact records the service actor, triggering
    human or system fact, integration source, policy version, and causation
    chain.

34. **Human override**

    Recommendation: an override exists only where a later policy explicitly
    defines who may perform it, which states permit it, what evidence is
    required, and how the original automated result remains visible.

### Youth role boundaries

35. **Youth participation roles**

    Recommendation: eligible youth may be non-financial members,
    participants, contributors, mentors, Project leads, and owners of
    non-financial structures, subject to later safety and consent rules.

36. **Youth restricted roles**

    Recommendation: youth cannot be sponsors, beneficiaries of redistributed
    financial value, financial operators, treasury authorities, or owners and
    administrators of funded structures in the initial Mainnet product.

37. **Guardian boundary**

    Recommendation: guardian status does not transfer authorship, reputation,
    membership, proof, or social relationships between guardian and youth.

### Jobs Pods must perform

38. **Builder or participant job**

    Recommendation: Pods helps a participant find relevant people and
    opportunities, understand the contract, commit, show work, receive fair
    review, collaborate, retain evidence-backed history, and control what
    becomes public.

39. **Lead job**

    Recommendation: Pods helps a Team, Project, or Pod lead state needs,
    assemble people, create clear working structures, monitor execution,
    communicate decisions, and produce an understandable public journey
    without reading every chat message.

40. **Organizer job**

    Recommendation: Pods helps an organizer structure participation across
    many Projects and Pods, enforce consistent rules, see aggregate risks and
    progress, communicate official updates, and reach completion without
    becoming the manual source of truth.

41. **Reviewer job**

    Recommendation: Pods gives reviewers the minimum necessary evidence,
    ordered queues, contract context, conflict disclosure, clarification tools,
    deadlines, and auditable decisions.

42. **Sponsor job**

    Recommendation: Pods lets sponsors define a transparent commitment,
    understand where value can go, observe permitted aggregate outcomes, and
    verify conservation without influencing individual review.

43. **Visitor and community job**

    Recommendation: Pods gives visitors a clean, read-only narrative of
    explicitly public progress, milestones, and artifacts rather than exposing
    private rooms or raw operational noise.

44. **Guardian job**

    Recommendation: Pods gives guardians understandable consent, safety, and
    escalation information without silently turning them into the youth
    person's account operator.

45. **Moderator and financial-operator job**

    Recommendation: Pods provides prioritized exception queues, precise
    authority boundaries, evidence, safe actions, and audit trails without
    allowing operational tools to reinterpret product outcomes.

### Role presentation and derived meaning

46. **Context labels**

    Recommendation: display roles only in the context where they apply, such
    as `Organizer of Cycle II` or `Reviewer for Pod 4`. Do not place a universal
    `Admin` badge on a profile.

47. **Relationships are not roles**

    Recommendation: following, friendship, blocking, matching, and shared
    context affect discovery or contact but never grant governance or access
    authority by themselves.

48. **Roles are not reputation**

    Recommendation: holding owner, organizer, reviewer, sponsor, or lead roles
    does not itself prove quality or trustworthiness. Later reputation derives
    from attributable outcomes and behavior.

49. **Role removal and suspension**

    Recommendation: revocation or suspension disables future commands but
    preserves historical attribution. Required ownership is transferred or the
    governed object enters an explicit blocked state rather than becoming
    ownerless silently.

### Collective actors

50. **Collective role holder**

    Recommendation: an eligible Team, organization, club, or community may be
    the named owner, organizer, sponsor, or beneficiary where the later object
    and economic contracts permit it. A collective is not a canonical person.

51. **Human representation**

    Recommendation: every command performed for a collective is authenticated
    by a specific person or service actor with an explicit representative
    grant. Collective membership alone does not authorize representation.

52. **No shared collective credentials**

    Recommendation: a collective never signs in through a shared Google,
    GitHub, recovery-code, or person session. Collective wallets and integration
    installations are separate scoped connections operated by authorized
    representatives.

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

## Closure Gate

This document can lock only after all 52 actor, role, separation, job, youth,
service, and presentation decisions are approved or amended, and no role
silently bundles governance, participation, review, funding, beneficiary,
moderation, or financial authority.
