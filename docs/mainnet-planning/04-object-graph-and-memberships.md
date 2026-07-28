---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, objects, memberships, enrollments, ownership, planning]
---

# 04: Object Graph and Memberships

Status: active

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/01-person-account-and-identity|Canonical identity]] |
[[docs/mainnet-planning/02-profile-facets-and-privacy|Profile contract]] |
[[docs/mainnet-planning/03-actors-roles-and-jobs|Actor and role contract]] |
[[HANDOFF]] | [[README]]

## Scope

This document defines the durable product objects in Pods, the typed
relationships between them, who may own them, and how a person belongs to or
participates in each context.

It does not define the complete authorization matrix, privacy ceilings,
consent snapshots, object-specific lifecycle commands, proof review,
settlement, reputation, rooms, or routes. Those later documents consume the
graph and relationship vocabulary locked here.

## Inherited Locked Constraints

1. One opaque Pods person remains the canonical owner of the person's
   memberships, participation, activity, and history.
2. A collective is not a person and never signs in through shared personal
   credentials.
3. Creator attribution is immutable and distinct from current ownership.
4. Authority comes from contextual grants, not profile claims, social
   relationships, or inferred activity.
5. Youth accounts may participate in eligible non-financial structures but
   cannot receive initial Mainnet financial roles.
6. Historical attribution survives role removal, account restriction,
   archival, and deletion projection.
7. No object or relationship may silently bundle governance, participation,
   review, funding, beneficiary, moderation, or financial authority.

## Design Goal

Pods needs a graph rich enough for one person to work across multiple Teams,
Projects, Events, and Pods without turning every object into an arbitrary
container. The graph must remain explainable from either direction:

- a person can see where they belong and what they are participating in;
- a Team can see its people and Projects;
- a Project can persist across Events;
- an Event can understand its entries and execution structures;
- a Pod can identify one exact host context and one exact participant roster;
- historical records never move or disappear because a current relationship
  changes.

## Decision Bundle Awaiting Approval

The 60 questions below are presented together so the complete graph can be
approved or amended in one pass.

### Canonical object model

1. **Which first-class durable objects exist?**

   Recommendation: the initial canonical set is Person, Organization, Team,
   Event, Project, Pod, and the typed relationship records defined below. Do
   not add a generic `Space`, `Container`, or user-defined object type.

2. **How is a community, club, company, or program represented?**

   Recommendation: use one Organization object with an explicit organization
   kind such as community, club, company, nonprofit, or informal collective.
   Kind affects presentation and later eligibility policy, not identity.

3. **What is a Team?**

   Recommendation: a Team is a durable working group of people that may work
   across Projects, Events, and Pods. It is not recreated for every Event.

4. **What is an Event?**

   Recommendation: an Event is a time-bounded program, season, campaign,
   challenge, competition, or gathering with its own participation and
   completion boundary. It is not a chatroom or an identity.

5. **What is a Project?**

   Recommendation: a Project is a durable outcome or body of work that can
   exist independently, span Events, involve changing contributors, and retain
   one continuous history.

6. **What is a Pod?**

   Recommendation: a Pod is a focused execution and accountability structure
   with a defined activity contract, schedule, occurrences, and participant
   roster. It is not the universal parent of every other object.

7. **May a Pod exist without an Organization, Team, Project, or Event?**

   Recommendation: yes. A standalone Pod is a supported first-class form for a
   small group or personal activity that does not need broader structure.

8. **Is the product graph a rigid hierarchy?**

   Recommendation: no. Use a small set of explicit typed relationships and
   derived paths. Never infer ownership, participation, or access merely from
   visual nesting.

9. **May users create recursive object nesting?**

   Recommendation: no. Organizations cannot contain Organizations, Teams
   cannot contain Teams, Events cannot contain Events, Projects cannot contain
   Projects, and Pods cannot contain Pods in the initial Mainnet product.

10. **How are object identities represented?**

    Recommendation: every object receives an opaque immutable ID. Names,
    handles, and slugs are mutable presentation or routing attributes and never
    become foreign keys or historical identity.

### Organizations, Teams, and Projects

11. **How does an Organization relate to an Event?**

    Recommendation: use an explicit `OrganizationHostsEvent` relationship with
    attribution, state, and effective dates. Hosting does not make every
    Organization member an Event participant.

