---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, economics, treasury, custody, settlement, nimiq, planning]
---

# 11: Economic Modes, Treasury, and Settlement

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/01-person-account-and-identity|Identity contract]] |
[[docs/mainnet-planning/06-commands-domain-facts-and-audit|Command contract]] |
[[docs/mainnet-planning/09-pod-occurrence-and-commitment-lifecycles|Pod lifecycle]] |
[[docs/mainnet-planning/10-proof-verification-and-review|Proof contract]] |
[[HANDOFF]] | [[README]]

## Purpose

Define provider-neutral economic contracts while treating NIM and future USDT
support as settlement adapters. No social, proof, or lifecycle code owns
wallet-specific logic.

## Economic Modes

Every Event or Pod selects exactly one frozen mode:

1. **Non-financial:** accountability, proof, activity, and reputation without
   deposits or rewards.
2. **Participant-funded commitment:** each participant prefunds disclosed
   occurrence slices; protected principal returns and eligible forfeiture is
   redistributed by policy.
3. **Sponsor-funded reward:** an eligible sponsor prefunds a reward pool;
   participant principal is never required.
4. **Hybrid:** participant commitment and sponsor reward are independent pools
   with separately disclosed outcome and return rules.

Mixed assets inside one contract are prohibited. An Event may host separate
Pods with different single-asset contracts.

## Treasury Modes

1. **No-custody:** non-financial activity or externally settled rewards where
   Pods records no enforceable money promise.
2. **Pods-managed safeguarded pool:** funds are pushed into a designated
   adapter-controlled treasury, attributed through unique references, and
   represented by a segregated append-only subledger.
3. **External escrow adapter:** a future provider may hold and settle funds
   under an independently validated enforceable contract.

An organizer-controlled wallet is not represented as trustless escrow and is
not an initial Mainnet funded mode. Pods-managed Mainnet custody cannot launch
until Document 23's legal, security, signer, limit, reconciliation, and
incident gates pass.

## Asset and Adapter Contract

An Asset identifies network, canonical asset, base-unit precision, finality
policy, fee policy, and adapter version.

A SettlementAdapter must provide validated operations for:

- address or account validation;
- participant-authorized deposit initiation;
- independent observation and finality classification;
- reference and amount reconciliation;
- outbound transfer preparation, signing, broadcast, lookup, and finality;
- deterministic idempotency and unknown-transaction recovery.

NIM is the first intended Mainnet adapter. USDT requires a separately validated
network, token contract, wallet, fee, and custody design. Neither is embedded
in canonical Person, Pod, proof, or settlement math.

## Participant-Funded Math

For each ParticipantOccurrence:

- `approved`: principal protected and bonus eligible;
- `timeout_protected`: principal protected, not bonus eligible;
- `grace`: principal protected, excluded from success and streak
  denominators, and not bonus eligible;
- `rejected` or `missed`: the occurrence slice is provisionally forfeited;
- `cancelled`: the applicable slice returns.

The occurrence bonus pool is the sum of eligible forfeited slices.

- If at least one approved participant exists, distribute the pool using the
  frozen weighting rule.
- If no approved participant exists, restore each provisional forfeiture to
  its original owner.
- Default weighting is equal per approved participant for the occurrence.
- Any remainder in integer base units uses deterministic largest remainder,
  then frozen roster position and canonical ID as tie-breakers.
- The creator, reviewer, organizer, platform, and treasury never become an
  implicit recipient.

## Sponsor-Funded Math

A sponsor contract freezes:

- total funded pool and funding deadline;
- eligible entries, occurrences, milestones, or final awards;
- distribution policy: fixed award, equal eligible completion, published
  weighted achievement, or ranked award;
- who decides any subjective rank and their conflicts;
- unused-fund destination;
- cancellation and partial-completion behavior.

Sponsor funds never become participant principal. Unallocated sponsor value
returns to the sponsor unless another eligible destination was explicitly
accepted. Ranking, judging, or voting cannot be invented at settlement time.

