---
created: 2026-07-27
project: pods
ecosystem: nimiq
tags: [implementation-plan, release, git, railway, testnet, mainnet]
---

# Pods Release Branch and Environment Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze the verified Pods Testnet product on a deployed release branch and leave one clean checkout on an isolated Mainnet integration branch.

**Architecture:** `main` remains the stable product source, Railway Testnet follows `release/testnet-v0`, and Mainnet work integrates through `release/mainnet-v0`. The Testnet and future Mainnet deployments share repository history but never share runtime infrastructure, funds, databases, storage, or secrets.

**Tech Stack:** Git, GitHub CLI, pnpm, Vitest, Playwright, Docker Compose, Railway CLI 5.26.2, Railway GitHub sources

Related: [[docs/superpowers/specs/2026-07-27-pods-release-branch-and-environment-isolation-design]] | [[HANDOFF]]

---

## File Map

- Modify `README.md`: correct the current Testnet payout-broadcast status.
- Modify `HANDOFF.md`: preserve the completed physical Testnet journey in the release commit, then record the completed release split on the Mainnet integration line.
- Modify `apps/web/src/components/acquisition-flow.module.css`: include the already device-approved centered application facts.
- Create `docs/superpowers/specs/2026-07-27-pods-release-branch-and-environment-isolation-design.md`: durable release contract, already committed.
- Create `docs/superpowers/plans/2026-07-27-pods-release-branch-and-environment-isolation.md`: this executable plan.
- No product database row, Testnet object, Railway secret, or treasury value is copied into Mainnet.

## Fixed Railway Targets

| Resource | ID |
|---|---|
| Project `shimmering-empathy` | `acb9a49a-c512-4e9d-9089-6d5c7b62b9d2` |
| Production environment | `10b9cc5d-16d7-40f8-9b66-1f9ed600fe1c` |
| Web service `Pods` | `d435884c-78f8-4f70-b190-4e441505065b` |
| Worker service `Pods Worker` | `499a0f4b-928b-4c43-b06c-0dd6bcbe226b` |
| Testnet URL | `https://pods-nimiq-activity.up.railway.app` |

Use these telemetry values on every Railway CLI call:

```bash
RAILWAY_CALLER=skill:use-railway@1.3.6
RAILWAY_AGENT_SESSION=pods-release-split-20260727
```

### Task 1: Stop local runtimes and prove the Git baseline

**Files:**
- Inspect: repository and process state only

- [ ] **Step 1: Resolve listeners before stopping them**

```bash
lsof -nP -iTCP:3411 -sTCP:LISTEN
lsof -nP -iTCP:3412 -sTCP:LISTEN
```

Expected: each active Pods process is shown with an exact PID, or the command reports no listener.

- [ ] **Step 2: Stop only the resolved Pods listeners**

Run `kill <exact-pid>` for each PID returned in Step 1, then verify:

```bash
lsof -nP -iTCP:3411 -sTCP:LISTEN
lsof -nP -iTCP:3412 -sTCP:LISTEN
```

Expected: no listener on either port.

- [ ] **Step 3: Fetch and inventory all Git references**

```bash
git fetch origin --prune --tags
git status --short --branch
git for-each-ref --format='%(refname:short) %(objectname)' refs/heads refs/remotes/origin
git worktree list --porcelain
git stash list
```

Expected: `main` is the only active local and remote branch, one worktree exists, the stash is empty, and only the approved release files are modified.

### Task 2: Reconcile Testnet release documentation

**Files:**
- Modify: `README.md`
- Verify: `HANDOFF.md`
- Verify: `apps/web/src/components/acquisition-flow.module.css`

- [ ] **Step 1: Correct the README release status**

Replace the outdated sentence that says automatic Testnet payout broadcasting remains disabled with:

```text
The verified core is deployed on Railway. Automatic low-value Testnet payout broadcasting is explicitly authorized and enabled for the isolated Testnet web and worker services. Mainnet funds and Mainnet deployment remain unauthorized.
```

- [ ] **Step 2: Inspect the complete pending release diff**

```bash
git diff -- README.md HANDOFF.md apps/web/src/components/acquisition-flow.module.css
git diff --check
```

Expected: only the payout-status correction, completed physical journey handoff, and centered mobile application facts appear; `git diff --check` prints nothing.

- [ ] **Step 3: Enforce the product copy constraint**

```bash
if rg -n $'\u2014' README.md HANDOFF.md apps/web/src/components/acquisition-flow.module.css; then exit 1; fi
```

Expected: exit code 0 with no U+2014 matches.

### Task 3: Run the complete Testnet release gate

**Files:**
- Test: existing repository suites only

- [ ] **Step 1: Start the isolated local dependencies**

```bash
corepack pnpm services:up
```

Expected: Postgres and object storage report healthy.

- [ ] **Step 2: Run the repository gate**

```bash
corepack pnpm check
```

Expected: lint, copy safety, all TypeScript projects, unit/component tests, PostgreSQL integration tests, and production builds pass.