12. **How does an Organization relate to a Team or Project?**

    Recommendation: use explicit affiliation or ownership relationships.
    Organization affiliation does not silently transfer ownership, membership,
    or private visibility.

13. **How does a Team relate to a Project?**

    Recommendation: use a typed `TeamWorksOnProject` relationship. A Project
    may involve several Teams, and a Team may work across several Projects.

14. **Must a Project have a Team?**

    Recommendation: no. A Project may be owned and developed by one person,
    direct contributors, one Team, or several Teams.

15. **Does Team membership make someone a Project contributor?**

    Recommendation: no. Project contribution is an explicit relationship.
    Team membership may make a person eligible for a proposed assignment but
    never creates one silently.

16. **May a person contribute to a Project without joining its Team?**

    Recommendation: yes. Mentors, specialists, reviewers, and short-term
    contributors may receive scoped Project relationships without durable Team
    membership.

17. **What happens to a Team or Project after an Event ends?**

    Recommendation: both persist independently. Event-specific status and
    results remain on the Event entry rather than mutating the durable Team or
    Project into an archived copy.

18. **Can one Project enter multiple Events?**

    Recommendation: yes. Each entry is a separate EventEntry with its own
    category, roster snapshot, status, terms, milestones, results, and public
    projection.

### Event entry and participation

19. **What represents participation in an Event?**

    Recommendation: use a first-class EventEntry rather than placing Event
    fields directly on a Person, Team, or Project. The entry is the
    event-specific participation boundary.

20. **What may an EventEntry represent?**

    Recommendation: its declared entry subject is exactly one Person, Team, or
    Project, limited by the Event contract. Build and Ship normally uses a
    Project entry with an explicit human roster.

21. **How are the people in an EventEntry represented?**

    Recommendation: use EventParticipant records linked to the entry. The
    subject object and the human roster remain separate so every action is
    attributable to a canonical Person.

22. **Can one person appear twice in the same EventEntry through several
    Teams?**

    Recommendation: no. Enforce one active EventParticipant per Person and
    EventEntry while allowing several contextual role grants on that record.

23. **May one person participate in several entries in the same Event?**

    Recommendation: the graph permits it, but each Event contract must
    explicitly allow or forbid it. The default for competitive or funded
    Events is one active entry per person.

24. **Does registering or applying create an EventEntry?**

    Recommendation: no. Applications and invitations are intents. An
    EventEntry becomes active only after the Event's required acceptance,
    eligibility, consent, roster, and financial gates are satisfied.

25. **Where do Event-specific submission and category details live?**

    Recommendation: store them on EventEntry or its typed Event records, never
    on the durable Project, Team, or Person.

26. **How is the Event roster frozen?**

    Recommendation: create an immutable roster snapshot when the Event contract
    reaches its lock point. Later membership changes do not rewrite that
    snapshot.

### Pod context and participation

27. **How does a Pod attach to the broader graph?**

    Recommendation: every Pod declares exactly one primary host context:
    standalone, Organization, Team, Event, Project, or EventEntry.

28. **Can a Pod have several primary parents?**

    Recommendation: no. Additional display paths are derived from typed
    relationships. A Project Pod in an Event appears through the Project's
    EventEntry rather than receiving two competing parents.

29. **Can a Pod change its primary host after activation?**

    Recommendation: no. A draft may change host, but an activated Pod keeps the
    frozen host context. Moving it creates a new Pod or an explicitly linked
    successor.

30. **What represents a person's place in a Pod?**

    Recommendation: use a PodParticipation record. It owns participation state,
    accepted contract reference, roster position, and Pod-specific role links,
    not the person's profile or Team membership.

31. **Does broader membership automatically create Pod participation?**

    Recommendation: no. Organization, Team, Project, and Event relationships
    may establish eligibility or prefill an invitation, but Pod participation
    requires its own activation.

32. **Can one person hold duplicate places in one Pod?**

    Recommendation: no. Enforce one non-terminal PodParticipation per Person
    and Pod regardless of how many Teams or invitations point to the Pod.

33. **Can an Event-wide Pod and a Project Pod coexist?**

    Recommendation: yes. An Event may host common Pods while each Project or
    EventEntry hosts focused execution Pods. Each Pod still has one primary
    context and roster.

34. **What is a visitor in graph terms?**

    Recommendation: visitor is an access projection, not membership or
    participation. Viewing a permitted public surface creates no durable seat,
    role, reputation, or financial relationship.

