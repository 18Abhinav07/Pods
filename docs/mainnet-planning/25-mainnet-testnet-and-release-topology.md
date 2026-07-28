---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: nimiq
tags: [mainnet, testnet, railway, releases, environments, deployment, planning]
---

# 25: Mainnet, Testnet, and Release Topology

Status: review

Related: [[docs/mainnet-planning/22-data-services-and-background-processing|Service architecture]] |
[[docs/mainnet-planning/23-security-custody-compliance-and-operations|Security contract]] |
[[docs/superpowers/specs/2026-07-27-pods-release-branch-and-environment-isolation-design|Release design]] |
[[HANDOFF]] | [[README]]

## Purpose

Keep local development, preview, public Testnet, Mainnet staging, and Mainnet
production isolated so code, identity, data, storage, OAuth, GitHub, RPC,
treasury, and signer state cannot cross environments by accident.

There is no in-product Testnet/Mainnet switch.

## Environment Topology

| Environment | Product purpose | Funds |
|---|---|---|
| Local | development and deterministic tests | synthetic or Nimiq Testnet only |
| Preview | UI, review, and nonfinancial integration review | no signing and no public financial action |
| Testnet release | public testing and complete financial rehearsal | isolated Nimiq Testnet treasury |
| Mainnet staging | production-shaped rehearsal | signing disabled or isolated approved non-production rail |
| Mainnet production | controlled real-value product | approved Mainnet signer and policy limits |

## Complete Isolation Contract

Each environment has distinct:

- public origin and callback origins;
- web service;
- worker service;
- Postgres database;
- object-storage buckets and access credentials;
- session, encryption, HMAC, webhook, and internal service secrets;
- environment-specific Google OAuth client registration;
- environment-specific GitHub App registration where GitHub work integration
  is enabled;
- Nimiq RPC and network;
- treasury address and signer;
- notification provider configuration;
- rate-limit namespace;
- monitoring and alert destinations;
- release manifest;
- audit environment identity.

Testnet and Mainnet never share:

- Person records;
- usernames;
- provider connections;
- sessions;
- object graph;
- contracts;
- proof;
- messages;
- ledger;
- treasury;
- share tokens;
- object storage;
- operator sessions.

Testnet data may inform migration tests but cannot be copied into Mainnet as
authoritative product or financial state.

## Immutable Environment Identity

Every deployment environment receives one immutable, random
`environmentInstanceId`. Human-readable names such as `testnet`, `staging`, or
`production` are labels and cannot substitute for this identity.

The exact ID is stored in:

- one protected database environment-identity row;
- one object-storage sentinel;
- web configuration;
- every worker and migration-job configuration;
- the release manifest;
- every authoritative audit fact;
- treasury and signer configuration.

At startup, every process compares:

- configured `environmentInstanceId`;
- database identity;
- storage identity;
- RPC network and genesis identity;
- expected treasury or signer public identity;
- OAuth client ID;
- GitHub App ID where enabled;
- public origin;
- release-manifest identity.

Any mismatch refuses startup before serving traffic, leasing work, observing
money, signing, or broadcasting. A structurally valid database, bucket, OAuth
client, GitHub App, RPC, or signer from another environment is still invalid.

## GitHub App Isolation

GitHub work integration uses distinct App registrations:

- Mainnet production has its own GitHub App;
- Mainnet staging has its own App when the integration is enabled;
- public Testnet has its own GitHub App;
- local and preview use a dedicated development App with isolated callbacks and
  repositories, or disable GitHub work integration entirely.

Each registration has its own App ID, private key, user-authorization callback
allowlist, webhook URL, webhook secret, installation set, and reconciliation
credentials. Public Testnet and Mainnet never share a GitHub App registration.
A registration can support multiple authorization callback URLs, but its
webhook configuration belongs to the App, so callback separation alone is not
an environment boundary.

Sources:

- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/using-webhooks-with-github-apps
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/about-the-user-authorization-callback-url

