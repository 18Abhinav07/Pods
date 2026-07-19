---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [implementation-plan, phase-0, validation]
status: approved
---

# Phase 0 Implementation Plan

Related: [[../README|Pods README]] | [[../validation/inbound-spike-manifest|Inbound spike manifest]] | [[design-reference/README|Design reference]]

## Goal

Create the isolated public repository, permanent application structure, locked
visual shell, local service composition, CI gates, and an empirically validated
outbound Testnet transfer primitive.

## Tasks

1. Preserve the design references and canonical-source hashes.
2. Scaffold the web, worker, domain, database, and UI workspaces.
3. Add tests for copy enforcement and locked design tokens before implementation.
4. Add tests for prepare, persist, broadcast, and reconcile-before-retry behavior.
5. Implement the minimal application and transfer preflight to pass those tests.
6. Run lint, typecheck, unit, integration, build, and LAN smoke checks.
7. Receive one exact worker-originated Testnet transfer on a physical device.
8. Record PASS or FAIL and stop for approval.

## Non-goals

- Wallet authentication
- Pod creation
- Participant deposits
- Production treasury custody
- Mainnet use