Default occurrence treatment:

| Outcome | Participant principal | Participant-funded bonus | Sponsor reward |
|---|---|---|---|
| `approved` | protected | eligible | eligible |
| `timeout_protected` | protected | not eligible | not eligible |
| `grace` | protected | not eligible | not eligible |
| `rejected` | provisionally forfeited | not eligible | not eligible |
| `missed` | provisionally forfeited | not eligible | not eligible |
| `cancelled` | returned | not eligible | not eligible |

In sponsor-only mode there is no participant principal or participant-funded
bonus column. Sponsor value not assigned to an approved eligible outcome
returns to the frozen sponsor return destination unless the contract names
another legally validated treatment. Timeout protection and grace never become
an organizer-selected reward after the fact.

The table is the default only for an occurrence-based sponsor contract. A
milestone, final-award, or ranked sponsor contract consumes its own terminal
milestone and judging decisions. It never infers award eligibility from a
ParticipantOccurrence unless the frozen sponsor policy explicitly names that
occurrence as an input.

## Hybrid Math

Participant principal and sponsor reward use separate subledgers and
entitlements. A participant may receive protected principal without receiving
a sponsor reward. Sponsor reward failure never converts protected participant
principal into sponsor funds.

Hybrid applies the same outcome row independently to each pool. A
participant-funded forfeiture cannot increase the sponsor pool, and unused
sponsor funds cannot reimburse or seize participant principal.

## Settlement Accounts and Funding Sources

`SettlementAccountConnection` privately binds one Person or eligible
collective to one adapter account after provider-specific control validation.
It is not canonical identity.

Every credited deposit records an immutable `FundingSourceSnapshot`:

- adapter, network, asset, source account, and control basis;
- exact Person, sponsor, or collective liability owner;
- transaction identity, amount, reference, and finality;
- contract and deposit intent.

Every entitlement records a `PayoutDestinationSnapshot` before transfer
preparation. Refunds return to the validated original funding source by
default. Sponsor unused funds return to the frozen sponsor return destination.

A destination change requires recent authentication, control validation,
eligibility and sanctions policy, named audit fact, and a new snapshot. It
cannot silently mutate an already prepared or broadcast transfer. Collective
destinations require a valid representative grant.

## Deposit Lifecycle

`intent_created -> wallet_approval_pending -> submitted -> observed
-> finalized -> credited -> allocated -> closed`

Branches and closure:

| State | Ownership | Next valid outcomes |
|---|---|---|
| `expired` | terminal, no observed funds | new intent only |
| `rejected` | terminal, no credit | corrected new intent or operator explanation |
| `exception_review` | operator-owned transient | `rejected`, `credited`, or refund path |
| `excluded_at_cutoff` | refund owed | `refund_queued` |
| `refund_queued` | worker-owned | `refund_prepared`, `manual_review` |
| `refund_prepared` | worker-owned | `refund_submitted`, `unknown`, `retryable_failed` |
| `refund_submitted` | adapter-owned transient | `refund_confirmed`, `unknown`, `late`, `mismatched` |
| `refund_confirmed` | terminal | compensating process only |

Wallet callbacks are advisory. Only independent adapter observation,
recipient, asset, amount, reference, source, finality, capacity, and cutoff
validation can credit value.

## Settlement and Transfer Lifecycle

`snapshot_pending -> calculated -> conservation_verified
-> entitlements_created -> transfers_executing -> completed`

Transfer legs:

`queued -> prepared -> submitted -> confirming -> confirmed`

Exception states:

`unknown`, `retryable_failed`, `mismatched`, `late`, `manual_review`, and
`no_transfer_required`.

