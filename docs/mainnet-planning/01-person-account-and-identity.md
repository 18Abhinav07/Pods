---
created: 2026-07-27
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, identity, authentication, planning]
---

# 01: Person, Account, and Identity

Status: locked

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

Age eligibility, guardian consent where applicable, and acceptance of the
current Terms and Privacy Policy are activation requirements rather than
public-profile questions. Their records remain private.

### Username and display-name contract

Usernames:

- Contain 3 to 24 lowercase ASCII letters, numbers, or single underscores.
- Cannot begin or end with an underscore.
- Cannot contain consecutive underscores.
- Are stored and compared by one lowercase normalized value.
- Are reserved atomically only when onboarding completes. Availability checks
  do not reserve them.
- Cannot use protected system, official, moderation, impersonation-sensitive,
  or prohibited names from an extendable blocked-name registry.

A person may make at most two lifetime self-service username changes. Each
change requires recent provider authentication. Further changes require
support review. Every previous username remains permanently reserved to the
same person and redirects through the same privacy rules as the current
username. A previous username is never reassigned.

Display names contain 1 to 50 Unicode characters, are not unique, have external
whitespace trimmed and repeated whitespace collapsed, and reject control or
invisible characters.

### Account creation and duplicate prevention

An unlinked provider authentication creates a short-lived onboarding intent,
not a Pods person. The intent expires after 30 minutes. Person creation,
minimum-profile creation, username reservation, consent recording, and initial
provider linkage succeed atomically or do not happen.

The onboarding surface includes an `Already have a Pods account?` path. It
allows the person to authenticate an existing linked provider and then attach
the currently verified, unlinked provider to that existing person. This
prevents an accidental duplicate without merging two established accounts.

A verified email match may produce a private warning that an account could
already exist. It never proves identity, selects an account, reveals another
profile, links providers, or merges people.

### Provider removal and account recovery

Provider removal happens only from authenticated Settings after recent
provider authentication. The final remaining authentication method cannot be
removed. Removing a provider revokes and deletes its tokens but does not delete
historical Pods records or GitHub-backed evidence already accepted.

Pods offers eight one-time recovery codes after activation. Only hashed values
are stored, and the plaintext codes are shown once. A valid recovery code opens
a restricted recovery session in which the person must connect a new Google or
GitHub identity before normal access is restored.

Pods recommends, but does not require, linking a second provider. The
recommendation appears in Security Settings and after the person's first
meaningful project or financial action.

The initial Mainnet product has no staff override based on wallet ownership,
profile knowledge, GitHub activity, screenshots, social claims, or matching
email. If every provider and recovery code is lost, the account is
unrecoverable.

### Account lifecycle

The initial account states are:

- `active`: normal permitted access.
- `restricted`: records remain readable, but new social, project, and
  financial actions are blocked.
- `suspended`: access is limited to appeal, required records, and financial
  status.
- `deactivated`: voluntarily hidden, blocked from new participation, and
  reversible after authenticated confirmation.
- `deletion_pending`: deletion was requested and the cooling or obligation
  period is incomplete.
- `deleted`: personal identity has been removed or pseudonymized according to
  retention requirements.

The state `merged` is reserved for the future merge capability and is not
reachable in the initial Mainnet product.

Restriction, suspension, deactivation, and deletion requests never stop
refunds, settlement, owed payouts, or reconciliation of existing obligations.
They prevent new actions rather than rewriting financial history.

Deletion has a 30-day cooling period and cannot finalize while the person has
non-terminal funded memberships, deposits, disputes, settlements, or payouts.
During `deletion_pending`, the person cannot begin new Pods or commitments.

At final deletion:

- Provider tokens and private profile data are deleted.
- Financial and integrity records that must remain are pseudonymized.
- Room content that must preserve shared history uses a deleted-person
  projection.
- Personal proof media is deleted after its dispute and required retention
  period.
- Usernames remain reserved to prevent impersonation.

Exact data-retention periods belong to the privacy and operations documents.

### Sessions and authentication security

Pods permits multiple device sessions. A session expires after 30 days of
inactivity or 90 days absolutely. Session credentials rotate and use secure,
HTTP-only browser storage.

Security Settings shows active sessions with device type, approximate
location, creation time, and last activity. A person can revoke one session or
all other sessions.

Provider authentication within the previous 10 minutes is required before:

- Linking or unlinking an authentication provider
- Changing username
- Generating replacement recovery codes
- Revoking all other sessions
- Deactivating or deleting the account
- Changing another security-sensitive setting

Recovery-code use, suspected compromise, suspension, and final deletion revoke
all existing sessions. Adding a secondary provider produces a security
notification but does not revoke otherwise valid sessions.