- [ ] **Step 3: Run the complete mobile browser matrix**

```bash
corepack pnpm --filter @pods/web test:e2e
```

Expected: Mobile Safari and Android Chromium journeys pass against a fresh production build.

- [ ] **Step 4: Confirm the release tree remains limited to intended files**

```bash
git status --short
git diff --check
```

Expected: only `README.md`, `HANDOFF.md`, and `apps/web/src/components/acquisition-flow.module.css` are modified.

### Task 4: Commit and publish the stable Testnet source

**Files:**
- Commit: `README.md`
- Commit: `HANDOFF.md`
- Commit: `apps/web/src/components/acquisition-flow.module.css`

- [ ] **Step 1: Commit the release source changes**

```bash
git add README.md HANDOFF.md apps/web/src/components/acquisition-flow.module.css
git commit -m "fix: finalize the Testnet v0 release"
```

Expected: one commit containing exactly the three release files.

- [ ] **Step 2: Capture and verify the release commit**

```bash
PODS_RELEASE_COMMIT="$(git rev-parse HEAD)"
test "$(git rev-parse main)" = "$PODS_RELEASE_COMMIT"
git status --short
```

Expected: a 40-character commit SHA and a clean working tree.

- [ ] **Step 3: Push stable `main`**

```bash
git push origin main
git fetch origin --prune
test "$(git rev-parse main)" = "$(git rev-parse origin/main)"
```

Expected: local and remote `main` resolve to the release commit.

### Task 5: Create the Testnet and Mainnet release references

**Files:**
- Create Git branches and an annotated tag only

- [ ] **Step 1: Create both release branches and the immutable tag**

```bash
PODS_RELEASE_COMMIT="$(git rev-parse main)"
git branch release/testnet-v0 "$PODS_RELEASE_COMMIT"
git branch release/mainnet-v0 "$PODS_RELEASE_COMMIT"
git tag -a testnet-v0.0.0 "$PODS_RELEASE_COMMIT" -m "Pods Testnet v0.0.0"
```

Expected: all three new references resolve to `PODS_RELEASE_COMMIT`.

- [ ] **Step 2: Publish the release references atomically**

```bash
git push --atomic origin release/testnet-v0 release/mainnet-v0 testnet-v0.0.0
git branch --set-upstream-to=origin/release/testnet-v0 release/testnet-v0
git branch --set-upstream-to=origin/release/mainnet-v0 release/mainnet-v0
```

Expected: GitHub receives both branches and the tag together, or receives none of them.

- [ ] **Step 3: Verify the remote allowlist**

```bash
git fetch origin --prune --tags
git for-each-ref --format='%(refname:short) %(objectname)' refs/heads refs/remotes/origin
git rev-parse main release/testnet-v0 release/mainnet-v0 testnet-v0.0.0^{}
git symbolic-ref --short refs/remotes/origin/HEAD
gh repo view 18Abhinav07/Pods --json defaultBranchRef
```

Expected: the only active branches are `main`, `release/testnet-v0`, and `release/mainnet-v0`; all four release references resolve to the same commit; local tracking is configured; both Git and GitHub report `main` as the default branch.

### Task 6: Pin and deploy Railway Testnet from `release/testnet-v0`

**Files:**
- Modify Railway service configuration only

- [ ] **Step 1: Set the exact public release identity without triggering partial deploys**

```bash
PODS_RELEASE_COMMIT="$(git rev-parse release/testnet-v0)"
env RAILWAY_CALLER=skill:use-railway@1.3.6 RAILWAY_AGENT_SESSION=pods-release-split-20260727 railway variable set PODS_RELEASE_SHA="$PODS_RELEASE_COMMIT" --skip-deploys --project acb9a49a-c512-4e9d-9089-6d5c7b62b9d2 --environment 10b9cc5d-16d7-40f8-9b66-1f9ed600fe1c --service d435884c-78f8-4f70-b190-4e441505065b
env RAILWAY_CALLER=skill:use-railway@1.3.6 RAILWAY_AGENT_SESSION=pods-release-split-20260727 railway variable set PODS_RELEASE_SHA="$PODS_RELEASE_COMMIT" --skip-deploys --project acb9a49a-c512-4e9d-9089-6d5c7b62b9d2 --environment 10b9cc5d-16d7-40f8-9b66-1f9ed600fe1c --service 499a0f4b-928b-4c43-b06c-0dd6bcbe226b
```

Expected: both service variables accept the exact 40-character Testnet release SHA without exposing any secret values.

- [ ] **Step 2: Connect both services to the Testnet release branch**

