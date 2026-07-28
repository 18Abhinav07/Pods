---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, github, integrations, proof, build-and-ship, planning]
---

# 19: GitHub Identity and Proof Integration

Status: review

Related: [[docs/mainnet-planning/01-person-account-and-identity|Identity contract]] |
[[docs/mainnet-planning/10-proof-verification-and-review|Proof contract]] |
[[docs/mainnet-planning/16-build-and-ship-protocol|Build and Ship protocol]] |
[[docs/mainnet-planning/22-data-services-and-background-processing|Service architecture]] |
[[HANDOFF]] | [[README]]

## Purpose

Connect a Pods Person to GitHub, let authorized Projects select repositories,
and convert repository activity into scoped source observations that can
support Build and Ship proof without claiming code quality, originality,
professional skill, or ownership that GitHub cannot establish.

GitHub is both an optional authentication provider and an optional work-source
integration. Those are separate grants with separate lifecycle, permissions,
and revocation.

## External Capability Contract

GitHub Apps have no permissions by default, and their selected permissions
determine which APIs and webhooks are available. Pods therefore requests the
minimum read permissions required by each enabled capability rather than a
broad repository grant.

Source:
https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app

GitHub authorization identifies a user acting with the App. GitHub App
installation grants access to selected repositories owned by a user or
organization. Authorizing Pods does not silently install the App, and
installing the App does not silently link a GitHub login to a Pods Person.

Source:
https://docs.github.com/en/apps/using-github-apps/authorizing-github-apps

Installation access tokens are short-lived and may be further limited to
repositories and permissions. Pods never stores one as a durable credential.

Source:
https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app

## Canonical Records

### GitHubWorkConnection

Private work-source grant between one Pods Person and one GitHub account:

- opaque Pods Person ID;
- GitHub account ID, never username as identity;
- reference to the existing GitHub AuthenticationIdentity from Document 01;
- work-integration authorization grant and scopes;
- connected, suspended, revoked, or disconnected state;
- last successful refresh and reconciliation;
- encrypted work-integration credential reference;
- audit attribution.

`AuthenticationIdentity` remains the only record that owns GitHub sign-in.
Basic GitHub login never grants repository access. Authorizing repository-backed
work first proves the GitHub account through Document 01, then creates a
separate `GitHubWorkConnection` grant. Revoking work access does not remove
GitHub login. Removing GitHub as a login method does not erase historical source
observations or accepted proof, although it prevents new account-attributed
observations until an eligible work connection is restored.

One GitHub account may belong to at most one active Pods Person. The collision
policy from Document 01 denies work authorization when that GitHub account
already belongs to another Person. Account merging remains deferred.

### GitHubInstallation

Represents an App installation independently of any one Person:

- GitHub installation ID;
- owner account ID and type;
- installer Pods Person;
- repository selection mode;
- granted permission snapshot;
- installation state;
- last reconciliation cursor;
- credential reference;
- organization policy status.

Installation ownership does not confer Pods Project ownership. A Person must
also hold the relevant Project integration capability.

### RepositoryConnection

Connects one Pods Project to one repository available through an installation:

- Project ID;
- installation ID;
- stable GitHub repository ID;
- owner and repository display names;
- public or private classification;
- selected proof capabilities;
- allowed Event, Pod, and workstream scopes;
- visibility ceiling;
- connection state;
- frozen configuration version where referenced by a contract.

A repository can support several Projects only through explicit, visible
connections. Pods never infers a Project relationship from repository names,
organizations, or contributors.

### GitHubDeliveryReceipt

Immutable receipt for each webhook delivery:

- GitHub delivery GUID;
- event name and action;
- installation and repository IDs;
- received timestamp;
- signature verification result;
- payload hash;
- processing state;
- retry and reconciliation metadata;
- redacted failure reason.

The unique delivery GUID prevents duplicate processing. A receipt is an
external observation, not a Pods domain fact.

### SourceObservation

Normalized immutable observation of one eligible GitHub artifact or event:

- source provider and stable source ID;
- repository connection;
- artifact type;
- optional source actor account ID;
- optional author, committer, bot, and coauthor account references where the
  source actually supplies them;
- attribution basis:
  - `platform_actor`;
  - `commit_email_association`;
  - `unattributed`;
- signature verification state and provider reason, separately from account
  attribution;
- source timestamps;
- canonical URL;
- source status and reference;
- immutable content hash or safe metadata snapshot;
- visibility classification;
- observation and reconciliation provenance.

Eligible initial types are:

- commit;
- pull request;
- issue;
- release;
- deployment where the selected API and permission have passed validation.