### Membership and contribution semantics

35. **Where is the term membership used?**

    Recommendation: reserve Membership for durable belonging to an
    Organization or Team. Use EventParticipant, ProjectContribution, and
    PodParticipation for bounded participation elsewhere.

36. **What is a ProjectContribution?**

    Recommendation: it is a Person-to-Project relationship with a declared
    contribution role, state, source, start, optional end, and attribution
    history. It does not transfer ownership of the person's work.

37. **Can one person have several contribution roles in a Project?**

    Recommendation: yes, through separate compatible role grants attached to
    one active ProjectContribution. Do not duplicate the contributor record.

38. **How many active Membership records may exist per person and target?**

    Recommendation: one. Role changes update or add role grants around that
    membership rather than creating duplicate belonging.

39. **Are followers, friends, guardians, sponsors, reviewers, beneficiaries,
    or moderators members?**

    Recommendation: no. Each is a separate relationship or contextual role
    unless the person also receives an explicit Membership or participation
    record.

40. **Can a service or integration actor become a member or participant?**

    Recommendation: no. Services may observe or submit attributed facts through
    scoped connections but cannot occupy human rosters, earn reputation, or
    receive participant economics.

41. **What happens to authorship when a person leaves?**

    Recommendation: all historical messages, artifacts, proof, decisions, and
    actions retain attribution to the canonical Person or deleted-person
    projection. Current membership is not required to explain past work.

42. **Can a person belong to many Organizations, Teams, Projects, Events, and
    Pods at once?**

    Recommendation: yes. Pods imposes no global exclusivity. Constraints are
    explicit and local to a particular Event, Pod, role conflict, or financial
    contract.

### Applications, invitations, and activation

43. **What are applications and invitations?**

    Recommendation: they are separate, expiring intent records that request a
    named relationship type with a named target. They are not memberships,
    seats, access grants, or financial commitments.

44. **How is an invitation to an unregistered person represented?**

    Recommendation: issue a revocable opaque invitation token. Bind it to the
    canonical Person only after authentication and required checks. Never
    create placeholder people.

45. **Can applications or invitations be duplicated?**

    Recommendation: permit only one open intent per person, target, and
    requested relationship. New attempts resume or replace the existing open
    intent through an audited transition.

46. **What happens when an application is accepted but later requirements
    remain?**

    Recommendation: move it to `accepted_pending_requirements`. Do not label
    the person active, funded, secured, rostered, or entitled until every
    required activation gate passes.

47. **Does acceptance reserve capacity?**

    Recommendation: not by default. Capacity is consumed by the target's
    explicit seat-allocation rule. Any temporary reservation must be declared
    by that contract with an expiry.

48. **How are imported Team rosters handled?**

    Recommendation: an organizer may propose invitations in bulk, but every
    person receives their own relationship intent and any required consent.
    Importing a Team never silently enrolls all its members.

### Capacity, roster, exit, and continuity

49. **Where is capacity defined?**

    Recommendation: capacity belongs to the exact target contract, such as an
    Event, EventEntry, Team, or Pod. It is not inferred from Organization size
    or another object's roster.

50. **When is a financial Pod seat secured?**

    Recommendation: only after acceptance, required consent, valid finalized
    funding, deterministic capacity allocation, and roster lock. Earlier
    states remain visibly provisional.

51. **How is oversubscription represented?**

    Recommendation: preserve every application, acceptance, and funding fact,
    then record a deterministic allocated or excluded outcome. Never delete
    losing intents or mislabel them as members.

52. **May an active person leave immediately?**

    Recommendation: yes when no frozen obligation remains. Otherwise the
    relationship enters `exit_pending` until its required refund, settlement,
    handoff, or completion boundary becomes terminal.

53. **What happens when a person is removed?**

    Recommendation: disable future actions and record the reason and actor.
    Removal never rewrites frozen rosters, past attribution, earned history, or
    outstanding economic obligations.

54. **Can ownership or required leadership silently disappear when someone
    leaves?**

    Recommendation: no. Transfer required authority before exit or place the
    object in an explicit blocked governance state with only policy-approved
    recovery actions.

55. **How do youth participate in this graph?**

    Recommendation: eligible youth may hold non-financial Membership,
    ProjectContribution, EventParticipant, and PodParticipation records.
    Financial activation remains unavailable wherever Document 01's adult
    eligibility gate applies.

### Ownership, archival, and graph integrity

