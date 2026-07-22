---
project: pods
last-updated: 2026-07-22 20:07
last-agent: codex
mode: HACKATHON
---

## State

Phase 4 social alpha now has the approved Signal Bloom identity implemented across every route, with a lowercase wordmark and catalog-safe transparent SVG.

## In Progress (resume here)

- Task: verify the pushed identity inside Nimiq Pay after the next deployment, including the Mini App tile or custom-URL favicon.
- File: `apps/web/public/brand/pods-mark.svg` is the production master; catalog publication still requires the external Nimiq Mini App submission flow.

## Open Errors / Blockers

- The current Railway release still points at the earlier deployed commit until the new branch commit is promoted or merged.
- Nimiq Pay catalog artwork is sourced through the official `nimiq/awesome` submission, so pushing this repository alone cannot change the public catalog tile.
- Financial worker and treasury configuration remain intentionally disabled in production.

## Git State

- Branch `phase/04a-social-alpha-foundation` pushed through `7a775df feat: add Signal Bloom brand identity`; documentation closeout follows in the next commit.

## Next 3 Tasks

1. Promote the verified identity commit to the production deployment and complete a Nimiq Pay device check.
2. Submit the SVG with the Pods Mini App catalog entry using the required developer-prefixed filename.
3. Run the separate-worker Railway gate before enabling the capped Testnet dogfood cohort.