Commit metadata is evidence, not certain human authorship. An email association
never proves that the connected person wrote the commit. Author and committer
may differ, coauthors may exist, bots may act, a squash merge may rewrite the
original contribution shape, and a commit may arrive from a fork. Pods retains
those distinctions rather than collapsing them into one actor claim.

GitHub exposes unsigned, unknown-user, and unverified-email signature
verification outcomes, so a valid commit object does not imply a verified
signature or linked GitHub account.

Source:
https://docs.github.com/en/rest/commits/commits

## Proof Claim Vocabulary

Pods may state only what the connected source supports:

- `source_connected`: this repository was connected through an authorized
  GitHub App installation;
- `activity_observed`: GitHub reported this artifact or event;
- `account_attributed`: GitHub associates the source action with the connected
  account under a disclosed attribution basis;
- `signature_verified`: GitHub reports a verified commit signature under the
  recorded provider reason, independently of account attribution;
- `project_linked`: an authorized Pods Project connected the repository;
- `reviewer_accepted`: a Pods reviewer accepted the commitment under the
  frozen contract.

Pods must not claim:

- the person authored every changed line;
- the work is original;
- the work was not generated by AI;
- the code is correct, secure, valuable, or high quality;
- a merged pull request proves the stated task was completed;
- repository access proves legal ownership;
- activity volume proves competence.

These distinctions appear wherever GitHub-backed claims are shown in proof,
ActivityMoment, Passport, or public shareables.

## Permission Model

1. A Person authorizes GitHub sign-in only when choosing that authentication
   provider.
2. A repository owner or organization administrator installs the GitHub App.
3. An authorized Project lead selects a repository available to the
   installation.
4. The Project contract declares which repository observations may support
   which commitments or milestones.
5. Each participant explicitly authorizes the GitHub work source before Pods
   can associate source activity with their account. Basic sign-in is not that
   authorization.
6. A repository observation does not become proof until the participant
   selects it or the frozen contract explicitly permits an automatic proposal.
7. Automatic proposal means Pods can suggest evidence. It never means
   automatic acceptance.
8. Private repository data remains private to the narrow Project and review
   audiences allowed by Documents 05 and 10.
9. Public shareables use only public source data or an explicitly approved,
   safe published snapshot.

## Integration Flow

```text
Person signs in with or links GitHub AuthenticationIdentity if needed
-> Person explicitly authorizes GitHubWorkConnection
-> repository owner installs Pods GitHub App
-> owner selects repositories
-> Pods reconciles installation and permissions
-> Project lead selects repository and proof capabilities
-> participant connects GitHub account
-> webhook or reconciliation produces SourceObservation
-> participant attaches observation to commitment
-> Pods presents exact claim basis
-> reviewer evaluates under frozen contract
-> terminal result updates ActivityMoment and eligible Passport claims
```

## Webhook and Reconciliation Contract

1. Pods validates `X-Hub-Signature-256` using the environment-specific webhook
   secret before accepting a delivery.

   Source:
   https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries

2. The webhook endpoint persists the receipt and returns a successful response
   quickly. Parsing and product processing happen asynchronously.
3. GitHub considers a response taking longer than ten seconds a failed
   delivery, and failed deliveries are not automatically redelivered.
   Scheduled reconciliation is therefore required rather than relying only on
   webhooks.

   Source:
   https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries

4. Deliveries may arrive out of order. Pods compares source timestamps and
   retrieves current source state rather than trusting arrival order.

   Source:
   https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks

5. Every processor is idempotent by delivery GUID and normalized source key.
6. Unknown installations or repositories remain quarantined receipts and
   never create product facts.
7. Periodic reconciliation covers missed deliveries, permission changes,
   installation suspension, repository transfer, deletion, and source-state
   changes.
8. Provider rate limiting creates a visible delayed-source state. It never
   invents a proof outcome.

## Source Changes and Revocation

- Renamed repository: stable repository ID retains continuity and display name
  updates.
- Transferred repository: connection pauses until the new installation
  authorizes it.
- Private to public: no old private content is published automatically.
- Public to private: future public projection stops; existing external copies
  cannot be recalled.
- Force push or deleted branch: immutable accepted observation remains with a
  source-unavailable label and retained hash where policy permits.
- Deleted artifact: claim becomes source-unavailable and may trigger review if
  the frozen contract requires continued accessibility.
- App suspension or uninstall: source refresh stops immediately.
- Work authorization revoked: new account attribution stops, but prior source
  observations and accepted proof retain historical provenance under retention
  policy.
- GitHub login unlinked: authentication access changes under Document 01, while
  historical source observations remain and the work connection cannot create
  new attributed observations until its identity requirement is restored.
