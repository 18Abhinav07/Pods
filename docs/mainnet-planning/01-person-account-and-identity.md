---
created: 2026-07-27
project: pods
ecosystem: full-stack
tags: [mainnet, identity, authentication, planning]
---

# 01: Person, Account, and Identity

Status: active

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[HANDOFF]] | [[README]]

## Scope

This document defines the permanent identity that represents a human across
all Pods product domains. It covers account creation, authentication-provider
connections, identity continuity, recovery, and the minimum initial profile.

It does not define detailed public profiles, activity facets, reputation,
wallet custody, settlement behavior, or social integrations. Those belong to
later planning documents.

## Accepted Decisions

### One canonical Pods person

Every onboarded human receives one permanent, opaque Pods person identifier.
This identifier is the source of truth for their memberships, activity,
relationships, permissions, history, and future profile projections.

The canonical identifier is not derived from:

- A wallet address
- A blockchain or network
- An email address
- A Google account identifier
- A GitHub username
- A social handle

External identities prove access to a Pods person. They do not become the
person.

### Chain and wallet independence

Pods core product logic is independent of Nimiq, a particular wallet, and a
particular blockchain. Nimiq is the first supported settlement rail and Mini
App environment, not the identity model.

Wallet, asset, network, deposit, and payout behavior will be exposed to the
core product through explicit adapters. A future settlement adapter may be
added without replacing or fragmenting the Pods person.

### Initial authentication direction

The initial production authentication methods are Google Sign-In and GitHub
Sign-In. The product does not authenticate against Gmail itself.

Google and GitHub are equal authentication and account-creation entry points.
Neither provider is globally mandatory. A person may create their canonical
Pods account with either provider and link the other later.

After successful provider authentication:

- If that provider identity is already linked, Pods signs the person into the
  existing canonical account.
- If it is not linked, Pods starts the minimal onboarding flow and atomically
  creates the person, minimum profile, username reservation, and provider link
  when onboarding completes.
- Signing in or linking another provider must never create a second Pods
  person silently.

GitHub becomes required only when a person chooses functionality that needs
GitHub ownership or activity proof, such as connecting a repository or using
GitHub-verified Build and Ship evidence. A Google-first person can link GitHub
at that point without changing their Pods identity. A GitHub-first person can
link Google later for an additional sign-in and recovery path.

Provider credentials and verified provider data are private authentication
records, not public-profile fields.

### Secondary authentication linking

Secondary authentication is added only from the authenticated person's account
settings. The person explicitly starts the link action and completes a fresh
authentication flow with the secondary provider.

The initial Mainnet behavior is intentionally narrow:

- If the verified provider identity is unlinked, Pods links it to the currently
  authenticated person.
- If it is already linked to the same person, Pods treats the operation as
  already complete and creates no duplicate record.
- If it is linked to a different Pods person, Pods denies the link. It does not
  move the provider, merge the people, or expose the other account's username,
  profile, or provider details.
- Email equality never links or merges two Pods people automatically.

The denial state explains that the provider already belongs to another Pods
account and that account merging is not yet supported. The two canonical
people remain separate.

### Deferred account merging

Explicit account merging is a future identity capability, not part of the
initial Mainnet build. Its future design must require proof of control of both
accounts and must define how memberships, active commitments, settlement,
history, usernames, social relationships, and duplicate participation are
resolved. Normal provider linking must not contain a partial or hidden merge.

### Minimal onboarding

Initial onboarding asks only for:

- Display name
- Globally unique username

The display name is not unique. The username is unique case-insensitively and
is the human-readable Pods namespace.

Profile image, biography, social connections, projects, showcases, activity
facets, profile visibility, and other granular presentation settings are
completed later from profile setup. Initial onboarding must not become a long
profile questionnaire.

The detailed profile schema will be defined only after the product's actors and
user types are mapped. Profiles remain extensible so later facets and features
can be added without replacing the canonical person.

## Preliminary Data Ownership

### Person

Owns the opaque identifier, account status, creation time, and links to the
minimum profile and authentication identities.

### Authentication identity

Owns the provider name, immutable provider subject identifier, linkage state,
and private provider metadata needed for authentication or recovery.

### Minimum profile

Owns the display name, username, normalized username, and initial setup state.
Detailed profile fields are deferred to
[[docs/mainnet-planning/02-profile-facets-and-privacy|Profile, facets, and privacy]].

## Initial Invariants

1. Core domain records refer to the Pods person identifier, never directly to
   a wallet address or OAuth provider identifier.
2. One provider subject can be linked to at most one Pods person.
3. Username uniqueness is checked against a canonical normalized value in one
   atomic reservation operation.
4. Authentication-provider data, email addresses, wallet addresses, and tokens
   are private unless a later, explicit profile decision exposes a safe
   projection.
5. Removing or replacing a provider must not delete the person's historical
   activity.
6. Settlement-adapter failure must not invalidate or delete the Pods person.
7. Profile setup and financial setup remain separate concerns.
8. A provider identity linked to another Pods person cannot be reassigned by
   the initial Mainnet product.

## Decisions Still Required

Resolve these in order:

1. Username syntax, reservation, change, release, and impersonation rules.
2. Account recovery when the original provider is unavailable.
3. Account states, suspension, deactivation, deletion, and retention.
4. Session, device, and reauthentication requirements for sensitive actions.

## Deferred Dependencies

- Public profile and activity facets belong to document 02.
- Roles and actor permissions belong to document 03.
- Authorization and consent belong to document 05.
- Wallet and settlement adapters belong to documents 11 and 23.
- GitHub proof permissions belong to document 19.
- Full service and data architecture belongs to document 22.
- Account merging remains a documented future capability and is excluded from
  the initial Mainnet implementation scope.