56. **Who can own an object?**

    Recommendation: exactly one current owner is either a canonical Person or
    an eligible Organization or Team. Every collective-owned command still
    resolves to an authorized representative Person or service actor.

57. **How does ownership transfer work?**

    Recommendation: transfer is an explicit offer, acceptance, and effective
    fact with full history. It never changes creator attribution, accepted
    contracts, or earlier actions.

58. **When may an object be deleted instead of archived?**

    Recommendation: only an unactivated draft with no accepted relationship,
    financial fact, proof, moderation record, or required audit history may be
    hard-deleted. Published or activated objects are archived or tombstoned.

59. **Does archival cascade through the graph?**

    Recommendation: no. Archiving an Organization, Team, Event, Project, or
    Pod blocks the new actions defined by its lifecycle but does not archive,
    delete, transfer, or rewrite connected objects automatically.

60. **How are graph changes made auditable and safe?**

    Recommendation: create, link, unlink, activate, allocate, lock, transfer,
    leave, remove, archive, and restore are explicit commands that emit typed
    facts. Removing a current link never erases the historical interval in
    which it existed, and every write enforces cycle, duplicate, and
    target-type constraints.

## Proposed Relationship Vocabulary

| Relationship | From | To | Meaning |
|---|---|---|---|
| Organization membership | Person | Organization | Durable belonging |
| Team membership | Person | Team | Durable working-group belonging |
| Organization hosts Event | Organization | Event | Explicit hosting context |
| Organization affiliation | Organization | Team or Project | Named association without implied membership |
| Team works on Project | Team | Project | Durable work association |
| Project contribution | Person | Project | Explicit contribution relationship |
| Event entry | Person, Team, or Project | Event | Event-specific participation unit |
| Event participant | Person | EventEntry | Human roster and attribution |
| Pod host context | Pod | Standalone, Organization, Team, Event, Project, or EventEntry | One primary execution context |
| Pod participation | Person | Pod | Exact Pod roster position |
| Ownership | Person, Organization, or Team | Governed object | Current accountable authority |
| Representative grant | Person or service actor | Organization or Team | Scoped authority to act for a collective |

## Proposed Shared Relationship States

The exact command and lifecycle rules belong to later documents. This
document proposes a shared vocabulary so each relationship does not invent
ambiguous labels:

`invited`, `applied`, `accepted_pending_requirements`, `active`,
`exit_pending`, `completed`, `left`, `removed`, `declined`, `revoked`,
`expired`, and `excluded`.

Targets use only the states relevant to their relationship type. No screen may
collapse `accepted_pending_requirements`, `active`, and `excluded` into a
generic `joined` state.

## Proposed Core Invariants

1. A canonical Person is never duplicated to represent another context.
2. No durable object uses a mutable slug as identity.
3. No graph edge exists without a named relationship type.
4. No first-class object recursively contains another object of the same type.
5. No Pod has more than one primary host context.
6. One person cannot occupy duplicate active records in the same target.
7. Membership never implies participation in another target.
8. Application, invitation, acceptance, funding, capacity allocation, and
   roster lock remain distinct facts.
9. Current relationship removal never destroys historical attribution.
10. Ownership and creator attribution remain distinct.
11. A collective action always resolves to an authorized actor.
12. Archival never cascades into unrelated object mutation.
13. Financial obligations survive social removal and object archival until
    terminal.
14. Event-specific facts never overwrite durable Team, Project, or Person
    facts.
15. Profile visibility and relationship visibility remain bounded by their
    source contracts.

## Deferred Dependencies

- Permission evaluation, consent, invitation secrecy, inheritance, and
  visibility ceilings belong to Document 05.
- Command envelopes, domain facts, causation, and audit storage belong to
  Document 06.
- Event, Team, Project, and Pod state machines belong to Documents 07 through
  09.
- Proof, financial activation, settlement, and exit consequences belong to
  Documents 10 and 11.
- Timeline and reputation projections belong to Documents 12 and 13.
- Rooms, social relationships, and visitor behavior belong to Document 14.
- Build and Ship entry policy and organizer journeys belong to Documents 16
  through 18.

## Closure Gate

This document can lock only after all 60 object, relationship, ownership,
membership, enrollment, capacity, exit, and historical-continuity decisions
are approved or amended, and the resulting graph contains no recursive
ownership, implied participation, duplicated identity, or ambiguous generic
edge.
