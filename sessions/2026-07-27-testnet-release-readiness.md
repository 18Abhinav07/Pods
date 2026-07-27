---
created: 2026-07-27
project: pods
ecosystem: nimiq
tags: [session, codex, testnet, release, railway]
---

# Testnet Release Readiness

Related: [[HANDOFF]] | [[sessions/INDEX]]

## Completed

- Audited the complete local Testnet product rather than relying on historical
  branch or deployment claims.
- Removed the obsolete public design-preview route and its database-backed
  prototype implementation from the release surface.
- Corrected deterministic hydration, direct-message color variables, proof
  media sizing, archived-room duplication, and first-visible image loading.
- Upgraded vulnerable production dependencies and pinned safe transitive
  versions without changing the application contract.
- Hardened the end-to-end harness to build first and test the production Next.js
  server with local-only HTTP cookie behavior.
- Made the documented worker development command default to the local runtime
  only outside production, while preserving fail-closed Alpha validation.
- Preserved the previously uncommitted responsive-polish session as a linked
  canonical note before cleaning obsolete worktrees.

## Verification

- `pnpm check` passed: lint, copy safety, all type checks, 772 unit and
  component tests, 94 live integration tests, and web plus worker builds.
- `pnpm test:e2e` passed 40 of 40 mobile journeys across Mobile Safari and
  Android Chromium.
- `pnpm audit --prod --audit-level high` reported no known vulnerabilities.
- `git diff --check` passed and the release diff contains no environment,
  credential, private-key, or secret files.

## Boundaries

- Railway is a Testnet release target only.
- Mainnet is not enabled by this work.
- Automated proof does not replace the final physical Nimiq Pay smoke check.
- The fresh local stack reports ready web configuration, database, object
  storage, schema, and a healthy worker cycle with zero application rows.