## Google OAuth Isolation

Public Testnet, Mainnet staging, and Mainnet production each use a distinct
Google OAuth client registration with its own client ID, secret where
applicable, consent-screen configuration, and exact redirect allowlist. Local
and preview may share one dedicated development client only when its callbacks
and data remain isolated from every long-lived public environment.

The expected OAuth client ID is part of the environment identity check. A valid
authorization response issued for another Pods environment is rejected.

## Branch and Promotion Contract

- `main` is the latest fully verified stable source.
- `release/testnet-v0` is the frozen deployed Testnet line.
- `release/mainnet-v0` is the Mainnet integration line until a Mainnet release
  passes its release gate.
- Mainnet feature branches use `feat/rel-mainnet/<slug>`.
- A feature branch merges only into its target release line.
- A completed Mainnet release merges into `main` after validation and review.
- Every deployed release receives an immutable annotated tag.
- Production is deployed from a verified immutable commit or artifact, never
  an unreviewed working branch.

The existing Testnet branch remains frozen unless an explicit safety or
release-maintenance decision authorizes a change.

## Release Manifest

Every web and worker artifact embeds:

- product version;
- complete Git commit;
- build timestamp;
- schema compatibility range;
- domain package versions;
- environment;
- immutable environment instance ID;
- settlement adapter and network;
- expected treasury or signer identity hash;
- public origin;
- worker protocol version;
- feature capability manifest.

Readiness exposes the non-sensitive subset.

Processes refuse startup on:

- environment or network mismatch;
- database, storage, OAuth, GitHub App, origin, treasury, signer, or release
  manifest environment-instance mismatch;
- unexpected treasury or signer identity;
- incompatible schema;
- incompatible web and worker protocol;
- missing required secret;
- wrong callback origin;
- Mainnet with a Testnet-only package or financial flag;
- financial capability without an approved signer and risk policy.

## Deployment Units

Minimum Railway layout per long-lived release environment:

- web service;
- general worker service;
- financial worker or signer-facing service boundary where custody design
  requires it;
- Postgres;
- S3-compatible external storage or explicitly managed compatible service;
- migration job;
- optional callback or webhook ingress where separation is required.

Mainnet production uses a separate Railway project from Testnet. Staging is
also isolated where Mainnet credentials or data would otherwise be shared.

## Database Migration Contract

Use:

```text
expand
-> deploy compatible readers and writers
-> migrate or backfill in bounded resumable jobs
-> verify counts, invariants, and projections
-> contract only after old processes are gone
```

Rules:

- migration job runs once against the exact target database;
- web and workers verify schema compatibility before serving;
- destructive contraction requires backup and rollback evidence;
- release rollback cannot silently run old code against an incompatible
  schema;
- financial ledger migrations preserve balanced entries;
- projection rebuilds are separate from authoritative migrations;
- Testnet migration success does not replace Mainnet staging rehearsal.

## Feature Capability Contract

Capabilities are environment and policy records:

- authentication providers;
- public discovery;
- social relationships;
- GitHub integration;
- external distribution;
- ActivityDomain packages;
- economic modes;
- supported assets;
- deposits;
- settlement;
- payout broadcast;
- realtime transport.

Rules:

- disabled means server rejection, not hidden UI only;
- financial capabilities fail closed;
- unavailable domain packages cannot be forced through API input;
- web and worker use the same signed or versioned manifest;
- a release cannot advertise a route whose source-of-truth path is incomplete;
- emergency pauses are distinct from build-time availability.

## Mainnet Activation Sequence

```text
deploy nonfinancial Mainnet staging
-> pass identity and graph journeys
-> pass GitHub and distribution validation
-> rehearse economic modes on isolated Testnet under Mainnet architecture
-> deploy Mainnet production with financial actions disabled
-> verify release, schema, network, signer, limits, and reconciliation
-> authorize one bounded canary under explicit human approval
-> reconcile canary
-> open controlled adult allowlist beta
-> expand only through recorded risk decisions
```

