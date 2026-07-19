---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [handoff, phase-0, build]
last-updated: 2026-07-19
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[AGENTS]] | [[docs/implementation-plan]]

## Current state

Standalone repository initialized on `phase/00-foundation`. The locked Phase 0
shell, monorepo, CI, Postgres, MinIO, copy policy, and outbound transfer worker
are implemented. Automated gates pass. The live Nimiq RPC check confirmed
`TestAlbatross`. Physical-device receipt remains the only Phase 0 blocker.

Current manual gate:

- LAN shell: `http://192.168.29.244:3411`
- Testnet treasury: `NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6`
- Treasury secret: git-ignored `.runtime/preflight/treasury.env`, mode `0600`
- Planned return transfer: `1000` Luna = `0.01` NIM

Latest evidence:

- `pnpm check`: PASS
- Postgres query and MinIO live endpoint: PASS
- Mobile Safari and Android Chromium browser smoke: 2 PASS
- U+2014 copy enforcement: PASS
- Worker transfer tests: 12 PASS
- LAN URL: HTTP 200

## Next 3 tasks

1. Abhinav opens the LAN shell in Nimiq Pay and confirms the visual result.
2. Abhinav funds the Testnet treasury and supplies the phone wallet address.
3. Codex sends once with simulated response loss, reconciles by hash, records
   physical receipt, and stops for Phase 0 approval.

## Blockers

- Physical-device visual confirmation requires Abhinav.
- Treasury funding and the recipient NQ address require Abhinav.