| Transfer state | Meaning | Closure |
|---|---|---|
| `unknown` | broadcast result or chain presence is ambiguous | read-only reconciliation; retry only after proved absence |
| `retryable_failed` | no external effect was created and policy permits retry | return to `prepared` with same entitlement and new bounded attempt |
| `mismatched` | observed effect conflicts with prepared identity, asset, amount, or recipient | `manual_review` and incident |
| `late` | expected finality or confirmation target passed | reconcile to `confirmed`, `unknown`, or `manual_review` |
| `manual_review` | named operator must resolve evidence | confirmed, proved-absent retry, or approved alternate closure |
| `no_transfer_required` | zero value or valid same-owner internal closure | terminal with reason and audit |

Positive entitlements require confirmed transfer or an approved legally valid
alternate closure before completion. Unknown transactions are reconciled
before retry. A repeated worker cycle cannot create a second entitlement,
transfer leg, or blind rebroadcast.

Refund legs follow the same confirmed-transfer-or-valid-alternate-closure rule
as payout legs.

## Settlement Snapshot Barriers

### ParticipantCommitmentSettlement

Participant-funded settlement may begin only when:

- every rostered ParticipantOccurrence in scope is terminal;
- every occurrence clarification and dispute window is closed or resolved;
- every participant-contract cancellation treatment is final;
- every participant deposit is allocated or refund bound;
- the participant contract, roster, outcome set, deposit set, and ledger
  cursors are fixed.

The snapshot stores an immutable hash and version of that complete input set.
It produces only principal return, provisional forfeiture restoration,
participant-funded bonus, explicit fee, refund, and related transfer
entitlements.

### SponsorAwardSettlement

Sponsor-funded settlement may begin only when:

- every eligible EventEntry and award candidate has a terminal inclusion,
  withdrawal, exclusion, disqualification, completion, or cancellation state;
- every milestone and MilestoneSubmission used by the award policy is terminal,
  including clarification, dispute, timeout, and grace handling;
- every required judge assignment, score, ranking, tie, conflict, and fallback
  decision is terminal under the frozen judging policy;
- partial Event cancellation and unused-fund treatment are final;
- the complete sponsor liability is finalized and credited, or affected rewards
  were never activated;
- sponsor allocation, return destination, award policy, eligible set, decision
  set, and ledger cursors are fixed.

The sponsor snapshot stores its own immutable hash and version. It produces only
sponsor awards, unused-fund return, sponsor refund, explicit fee, and related
transfer entitlements.

### Hybrid coordination

Hybrid mode references one `ParticipantCommitmentSettlement` and one
`SponsorAwardSettlement`. Each calculates and conservation-verifies its own
entitlement set. A coordination record may wait for both and submit their
transfer legs through the same generic transfer engine, but it cannot combine
input snapshots, net pools, transfer ownership, or correction history.

Entitlement creation never mutates either snapshot.

A valid correction after entitlement creation produces, within the affected
settlement type:

- a compensating review fact;
- a new compensating settlement referencing the original;
- balanced ledger entries;
- new transfer or recovery legs.

The original outcome, snapshot, entitlement, and transaction history remain
visible and immutable.

## Accounting Invariants

1. All math uses integer asset base units.
2. Every credited unit maps to a participant, sponsor, fee, refund, entitlement,
   or approved retained liability.
3. Assets, contracts, and ledgers never net against one another.
4. Participant settlement is an immutable snapshot of terminal
   ParticipantOccurrence inputs, and sponsor settlement is a separate immutable
   snapshot of terminal award inputs.
5. Protected principal never enters a reward or bonus pool.
6. Ledger entries are append-only and balanced.
7. Fees are explicit and cannot reduce a promised entitlement silently.
8. Refund authority remains available during deposit, payout, social, or
   product suspension.
9. Youth accounts cannot enter these financial modes initially.
10. Account deletion, blocking, removal, or archival cannot erase an
    obligation.

## Commands and Facts

Economic-contract commands include `ConfigureEconomicContract`,
`FreezeEconomicContract`, `FundSponsorLiability`,
`ValidateSponsorCoverage`, and `CancelUnactivatedEconomicContract`.