```bash
env RAILWAY_CALLER=skill:use-railway@1.3.6 RAILWAY_AGENT_SESSION=pods-release-split-20260727 railway service source connect --repo 18Abhinav07/Pods --branch release/testnet-v0 --project acb9a49a-c512-4e9d-9089-6d5c7b62b9d2 --environment 10b9cc5d-16d7-40f8-9b66-1f9ed600fe1c --service d435884c-78f8-4f70-b190-4e441505065b --json
env RAILWAY_CALLER=skill:use-railway@1.3.6 RAILWAY_AGENT_SESSION=pods-release-split-20260727 railway service source connect --repo 18Abhinav07/Pods --branch release/testnet-v0 --project acb9a49a-c512-4e9d-9089-6d5c7b62b9d2 --environment 10b9cc5d-16d7-40f8-9b66-1f9ed600fe1c --service 499a0f4b-928b-4c43-b06c-0dd6bcbe226b --json
```

Expected: both services report GitHub repository `18Abhinav07/Pods` and branch `release/testnet-v0`.

- [ ] **Step 3: Force fresh source deployments**

```bash
env RAILWAY_CALLER=skill:use-railway@1.3.6 RAILWAY_AGENT_SESSION=pods-release-split-20260727 railway redeploy --from-source --yes --project acb9a49a-c512-4e9d-9089-6d5c7b62b9d2 --environment 10b9cc5d-16d7-40f8-9b66-1f9ed600fe1c --service d435884c-78f8-4f70-b190-4e441505065b --json
env RAILWAY_CALLER=skill:use-railway@1.3.6 RAILWAY_AGENT_SESSION=pods-release-split-20260727 railway redeploy --from-source --yes --project acb9a49a-c512-4e9d-9089-6d5c7b62b9d2 --environment 10b9cc5d-16d7-40f8-9b66-1f9ed600fe1c --service 499a0f4b-928b-4c43-b06c-0dd6bcbe226b --json
```

Expected: one new web deployment and one new worker deployment are created from the configured GitHub source.

- [ ] **Step 4: Poll each deployment without waiting silently for longer than 60 seconds**

```bash
env RAILWAY_CALLER=skill:use-railway@1.3.6 RAILWAY_AGENT_SESSION=pods-release-split-20260727 railway deployment list --limit 1 --json --project acb9a49a-c512-4e9d-9089-6d5c7b62b9d2 --environment 10b9cc5d-16d7-40f8-9b66-1f9ed600fe1c --service d435884c-78f8-4f70-b190-4e441505065b
env RAILWAY_CALLER=skill:use-railway@1.3.6 RAILWAY_AGENT_SESSION=pods-release-split-20260727 railway deployment list --limit 1 --json --project acb9a49a-c512-4e9d-9089-6d5c7b62b9d2 --environment 10b9cc5d-16d7-40f8-9b66-1f9ed600fe1c --service 499a0f4b-928b-4c43-b06c-0dd6bcbe226b
```

Expected: both terminal statuses are `SUCCESS`, both metadata records identify `release/testnet-v0`, and both commit hashes equal `PODS_RELEASE_COMMIT`. On failure, inspect only the failed deployment's bounded build and runtime logs and stop acceptance.

- [ ] **Step 5: Verify the public Testnet runtime identity**

```bash
curl -fsS https://pods-nimiq-activity.up.railway.app/health/ready
```

Expected JSON: service `pods-web`, status `ready`, every check `ready`, runtime deployment flavor `testnet`, funds network `nimiq-testnet`, commit SHA equal to the first 12 characters of `PODS_RELEASE_COMMIT`, and schema `0017_robust_loners`.

### Task 7: Final cleanup and Mainnet handoff

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Prune and audit Git metadata**

```bash
git fetch origin --prune --tags
git worktree prune --verbose
git worktree list --porcelain
git stash list
git for-each-ref --format='%(refname:short) %(objectname)' refs/heads refs/remotes/origin
```

Expected: one canonical worktree, no stash, and only the three allowed active branches plus `origin/HEAD`.

- [ ] **Step 2: Switch the sole checkout to the Mainnet integration line**

```bash
git switch release/mainnet-v0
git status --short --branch
```

Expected: clean `release/mainnet-v0` tracking `origin/release/mainnet-v0`.

- [ ] **Step 3: Rewrite the project handoff with final evidence**

Record the stable `main` and Testnet release commit, `testnet-v0.0.0`, both successful Railway deployment IDs, the verified readiness identity, the active `release/mainnet-v0` branch, and the hard prohibition on reusing Testnet infrastructure for Mainnet.

- [ ] **Step 4: Commit and push the Mainnet handoff only**

```bash
git add HANDOFF.md
git commit -m "docs: hand off the Mainnet v0 release line"
git push -u origin release/mainnet-v0
```

Expected: the Mainnet integration branch advances only by the handoff commit; `main` and `release/testnet-v0` remain pinned to the deployed Testnet release.

- [ ] **Step 5: Run the terminal proof**

```bash
git status --short --branch
git worktree list --porcelain
git stash list
git for-each-ref --format='%(refname:short) %(objectname)' refs/heads refs/remotes/origin
git rev-parse main release/testnet-v0 testnet-v0.0.0^{}
```

Expected: the working tree is clean on `release/mainnet-v0`; one worktree and no stash exist; `main`, `release/testnet-v0`, and `testnet-v0.0.0` resolve to the deployed Testnet commit; no obsolete active branch remains.
