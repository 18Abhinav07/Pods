---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, authorization, consent, privacy, visibility, planning]
---

# 05: Access, Consent, and Visibility

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/01-person-account-and-identity|Identity contract]] |
[[docs/mainnet-planning/02-profile-facets-and-privacy|Profile contract]] |
[[docs/mainnet-planning/03-actors-roles-and-jobs|Role contract]] |
[[docs/mainnet-planning/04-object-graph-and-memberships|Object graph]] |
[[HANDOFF]] | [[README]]

## Purpose

Define one default-deny decision model for every command, projection, room,
proof, integration, and financial action. Membership, ownership, creation,
visibility, and consent remain separate inputs rather than shortcuts for one
another.

## Contract

### Authorization

1. Every protected operation evaluates the authenticated actor, canonical
   person or service identity, requested capability, exact scope, relationship
   state, role grants, object state, policy version, eligibility tier,
   conflicts, and any required consent or financial activation.
2. The result is `allow` or `deny` with a stable reason code. Product surfaces
   may explain a safe reason but never expose private policy inputs.
3. Authorization is default deny. Missing, expired, ambiguous, or stale grants
   never become permission.
4. Roles do not inherit through the object graph. A broader scope may issue a
   named child-scope grant only where policy explicitly allows it.
5. Creator attribution, ownership, membership, participation, following,
   friendship, matching, and reputation never substitute for a required
   capability.
6. Collective commands require both a valid representative grant and the
   capability needed on the target.
7. Service actors receive capability allowlists, target constraints, expiry,
   and credential identity. They do not receive human roles.
8. Policy evaluates the authoritative relationship and object version, not a
   cached UI label.

### Permission ceilings

9. A frozen contract is a ceiling on owner, organizer, administrator,
   reviewer, sponsor, moderator, and operator authority.
10. Source visibility is a ceiling on every downstream profile, timeline,
    room, search, export, notification, and external-share projection.
11. A contributor controls whether their eligible artifact becomes public.
    A Project lead or organizer may select only from material already permitted
    for that context and audience.
12. A reviewer sees only the evidence and context necessary for the assigned
    decision. Review access expires when policy no longer requires it, subject
    to audit and dispute retention.
13. Moderation may suppress presentation and contact without rewriting
    authoritative activity, proof, entitlement, or ledger facts.
14. Blocking ends optional social contact and discovery but cannot conceal
    required safety notices, contract state, review outcomes, refunds, or
    settlement obligations.

### Visibility layers

Visibility uses separate concepts rather than one overloaded enum.

`SourceVisibilityCeiling` is the maximum audience of one source record:

- `private_self`: visible only to the subject and narrowly authorized
  operators;
- `reviewer_only`: subject plus assigned review and dispute authority;
- `context_members`: active members or participants of one exact context;
- `context_roles`: named roles within one exact context;
- `host_network`: an explicitly named EventEntry, Event, Project, Team, or
  Organization host audience;
- `public_pods`: eligible for an approved Pods public projection.

`ContextAudiencePolicy` names the exact object, relationship states, roles,
and projection fields that may receive a contextual source.

`ProfileItemVisibility` reuses Document 02 exactly:

| Document 02 visibility | Access interpretation |
|---|---|
| `private` | subject and narrowly authorized operations only |
| `shared_context` | named current context under its audience policy |
| `connections` | accepted social connections through the profile projection only |
| `public` | eligible Pods public profile projection |

`connections` is intentionally not a general source ceiling. Connecting to a
person never exposes their proof, work context, financial state, or room.

`PublicationGrant` separately records deliberate publishing or external
sharing. It can narrow and select from a `public_pods`-eligible source but can
never broaden a source ceiling.

Visibility is not a linear ladder. A projection must satisfy the source
ceiling, contextual audience, profile-item visibility where relevant, viewer
authority, subject choice, and every referenced record's ceiling. Combining
records uses the most restrictive applicable boundary.

### Consent receipts

15. Product terms, privacy terms, financial terms, proof visibility,
    reviewer authority, custody, economic rules, external integrations, and
    public distribution use separate versioned consent purposes.
16. A consent receipt records person, purpose, policy version, displayed
    summary digest, scope, context, locale, acceptance time, eligibility
    evidence reference, and withdrawal state.
17. Frozen Event, entry, Pod, proof, and economic contracts store the exact
    consent snapshot or digest accepted by each affected person.
18. A changed material term requires fresh consent before future participation.
    It never silently rewrites an accepted contract.
