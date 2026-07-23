---
created: 2026-07-24
project: pods
ecosystem: nimiq
tags: [design, settlement, payouts, treasury, testnet, creator-review]
---

# Pods Testnet Settlement Amendment

Related: [[HANDOFF]] |
[[docs/superpowers/specs/2026-07-23-pods-creator-review-mvp-design]]

## 1. Purpose and authority

This amendment adds reward settlement and Testnet NIM payouts after the
creator-review Phase 4 boundary. It does not change any already published
`full_refund_alpha` contract.

The product owner explicitly expanded the implementation scope on 24 July 2026
to include complete treasury settlement and payout behavior after the approved
Phase 4 baseline.

This is a Testnet product contract. It is not approved for Mainnet custody.

## 2. Trust model

For newly published proportional Pods:

- The Pod creator is the sole proof verifier.
- The creator cannot join, fund, submit proof, or receive any participant
  return, bonus, forfeiture, or payout.
- Creator decisions can change how member stakes are redistributed.
- There is no clarification, appeal, dispute, peer vote, or second reviewer.
- Review inactivity becomes `timeout_protected`, so principal is protected and
  no bonus is earned.
- Missing evidence becomes `missed`.

The outcome vocabulary is exactly:

```text
approved | rejected | timeout_protected | missed
```

The older master-spec vocabulary for Pods-team review, grace, clarification,
and dispute is superseded for creator-reviewed proportional contracts.

## 3. Required pre-funding disclosure

The following disclosure appears before publication and again before the wallet
handoff:

> The Pod creator reviews member proofs. Approval and rejection can change how
> member stakes are redistributed. The creator does not fund this Pod or
> receive member funds. This Testnet MVP has no appeal or peer vote. Fund only
> if you trust the creator and accept these frozen rules.

The participant must actively accept the current contract hash after seeing
this disclosure. A prior acceptance cannot authorize a changed contract.

## 4. Settlement input boundary

Settlement derives members only from:

- a membership whose accepted contract hash equals the frozen Pod hash;
- membership state `active` or `roster_locked`;
- exactly one deposit intent in `applied_to_roster`;
- the exact finalized amount in the frozen contract;
- an existing `deposit_credit` ledger entry for that intent.

The repository hard-fails and routes the Pod to operations review if:

- the creator appears in the roster;
- a member, occurrence, finalized deposit, or outcome is duplicated, missing,
  or extra;
- a deposit amount differs from the frozen contract total;
- any occurrence remains open;
- any submission remains `reviewing`;
- the contract is not proportional;
- the Pod is not in `final_review`;
- aggregate arithmetic cannot be represented safely.

For every frozen occurrence and funded member:

- `approved`, `rejected`, and `timeout_protected` come from the immutable
  submission state;
- an absent or draft submission after occurrence close becomes `missed`;
- the source submission ID is snapshotted when one exists.

The run snapshots the contract hash, calculator version, deterministic input
digest, occurrence IDs and ordinals, source submission IDs, membership IDs, and
finalized deposit IDs.

## 5. Financial outcomes

All arithmetic uses integer Luna.

- Approved returns its own slice and is bonus eligible.
- Timeout protected returns its own slice and is not bonus eligible.
- Rejected and missed create a provisional forfeiture.
- The occurrence forfeiture pool is split equally across approved members.
- A one-Luna remainder is assigned by ascending membership UUID.
- If no approved member exists, the occurrence becomes
  `closed_no_bonus_recipient` and every provisional forfeiture returns to its
  original owner.

For every settled Pod:

```text
sum(member payout entitlements)
= sum(finalized deposits applied to the frozen roster)
```

The creator and platform receive zero participant principal.

## 6. Ledger boundary

Settlement records balanced liability reclassification under deterministic
idempotency keys:

1. Existing deposit credit:
   `treasury_asset:testnet -> participant_deposit_liability:<membership>`.
2. Per-occurrence allocation:
   `participant_deposit_liability:<membership> -> occurrence_liability:<occurrence>:<membership>`.
3. Protected or restored principal:
   `occurrence_liability:<occurrence>:<membership> -> payout_liability:<settlement>:<membership>`.
4. Forfeiture:
   `occurrence_liability:<occurrence>:<membership> -> bonus_pool_liability:<occurrence>`.
5. Bonus:
   `bonus_pool_liability:<occurrence> -> payout_liability:<settlement>:<membership>`.
6. Zero-recipient restoration:
   `bonus_pool_liability:<occurrence> -> payout_liability:<settlement>:<membership>`.
7. Confirmed payout:
   `payout_liability:<settlement>:<membership> -> treasury_asset:testnet`.

Broadcast is an operational transfer event, not a final ledger movement.

## 7. Settlement and transfer immutability

Database uniqueness enforces:

- one settlement run per Pod;
- one occurrence snapshot per run and occurrence;
- one outcome per run, occurrence, and membership;
- one entitlement per run and membership;
- deterministic ledger idempotency keys;
- deterministic payout-leg idempotency key
  `payout:<settlementRunId>:<membershipId>`.

The Pod row is locked before finalization. A repeated finalization returns the
existing immutable run.

Every funded member receives an entitlement. A zero-Luna entitlement becomes
terminal `no_transfer_required` and creates no transaction. A positive
entitlement creates one logical payout leg.

## 8. Transfer attempts

Each positive payout leg owns immutable attempts.

- Signed bytes, hash, validity start height, data reference, and preparation
  time are persisted before broadcast.
- The payout data reference is an opaque deterministic digest of the payout leg
  and attempt number. It prevents identical recipient and amount payouts from
  producing the same transaction hash.
- Unknown attempts are chain-checked and never blindly rebroadcast.
- An absent transaction becomes `late` only after a fresh lookup still finds
  nothing and the current height is more than 7,200 blocks beyond the validity
  start height. The conservative 7,200-block boundary is the current PoS
  integration limit used for this Testnet MVP.
- A replacement attempt can be created only after the prior attempt is
  terminal and independently proven absent or failed.
- A successful transaction is confirmed only after matching hash, recipient,
  amount, network, successful execution, and macro-block finality.

`unknown`, `retryable_failed`, `mismatched`, `late`, and `manual_review` are not
successful payout resolutions.

Operations cannot complete a positive entitlement with a checkbox. It requires
a confirmed worker attempt or an externally supplied transaction that is
independently verified against the exact frozen payout contract.

## 9. Completion

A settlement is `settled` only when:

- every positive entitlement has one independently confirmed transfer; and
- every zero entitlement is `no_transfer_required`.

Only then does the Pod become `completed`.

## 10. Mainnet boundary

Before Mainnet, Pods requires a separate trust, custody, dispute, verifier,
legal, and operational design. This amendment authorizes no Mainnet funds.
