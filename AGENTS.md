---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [agents, implementation, contracts]
---

# Pods Agent Contract

Related: [[README]] | [[docs/implementation-plan]] | [[HANDOFF]]

## Source of truth

The approved outer-vault product specification remains normative until an
explicitly approved amendment exists. Implementation must not silently change
financial, privacy, authority, or state-machine rules.

## Required workflow

- Work on the active phase branch.
- Write tests before production behavior.
- Do not begin the next phase before device approval.
- Use real Nimiq Testnet transactions for financial approval gates.
- Never credit a deposit from a client callback alone.
- Never place treasury secrets in the web service or repository.
- Never use direct database state edits to demonstrate a phone flow.
- Time advances only through the audited Clock command.
- Do not use U+2014 in user-facing text or public assets.

## Stack

- Next.js and TypeScript
- Postgres and Drizzle
- Separate Node.js worker
- MinIO locally and S3-compatible storage remotely
- Nimiq Mini App SDK and Nimiq core