19. Withdrawal stops optional future processing where legally and
    operationally possible. It does not erase required audit, safety,
    contractual, refund, settlement, or reconciliation records.
20. Consent is never inferred from navigation, wallet connection, message
    activity, silence, or another person's action.

### Invitations, visitors, and public access

21. Invitation tokens are opaque, revocable, expiring, single-purpose, and
    reveal only a public-safe preview until the recipient authenticates.
22. Possessing a token does not grant membership, role, roster position,
    proof access, or financial authority.
23. Visitor access exists only when the frozen source contract permits it.
    Visitors receive a separate allowlisted projection and no write
    capability.
24. Private object existence, invitation validity details, member rosters,
    private profiles, and rejected access reasons are not enumerable.
25. Public pages may be viewed without authentication when every included
    field is explicitly public. Any action that creates a person-bound record
    requires authentication.

### Youth and sensitive contexts

26. Youth accounts start private, remain outside global discovery, and cannot
    enter initial Mainnet financial capabilities.
27. Youth contact, contextual matching, external sharing, guardian
    relationships, and public participation each require their later validated
    policy. Guardian status never grants impersonation.
28. Health, movement, location, private repository, and reviewer evidence use
    purpose-specific projections. Public participation never implies public
    raw data.

## Permission Evaluation Order

1. Authenticate the actor and session.
2. Resolve the canonical subject and requested scope.
3. Classify the requested command as `discretionary`,
   `obligation_preserving`, or `safety_recovery`.
4. Verify account, relationship, object, and role-grant states.
5. Apply age, jurisdiction, conflict, suspension, and financial eligibility
   according to the command class.
6. Apply the frozen contract and required consent receipts.
7. Apply source and target visibility ceilings.
8. Evaluate the exact capability.
9. Record the decision reference with the resulting command or safe denial
   audit.

No later step may broaden a denial from an earlier ceiling.

Command classes preserve contractual and safety rights:

- `discretionary`: creation, joining, publishing, messaging, new funding, and
  other optional future action;
- `obligation_preserving`: contract-required clarification response, dispute,
  appeal, evidence access needed to avoid forfeiture, refund, payout
  destination confirmation, settlement visibility, and reconciliation;
- `safety_recovery`: account recovery, safety reporting, evidence preservation,
  incident communication, and legally required access.

Suspension or role removal may deny discretionary action. It cannot cause a
person to lose funds or a contractual response right merely because the
account is restricted. When law or safety prevents an obligation-preserving
response, the frozen policy must produce a neutral or protected outcome rather
than automatic forfeiture.

## Product Flow Impact

- Every primary action can answer why it is available, unavailable, or still
  provisional.
- Joining, funding, publishing proof, enabling visitors, connecting GitHub,
  and sharing externally each expose the relevant consent before commitment.
- Role-adaptive interfaces show only actions the actor can perform without
  hiding state they are entitled to understand.
- Public and visitor views use separate DTOs, not filtered private responses.
- Access revocation changes future commands immediately while historical
  projections remain accurate.

## Failure Boundaries

- A policy service failure denies new sensitive actions but does not stop
  already-required refunds or reconciliation workers.
- Stale cached grants cannot authorize a mutation.
- Expired consent moves future action to `consent_required`, not generic error.
- Unauthorized requests receive public-safe responses and an internal reason
  code.
- Visibility projection failure hides the item rather than broadening access.
- Emergency suspension is capability-specific and cannot silently suspend
  refunds, reconciliation, or other obligation-preserving commands.

## Interdependencies

Consumes Documents 01 through 04. Document 06 records its decisions.
Documents 07 through 11 use it for lifecycle commands. Documents 12 through 15
use its visibility ceilings. Documents 19 and 20 use its integration and
distribution consent. Documents 22 and 23 implement enforcement, retention,
and operational review. Document 24 turns reason codes and consent checkpoints
into product routes.

## Review Findings

- No graph relationship grants implicit access.
- Creator and organizer visibility cannot exceed contributor choice.
- Social safety actions remain isolated from financial completion.
- Youth restrictions remain compatible with Documents 01 and 02.
- The design deliberately postpones guardian implementation and
  jurisdiction-specific policy until Document 23 validation.

## Closure Condition

Lock only after the capability vocabulary, visibility classes, consent receipt
shape, public-safe denial behavior, and financial fail-safe ordering are
approved with Documents 06, 10, 11, 14, and 23.