Google authentication requests only identity, verified email, and basic
profile permissions. GitHub authentication requests only identity and verified
email permissions. Repository permissions are requested separately by the
future GitHub integration when the person enables GitHub-backed proof.

### Age tiers and capability boundary

Pods supports two eligibility tiers:

- `youth`: a person who is at least 13, satisfies the higher minimum imposed by
  their authentication provider or jurisdiction, and is below the age of
  majority in their jurisdiction.
- `adult`: a person who has reached the age of majority in their jurisdiction,
  commonly but not universally 18.

A youth account requires guardian acknowledgment and supervision. Where law
requires consent to process the young person's data, Pods must obtain and
verify consent from the holder of parental responsibility. The exact
age-assurance and guardian-verification mechanism is a release gate for the
security, compliance, and operations design.

Youth accounts may use the non-financial Build and Ship product: join eligible
projects and Pods, make commitments, submit proof, collaborate, publish within
their visibility permissions, and build an activity history.

In the initial Mainnet product, youth accounts cannot:

- Connect a settlement wallet
- Deposit or lock NIM, USDT, or another asset
- Accept participant-funded financial terms
- Receive redistributed forfeitures or financial rewards
- Create or administer a financially funded Event, Project, or Pod
- Act as the legal financial principal for another person

Guardian guidance does not silently convert a youth account into an adult
financial account. A separately designed guardian-sponsored financial model
may be considered later only after jurisdictional, contractual, custody, and
wallet-provider validation.

When a youth person reaches the applicable age of majority, Pods may upgrade
the same canonical person after fresh eligibility confirmation and acceptance
of the current financial terms. Their history and identity do not reset.

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

### Eligibility and consent record

Owns the private eligibility tier, required guardian-consent state, applicable
policy versions, consent timestamps, and the minimum jurisdictional facts
needed to enforce the capability boundary. The exact age or birth-date storage
strategy must minimize personal data and is finalized in the compliance
design.

### Recovery material and sessions

Recovery material owns only hashed one-time codes and their consumption state.
Sessions own device-scoped authentication state, expiry, activity, and
revocation without becoming part of the public profile.

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
9. A canonical person is created only after atomic onboarding completion.
10. No account state may erase or block an existing refund, settlement, payout,
    or reconciliation obligation.
11. Youth participation and financial participation are separate capability
    boundaries.
12. A youth account cannot enter an initial Mainnet financial contract even
    when guardian consent exists.
13. Repository authorization is never bundled into basic GitHub
    authentication.

## Compliance Evidence and Validation Gate

The product policy above is locked, but its implementation remains subject to
jurisdiction-specific legal validation:

- GitHub requires a user to be at least 13. Source:
  [GitHub Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service),
  Definitions.
- Google generally uses 13 as the minimum self-managed-account age but raises
  it in several jurisdictions. Source:
  [Google Account age requirements](https://support.google.com/accounts/answer/1350409).
- United States COPPA obligations focus on children under 13 and require
  verifiable parental consent in covered cases. Source:
  [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions),
  sections D and I.
- GDPR Article 8 starts at 16 for consent-based information-society services
  and permits member states to lower that threshold no further than 13. It
  explicitly does not replace national contract-capacity law. Source:
  [GDPR Article 8](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).
- Nimiq's website terms require legal capacity and the age of majority, while
  stating that wallet and transaction interfaces are governed separately.
  This does not authorize youth financial participation in Pods. Source:
  [Nimiq Website Terms and Conditions](https://www.nimiq.com/website-terms-and-conditions/),
  Eligibility and Separate Services.

Before youth accounts ship, the implementation must validate age assurance,
guardian consent, privacy defaults, contact restrictions, data minimization,
provider eligibility, and jurisdiction handling. Before any youth financial
mode is considered, a separate approved legal and custody design is mandatory.

## Deferred Dependencies

- Public profile and activity facets belong to document 02.
- Roles and actor permissions belong to document 03.
- Authorization and consent belong to document 05.
- Wallet and settlement adapters belong to documents 11 and 23.
- GitHub proof permissions belong to document 19.
- Full service and data architecture belongs to document 22.
- Account merging remains a documented future capability and is excluded from
  the initial Mainnet implementation scope.
- Youth privacy, contact, and visibility defaults belong to documents 02, 05,
  and 14.
- Age assurance, guardian verification, retention, and financial eligibility
  gates belong to document 23.
- A guardian-sponsored youth financial mode is deferred beyond the initial
  Mainnet product.

## Closure

All identity decisions required for the initial Mainnet product are resolved.
Later documents may consume these rules but cannot weaken canonical-person
continuity, provider uniqueness, youth financial restrictions, or the
financial-obligation preservation invariant without an explicit amendment to
this document.