No Mainnet transfer, signer upload, treasury movement, or financial capability
is authorized by this planning document.

## Rollback and Incident Release

- product code rollback preserves forward-compatible schema;
- worker rollback never repeats an ambiguous side effect;
- financial incident can enter reconciliation-only mode without a redeploy;
- compromised credentials rotate independently of application deploy;
- public pages may remain available while protected mutations pause;
- security fixes receive a dedicated hotfix branch and immutable release tag;
- every emergency deployment records exact authority, reason, commit, and
  follow-up review.

## Domain and Deep-Link Separation

- Testnet and Mainnet use visibly distinct origins.
- Shareable and invitation tokens are environment-scoped.
- A Testnet URL never resolves into a Mainnet object and vice versa.
- Nimiq Pay metadata, title, and icon identify the correct release.
- Mainnet pages never label Testnet funds as Mainnet or accept Testnet wallet
  state.
- Callback allowlists use exact origin, path, and environment.

## Required Validation Gate

- wrong database fails startup;
- wrong bucket fails startup;
- valid but cross-environment database or bucket fails startup by immutable
  environment identity;
- wrong OAuth or GitHub callback origin fails;
- wrong OAuth client ID or GitHub App ID fails;
- wrong webhook secret fails;
- Mainnet process with Testnet RPC fails;
- Testnet process with Mainnet treasury fails;
- web cannot access signer credential;
- worker cannot serve consumer routes;
- migration rehearsal from a production-sized snapshot;
- old and new process overlap through expand phase;
- rollback after predeploy migration;
- Testnet and Mainnet invitation and share links cannot cross;
- readiness reports exact commit and schema;
- backup and restore in a separate recovery environment;
- financial capabilities remain disabled without explicit activation;
- bounded Mainnet canary requires separate authority and verified recipient.

## Current Testnet Contradictions

- `parseAlphaCapabilities` rejects Mainnet.
- `parsePublicRuntimeIdentity` requires Testnet.
- worker startup requires `NIMIQ_NETWORK=testnet`.
- treasury preflight accepts a raw Testnet key.
- the `FundingNetwork` type includes `mainnet`, but that is vocabulary rather
  than validated support.
- current Railway configuration uses generic service configuration and
  environment variables rather than a complete signed release manifest.
- Testnet and Mainnet isolation is documented but not yet implemented as a
  complete independent Mainnet project.

## Non-goals

- One deployment with a network toggle.
- Copying the Testnet database into Mainnet.
- Enabling Mainnet by changing one environment variable.
- Sharing signer credentials between services.
- Treating a successful build as release approval.
- Mainnet canary without explicit user authority.

## Interdependencies

- Document 22 owns process and schema compatibility.
- Document 23 owns signer, treasury, secrets, and activation authority.
- Document 24 owns public origins and routes.
- Document 19 requires environment-specific GitHub callbacks and secrets.
- Document 20 requires environment-safe public Shareables.
- Document 21 determines package availability by environment.
- Document 26 verifies the integrated environment matrix.
- Document 27 owns validation and release ordering.

## Review Findings

- Local, preview, public Testnet, Mainnet staging, and Mainnet production are
  independent environment identities, not values of one network toggle.
- Long-lived public environments share no authoritative data, credentials,
  OAuth client, GitHub App, storage, treasury, or signer.
- Every process refuses startup when database, storage, origin, integration,
  network, release, treasury, or signer identity disagrees.
- Release promotion uses immutable artifacts, expand and contract migrations,
  rollback rehearsal, and explicit financial activation.
- Testnet history is evidence and test input, never Mainnet authority.

## Closure Condition

Lock after startup mismatch tests, isolated OAuth and GitHub callbacks,
database and storage restore, migration overlap and rollback, immutable release
manifest verification, treasury and signer preflight, and a bounded Mainnet
canary policy all pass.
