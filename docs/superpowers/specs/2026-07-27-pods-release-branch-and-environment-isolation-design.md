---
created: 2026-07-27
project: pods
ecosystem: nimiq
tags: [release, git, railway, testnet, mainnet]
---

# Pods Release Branch and Environment Isolation Design

Related: [[HANDOFF]] | [[docs/superpowers/specs/2026-07-24-pods-testnet-settlement-amendment]]

## Objective

Preserve the completed Pods Testnet product as a reproducible deployed release,
keep `main` as the most stable working product, and create an isolated Mainnet
integration line without reusing Testnet funds, data, storage, or secrets.

## Verified Starting State

- `main`, `origin/main`, and `origin/HEAD` point to the same commit.
- There is one registered Git worktree, the canonical `BUILD` checkout.
- No active feature or release branches remain locally or remotely.
- Earlier milestones are preserved as Git tags.
- Two verified Testnet release changes remain uncommitted: the completed
  `HANDOFF.md` journey record and the centered application metric layout.

## Branch Contract

The pending verified Testnet changes are committed to `main`. The resulting
commit is the initial release commit `R0`.

| Reference | Initial commit | Purpose |
|---|---:|---|
| `main` | `R0` | Protected source of the most stable verified product |
| `release/testnet-v0` | `R0` | Railway Testnet deployment line |
| `release/mainnet-v0` | `R0` | Mainnet integration line |
| `testnet-v0.0.0` | `R0` | Immutable annotated Testnet release tag |

Mainnet tasks branch from `release/mainnet-v0` using
`feat/rel-mainnet/<slug>`. They merge only into `release/mainnet-v0` and are
deleted locally and remotely after merge. Testnet emergency fixes use
`fix/rel-testnet/<slug>`, merge into `release/testnet-v0` and `main`, and are
carried into the Mainnet release when applicable.

Railway services deploy only from `release/*` branches. Feature branches never
become deployment sources. When Mainnet v0 passes its complete release gate,
`release/mainnet-v0` merges into `main` and receives an immutable Mainnet tag.

## Cleanup Contract

The final active branch allowlist is:

- Local: `main`, `release/testnet-v0`, `release/mainnet-v0`
- Remote: `origin/main`, `origin/release/testnet-v0`,
  `origin/release/mainnet-v0`

Cleanup prunes stale remote references and stale worktree metadata, verifies
that no stashes or detached worktrees remain, and removes any non-allowlisted
active branches found during the synchronized final audit. Historical
`archive/*` tags remain intact. The existing release tag history also remains
intact.

The current `BUILD` directory remains the only checkout and ends on a clean
`release/mainnet-v0`. The local Testnet database is not deleted, copied, or
treated as Mainnet state.

## Deployment Isolation

The existing Railway web and worker services remain Testnet services. Their
source branch becomes `release/testnet-v0`; their Postgres database, object
storage, treasury, RPC configuration, and public URL remain unchanged. Both
services must report the exact `R0` commit and Testnet network identity before
the release is accepted.

`release/mainnet-v0` is pushed but not deployed during this operation. Mainnet
later receives a separate Railway project containing separate web, worker,
Postgres, object storage, treasury key, RPC configuration, domains, and
deployment identity. No deployed application exposes a Testnet/Mainnet toggle,
and no Testnet database is migrated into Mainnet.

## Execution Sequence

1. Stop current local Pods web and worker processes before changing branches.
2. Run the complete Testnet release gate against the current working tree.
3. Commit the two verified Testnet changes to `main` and push `main`.
4. Create and push `release/testnet-v0`, `release/mainnet-v0`, and the annotated
   `testnet-v0.0.0` tag at the same commit.
5. Configure both Railway Testnet services to deploy
   `release/testnet-v0`, then trigger or verify fresh deployments.
6. Verify service success, health, Testnet network identity, and commit identity.
7. Audit and clean branches, remote references, stashes, and worktrees against
   the allowlist.
8. Switch the sole checkout to clean `release/mainnet-v0`.
9. Update `HANDOFF.md` with the final references and deployment proof.

## Failure and Rollback Rules

- A failed release gate blocks commits, branch creation, and deployment.
- A failed push leaves the local release references intact and blocks Railway
  changes.
- A failed Railway deployment leaves the previous successful deployment active
  where Railway supports it; the release is not declared complete.
- A health response with the wrong network or commit blocks acceptance.
- No branch or tag is force-pushed.
- The `testnet-v0.0.0` tag and Railway deployment history provide rollback
  anchors.

## Acceptance Criteria

- The complete release gate passes from the exact `R0` source.
- `main`, `release/testnet-v0`, `release/mainnet-v0`, and `testnet-v0.0.0`
  resolve to `R0` immediately after creation.
- GitHub contains only the three allowed active branches.
- The canonical checkout is the only registered worktree, has no stash, has no
  uncommitted changes, and is on `release/mainnet-v0`.
- Railway Testnet web and worker are successful deployments from
  `release/testnet-v0` and report `R0` plus `nimiq-testnet` identity.
- No Mainnet infrastructure is created and no Mainnet treasury action occurs.
