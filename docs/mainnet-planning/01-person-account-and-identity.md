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

Whether Google and GitHub are equal account-creation methods or one is
required remains an active decision below. Provider credentials and verified
provider data are private authentication records, not public-profile fields.

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

## Decisions Still Required

Resolve these in order:

1. Whether Google and GitHub are equal account-creation methods or one is
   required.
2. How an authenticated person links a second provider safely.
3. What happens when a provider is already linked to another Pods person.
4. Username syntax, reservation, change, release, and impersonation rules.
5. Account recovery when the original provider is unavailable.
6. Account merge policy for accidentally duplicated identities.
7. Account states, suspension, deactivation, deletion, and retention.
8. Session, device, and reauthentication requirements for sensitive actions.

## Deferred Dependencies

- Public profile and activity facets belong to document 02.
- Roles and actor permissions belong to document 03.
- Authorization and consent belong to document 05.
- Wallet and settlement adapters belong to documents 11 and 23.
- GitHub proof permissions belong to document 19.
- Full service and data architecture belongs to document 22.