Deposit commands include `CreateDepositIntent`,
`MarkDepositWalletApprovalPending`, `RecordDepositSubmitted`,
`ObserveDeposit`, `FinalizeDepositObservation`, `CreditDeposit`,
`AllocateDeposit`, `CloseDeposit`, `ExpireDepositIntent`,
`RejectDeposit`, `BeginDepositExceptionReview`,
`ResolveDepositException`, `ExcludeDepositAtCutoff`, `QueueDepositRefund`,
`PrepareDepositRefund`, `RecordDepositRefundSubmitted`, and
`ConfirmDepositRefund`.

Typed settlement commands include
`CreateParticipantCommitmentSettlementSnapshot`,
`CalculateParticipantCommitmentSettlement`,
`VerifyParticipantCommitmentConservation`,
`CreateSponsorAwardSettlementSnapshot`, `CalculateSponsorAwardSettlement`,
`VerifySponsorAwardConservation`, `CreateSettlementEntitlements`,
`BeginSettlementTransfers`, and `CompleteSettlement`. The settlement type and
snapshot identity are mandatory command fields. Hybrid coordination may use
`CoordinateHybridSettlements` but cannot calculate or net either lane.

Transfer commands include `QueueTransfer`, `PrepareTransfer`,
`RecordTransferSubmitted`, `ConfirmTransfer`, `MarkTransferUnknown`,
`MarkTransferRetryableFailed`, `MarkTransferMismatched`,
`MarkTransferLate`, `MoveTransferToManualReview`,
`CloseTransferWithoutTransfer`, `AuthorizeTransferRetry`, and
`ResolveTransferException`.

Post-entitlement correction uses `CreateCompensatingSettlement` with the exact
original settlement, decision, entitlement, ledger, and transfer references.

Each accepted command records corresponding typed facts and balanced ledger
entries where value changes classification. Adapter callbacks and chain
observations remain external observations until one of these commands
validates and accepts them. No projection, wallet callback, or worker retry
advances financial state directly.

## Product Flow

- Before wallet handoff, the user sees asset, network, amount, custody,
  reviewer, outcomes, fees, cutoff, capacity, refunds, and destination rules.
- Funding uses a resumable stage rail with detail behind disclosure, not one
  overloaded screen.
- The same state appears across application, Today, workspace, updates, and
  settlement projections.
- Final settlement separates principal, reward, forfeiture, restoration, fee,
  and transfer status.
- Hybrid presentation shows participant and sponsor settlement lanes
  independently even when one remains blocked.
- Sponsor dashboards show aggregate permitted use and conservation without
  exposing private proof.

## Operations and Failure Boundaries

- Deposits and outbound transfers have independent pause controls.
- Refund and reconciliation paths remain available during payout pause.
- Signers never run in public web processes.
- Mainnet signing requires managed key custody, policy limits, and auditable
  authorization. Environment-variable hot keys are Testnet-only.
- Chain or provider outage produces pending or unknown, never fabricated
  failure or success.
- Treasury shortage, conservation mismatch, or unknown transfer blocks new
  discretionary payouts and raises highest-priority operations attention.
- No contract launches without funded liability coverage.

## Interdependencies

Consumes Documents 01 through 10. Documents 12, 15, 17, and 18 present
financial status. Documents 22 and 23 implement ledgers, workers, signers,
limits, and compliance. Document 25 isolates environments and treasuries.
Document 27 owns adapter and custody validation gates.

## Review Findings

- Testnet proportional settlement maps cleanly into participant-funded mode.
- Sponsor-funded mode solves organizer incentives without pretending it is the
  same pool.
- Hybrid mode preserves independent ownership and accounting.
- NIM and USDT remain adapters, so future rails do not fragment identity or
  activity.
- Mainnet custody remains deliberately blocked pending validation.

## Closure Condition

Lock only after property tests prove conservation and idempotency for every
mode, NIM and any USDT adapter pass independent finality and recovery spikes,
and Document 23 approves the exact Mainnet custody and financial-eligibility
boundary.
