---
created: 2026-07-21
project: pods
ecosystem: nimiq
tags: [spec, social-alpha, profiles, messaging, testnet]
---

# Pods Social Alpha Amendment

Related: [[HANDOFF]] | [[docs/implementation-plan]] | [[docs/superpowers/plans/2026-07-21-phase-4-social-alpha]]

This approved amendment extends the Cycle I MVP after Phase 4. Where it conflicts
with the outer product specification, this amendment governs the social-alpha
surfaces only. Existing financial, evidence-authority, custody, and timing rules
remain unchanged.

## Purpose

Phase 4 is extended into a deployable Nimiq Testnet social alpha before review
exceptions and proportional settlement are implemented. The alpha is both a
community preview and the Build Pods workspace used to dogfood later phases.

The alpha must never imply production readiness or real-value settlement.

## Identity and navigation

- One Nimiq wallet owns one Pods profile.
- Profile onboarding is mandatory after the first successful wallet session.
- Handles are unique after lowercase normalization and never expose wallet data.
- Bottom navigation is Today, Discover, My Pods, and Messages.
- The profile avatar opens the private account surface.
- The header notification control opens `/updates`; `/inbox` redirects there.
- Discover contains Pods, People, and Following.
- Messages contains Pod Rooms, People, and Requests.

## Social relationships

- Follow is one-way and available only for opted-in public profiles.
- Friendship is mutual and requires acceptance.
- Friends may open DMs and receive targeted private-Pod invitations.
- Friendship never bypasses application, funding, cutoff, or roster locking.
- Blocking removes social interaction but never changes Pod or financial state.

## Pod rooms and authority

- Room access is limited to the creator and roster-locked members.
- Room entries are ordinary messages, activity cards, creator announcements,
  Pods system events, or visible moderation tombstones.
- Creators may pin announcements and hide ordinary chat.
- Creators cannot hide activity, review, settlement, or financial records.
- Chat, reactions, and replies never alter verification or money state.

## Evidence privacy

Proof uses two layers. Pod members see the locked commitment, result summary,
public artifact, status, and attachments explicitly shared with the Pod. The
submission owner and Pods reviewers retain exclusive access to reviewer evidence,
clarification, disputes, deadlines, and individual financial consequences.

Existing evidence stays private. No migration broadens prior access.

## Testnet alpha funding contract

The first Build Pods cohort uses a new immutable `full_refund_alpha` contract:

- Network is Nimiq Testnet.
- Testnet NIM has no real-world value.
- Proportional redistribution is not active.
- Every accepted commitment is returned in full through an idempotent worker path.
- The mode is disclosed before wallet confirmation and throughout the Pod.
- The contract cannot be converted into proportional settlement after publication.
- Deposit attribution, finality, participant-ledger credit, and refunds remain
  server-authoritative.

Public proportional funding remains disabled until review exceptions, settlement,
payout reconciliation, and physical two-wallet payout tests pass.

## Release rule

Each Phase 4 subrelease must pass automated gates, a local Nimiq Pay phone check,
an alpha deployment, and a remote Nimiq Pay phone check before the next subrelease.
Unfinished routes remain unavailable server-side and absent from navigation.