- Project disconnect: no new observations enter that Project.

`SourceObservation` itself remains immutable. A later rename, deletion,
visibility change, transfer, suspension, or disconnect emits
`SourceObservationAvailabilityChanged` with the previous state, current state,
source time, observed time, and reason. Whether that change makes an artifact
ineligible for a commitment is a separate proof or milestone decision. Source
unavailability never rewrites the historical observation.

## Privacy and Retention

1. Raw webhook payloads use the shortest validated retention needed for
   security and reconciliation.
2. Pods stores only the normalized fields needed for enabled product claims.
3. Private source content does not enter public logs, notifications, analytics,
   or error reporting.
4. Repository and account tokens are encrypted and referenced indirectly.
5. Logs contain stable internal IDs rather than credentials, raw payloads, or
   private repository URLs.
6. Disconnect removes credentials immediately. Minimal accepted proof metadata
   may remain where required for contract history, dispute, or audit.
7. A deleted Person uses the pseudonymized history rules from Document 01.

## Commands and Facts

Representative commands:

- `AuthorizeGitHubWorkSource`
- `RevokeGitHubWorkSource`
- `InstallGitHubAppObserved`
- `ConnectRepository`
- `ChangeRepositoryCapabilities`
- `DisconnectRepository`
- `AttachSourceObservationToCommitment`
- `ReconcileGitHubInstallation`
- `SuspendGitHubConnection`

Representative domain facts:

- `GitHubWorkConnectionAuthorized`
- `GitHubWorkConnectionRevoked`
- `GitHubInstallationRegistered`
- `RepositoryConnected`
- `RepositoryConnectionSuspended`
- `SourceObservationRecorded`
- `SourceObservationAttached`
- `SourceObservationAvailabilityChanged`

External webhook receipts never use these fact names until Pods validates the
command, actor, scope, lifecycle, consent, and source state.

## Required Validation Gate

The integration remains unavailable until all pass:

- GitHub sign-in in a normal browser and Nimiq Pay WebView;
- provider collision denial;
- personal and organization App installation;
- selected-repository access;
- minimum permissions for every enabled artifact;
- private repository redaction;
- webhook signature rejection and replay deduplication;
- out-of-order delivery;
- failed delivery plus reconciliation recovery;
- installation-token expiry and renewal;
- repository rename, transfer, deletion, and visibility changes;
- organization approval or policy restriction;
- participant attribution;
- unsigned commit;
- unknown GitHub user;
- unverified email association;
- bot-authored or bot-committed activity;
- coauthored commit;
- fork-originated commit;
- squash merge;
- differing author and committer identities;
- artifact attachment without automatic review acceptance;
- uninstall and user-authorization revocation;
- no private source data in public DTOs, notifications, logs, or shareables.

## Failure States

- provider account already linked;
- installation requires organization approval;
- repository not selected;
- permission missing;
- installation suspended;
- source delayed;
- source unavailable;
- source actor not linked;
- attribution ambiguous;
- artifact not eligible for this contract;
- reconciliation behind;
- rate limited;
- source visibility exceeds destination visibility;
- provider disconnected after submission.

Every failure identifies whether the person can retry, an administrator must
act, Pods is reconciling, or the source cannot be used.

## Non-goals

- Git hosting.
- Code review automation.
- Engineering productivity surveillance.
- Commit-count ranking.
- Automatic quality or originality scoring.
- Writing to repositories in the initial integration.
- Treating GitHub as the canonical Pods Person.

## Interdependencies

- Document 01 owns provider linking and collision handling.
- Document 05 owns permission and visibility ceilings.
- Document 06 owns commands, facts, receipts, and outbox behavior.
- Document 10 owns proof judgment.
- Document 12 owns ActivityMoment and public share snapshots.
- Document 13 owns precise Passport claim derivation.
- Document 16 owns Build and Ship semantics.
- Document 22 owns integration workers and failure isolation.
- Document 23 owns secrets, operator access, and security validation.
- Document 25 owns environment-specific GitHub Apps and webhook secrets.

## Review Findings

- GitHub authentication and GitHub work authorization are independent grants.
- Source attribution and commit-signature verification are independent claims.
- Webhooks remain receipts until a Pods command accepts a normalized
  observation.
- Repository changes and revocation preserve historical provenance without
  silently preserving future access.
- No GitHub signal independently approves work, reputation, or payment.

## Closure Condition

Lock only after Spike B in Document 27 passes personal and organization
installations, attribution edge cases, signed webhook replay, reconciliation,
revocation, repository lifecycle, private-source redaction, and exact public
claim wording in the intended browser and Nimiq Pay environments.
