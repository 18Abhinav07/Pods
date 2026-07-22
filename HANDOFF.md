---
project: pods
last-updated: 2026-07-22 20:40
last-agent: codex
mode: HACKATHON
---

## State

Phase 4 social alpha with the approved Signal Bloom identity is live at `https://pods-nimiq-activity.up.railway.app` on Railway deployment `d7c0b394-1bf6-40af-a55e-b92c55a843a3`.

## In Progress (resume here)

- Task: verify the live identity inside Nimiq Pay on a physical phone, including the custom-URL favicon and wallet WebView header behavior.
- File: `apps/web/public/brand/pods-mark.svg` is the production master; catalog publication still requires the external Nimiq Mini App submission flow.

## Open Errors / Blockers

- Nimiq Pay catalog artwork is sourced through the official `nimiq/awesome` submission, so pushing this repository alone cannot change the public catalog tile.
- Financial worker and treasury configuration remain intentionally disabled in production.

## Git State

- Branch `phase/04a-social-alpha-foundation` was deployed from and pushed through `fa17c24 docs: record Signal Bloom identity`; production health, favicon, SVG, and browser checks passed.

## Next 3 Tasks

1. Complete the live Nimiq Pay physical-device identity check.
2. Submit the SVG with the Pods Mini App catalog entry using the required developer-prefixed filename.
3. Run the separate-worker Railway gate before enabling the capped Testnet dogfood cohort.
