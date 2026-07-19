---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [implementation-plan, phase-3, funding, reconciliation, roster-lock]
status: active
---

# Phase 3 Funding and Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a phone-testable NIM funding lifecycle that creates an exact deposit intent, obtains a user-approved Nimiq Pay transaction, independently observes and finalizes it, credits an append-only ledger, applies a deterministic enrollment cutoff, and either locks the member into the roster or returns their principal.

**Architecture:** The web service owns authenticated intent creation and participant-safe reads but cannot credit money. The Mini App sends the exact intent through `sendBasicTransactionWithData` and reports the returned hash only as a hint. A separate worker scans the configured treasury through Nimiq RPC, validates recipient, value, opaque reference, network, execution, uniqueness, chain position, and macro-batch finality, then commits credit and ledger movements in Postgres. The cutoff barrier is one serialized database transaction. Refund transfers reuse the already-tested prepare, persist, broadcast, and reconcile-before-retry primitive.

**Tech Stack:** Next.js 16, TypeScript 5.9, Postgres 17, Drizzle ORM, Node.js worker, `@nimiq/mini-app-sdk@0.1.0`, `@nimiq/core@2.7.1`, Vitest, Playwright.

Related: [[HANDOFF]] | [[AGENTS]] | [[validation/phase-2-results]] | [[10-Projects/Web3-Builds/Hackathons/Pods/validation/spike-results|Validated deposit-attribution spike]]

---

## Locked boundaries

- Testnet only for Phase 3 approval.
- NIM only, with every amount stored and calculated as integer Luna.
- Enrollment cutoff is the first frozen occurrence's `opensAt` instant. Phase 2 already uses this instant to close discovery, applications, and invitations.
- The connected membership wallet is the eventual refund and payout destination. The observed transaction source is audit metadata because Nimiq Pay may fund through an HTLC.
- A client hash is a lookup hint. Only the chain watcher can reach `finalized` and `credited_provisional`.
- One transaction hash credits at most one intent, one reference resolves to at most one transaction, and one membership receives at most one applied full deposit.
- Every participant-principal movement is an append-only debit-account to credit-account ledger row with a positive Luna amount and a unique idempotency key.
- Creator cancellation with credited deposits queues full refunds atomically. It never marks the Pod cancelled before every transfer leg resolves.
- No direct database timestamp edits are allowed for acceptance demonstrations. Time moves only through the audited local Clock command introduced in Task 9.
- Treasury private-key material remains worker-only in `.runtime/preflight/treasury.env` locally and a Railway secret remotely.

## Delivery checkpoints

### Checkpoint 3A: real deposit and credit

```text
accepted member
-> review complete commitment and disclosures
-> create opaque intent
-> approve exact NIM transaction in Nimiq Pay
-> persist returned hash as a hint
-> watcher observes transaction
-> watcher crosses macro-batch finality
-> watcher credits provisional membership and ledger
-> status survives WebView close and refresh
```

Stop for Abhinav's phone approval after Task 8. Do not implement cutoff or refunds until 3A passes on the physical Nimiq Pay Testnet wallet.

### Checkpoint 3B: cutoff, roster, and refunds

```text
audited Clock reaches cutoff
-> one serialized cutoff transaction closes entry
-> finalized deposits ordered by chain position then hash
-> included members become roster_locked
-> under-minimum Pod becomes cancelled_refunding
-> excluded or cancelled deposits receive refund legs
-> worker prepares, broadcasts, and reconciles each refund
-> status rail reaches roster locked or refunded
```

Stop for a second phone approval after Task 14. Phase 4 cannot begin before 3B passes.

## File map

### Domain

- `packages/domain/src/funding.ts`: deposit, ledger, transfer, cutoff states and transition helpers.
- `packages/domain/tests/funding.test.ts`: state-transition, integer-Luna, and deterministic-order tests.
- `packages/domain/src/enrollment.ts`: extend membership states without changing application decision semantics.
- `packages/domain/src/index.ts`: export the funding contract and extend Pod lifecycle states.

### Database

- `packages/db/src/schema.ts`: deposit intents, ledger entries, transfer legs, clock events, and membership funding fields.
- `packages/db/src/funding-repository.ts`: intent creation, client hint persistence, watcher observation/finality/credit, and participant-safe reads.
- `packages/db/src/cutoff-repository.ts`: serialized cutoff barrier and refund-leg creation.
- `packages/db/src/repository.ts`: compose funding and cutoff methods into `PodsRepository`.
- `packages/db/migrations/0002_*.sql`: generated Phase 3 migration.
- `packages/db/tests/phase3-funding.integration.test.ts`: live Postgres idempotency, ledger, cutoff, and cancellation tests.

### Web

- `apps/web/src/lib/funding-client.ts`: intent, wallet-attempt, transaction-hint, and status requests.
- `apps/web/src/lib/nimiq-wallet-client.ts`: exact data-bearing NIM payment adapter.
- `apps/web/src/components/funding-commitment.tsx`: disclosures, outcome table, consent, and one Commit NIM action.
- `apps/web/src/components/funding-status-rail.tsx`: persistent financial state rail and exception branches.
- `apps/web/src/app/api/pods/[podId]/deposit-intents/route.ts`: create or resume an exact owner-bound intent.
- `apps/web/src/app/api/deposit-intents/[intentId]/wallet-attempt/route.ts`: record approval-pending or wallet-rejected only.
- `apps/web/src/app/api/deposit-intents/[intentId]/transaction-hint/route.ts`: persist returned transaction hash without crediting.
- `apps/web/src/app/api/deposit-intents/[intentId]/route.ts`: participant-safe status read.
- `apps/web/src/app/pods/[podId]/fund/page.tsx`: replace the Phase 2 boundary with the funding commitment.
- `apps/web/src/app/pods/[podId]/fund/status/page.tsx`: refresh-safe status route.
- `apps/web/src/app/pods/[podId]/today/page.tsx`: Phase 3 waiting room after provisional funding.
- `apps/web/src/app/pods/[podId]/admin/funding/page.tsx`: participant-safe funding overview for creators.
- `apps/web/src/app/globals.css`: locked funding rail, outcome table, and exception treatments.
- `apps/web/tests/funding-client.test.ts`, `funding-commitment.test.tsx`, and `funding-status-rail.test.tsx`: component and request contracts.
- `apps/web/tests/e2e/phase3-funding.spec.ts`: mobile 3A and 3B journeys with exact-user teardown.

### Worker

- `apps/worker/src/funding/nimiq-deposit-rpc.ts`: address scan, transaction lookup, network, block, and macro-batch finality reads.
- `apps/worker/src/funding/deposit-reconciler.ts`: strict intent-to-chain validation and exception classification.
- `apps/worker/src/funding/run-deposit-cycle.ts`: one idempotent polling cycle.
- `apps/worker/src/funding/run-cutoff-cycle.ts`: due-cutoff processing and refund queueing.
- `apps/worker/src/funding/refund-service.ts`: DB-backed transfer preparation, broadcast, and reconcile-before-retry.
- `apps/worker/src/clock/command.ts`: local/testnet-only audited Clock command.
- `apps/worker/src/index.ts`: bounded polling loop with graceful shutdown.
- `apps/worker/tests/deposit-reconciler.test.ts`, `run-deposit-cycle.test.ts`, `run-cutoff-cycle.test.ts`, and `refund-service.test.ts`: chain and money negative paths.

## Task 1: Freeze the Phase 3 domain contract

**Files:**
- Create: `packages/domain/src/funding.ts`
- Create: `packages/domain/tests/funding.test.ts`
- Modify: `packages/domain/src/enrollment.ts`
- Modify: `packages/domain/src/index.ts`

- [ ] **Step 1: Write failing transition and ordering tests**

```ts
import { describe, expect, it } from "vitest";
import {
  canApplyDepositEvent,
  compareFinalizedDeposits,
  requiredDepositLuna,
  type FinalizedDepositOrder
} from "../src/funding";

describe("Phase 3 funding contract", () => {
  it("allows only watcher-owned credit transitions", () => {
    expect(canApplyDepositEvent("transaction_submitted", "observe", "worker")).toBe(true);
    expect(canApplyDepositEvent("finalized", "credit", "client")).toBe(false);
    expect(canApplyDepositEvent("finalized", "credit", "worker")).toBe(true);
  });

  it("computes the exact upfront amount in integer Luna", () => {
    expect(requiredDepositLuna(5, 10_000)).toBe(50_000);
    expect(() => requiredDepositLuna(0, 10_000)).toThrow();
  });

  it("orders capacity by finalized chain position then transaction hash", () => {
    const deposits: FinalizedDepositOrder[] = [
      { blockNumber: 20, transactionIndex: 2, transactionHash: "bb" },
      { blockNumber: 20, transactionIndex: 2, transactionHash: "aa" },
      { blockNumber: 19, transactionIndex: 7, transactionHash: "cc" }
    ];
    expect([...deposits].sort(compareFinalizedDeposits).map((item) => item.transactionHash))
      .toEqual(["cc", "aa", "bb"]);
  });
});
```

- [ ] **Step 2: Run the domain test and verify RED**

Run: `pnpm --filter @pods/domain exec vitest run tests/funding.test.ts`

Expected: FAIL because `src/funding.ts` does not exist.

- [ ] **Step 3: Implement the explicit state contract**

```ts
export type DepositState =
  | "intent_created"
  | "wallet_approval_pending"
  | "wallet_rejected"
  | "transaction_submitted"
  | "observed"
  | "finalized"
  | "credited_provisional"
  | "applied_to_roster"
  | "exception_review"
  | "refund_pending"
  | "refunded";

export type DepositActor = "client" | "worker";
export type DepositEvent = "open_wallet" | "wallet_reject" | "submit_hint" | "observe" | "finalize" | "credit";

export function requiredDepositLuna(occurrences: number, lunaPerOccurrence: number) {
  const amount = occurrences * lunaPerOccurrence;
  if (!Number.isSafeInteger(amount) || occurrences <= 0 || lunaPerOccurrence <= 0) {
    throw new Error("Required deposit must be a positive safe integer Luna amount");
  }
  return amount;
}
```

Add the complete transition table in the same file. Only `open_wallet`, `wallet_reject`, and `submit_hint` accept `client`; `observe`, `finalize`, and `credit` require `worker`.

Extend `MembershipState` with `deposit_pending`, `funding_failed`, `funded_provisional`, `roster_locked`, `excluded_at_cutoff`, `refund_pending`, and `refunded`. Extend `PodState` with `cutoff_evaluating`, `locked_scheduled`, `cancelled_refunding`, and `cancelled`.

- [ ] **Step 4: Run domain tests and verify GREEN**

Run: `pnpm --filter @pods/domain test`

Expected: all domain tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src packages/domain/tests/funding.test.ts
git commit -m "feat: define phase 3 funding states"
```

## Task 2: Add append-only funding persistence

**Files:**
- Modify: `packages/db/src/schema.ts`
- Create: `packages/db/src/funding-repository.ts`
- Modify: `packages/db/src/repository.ts`
- Create: `packages/db/tests/phase3-funding.integration.test.ts`
- Create: generated `packages/db/migrations/0002_*.sql`

- [ ] **Step 1: Write failing live-Postgres tests**

The tests create two accepted memberships and assert:

```ts
const intent = await repository.createDepositIntent({
  membershipId: membership.id,
  userId: member.userId,
  walletAddress: member.walletAddress,
  treasuryAddress: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
  network: "testnet",
  reference: "pods-00112233445566778899aabb",
  amountLuna: 50_000,
  now,
  expiresAt: cutoff
});

expect(intent.state).toBe("intent_created");
await expect(repository.createDepositIntent({ ...sameInput, reference: "different" }))
  .rejects.toThrow("Membership already has an open deposit intent");
```

The same suite must prove unique transaction hash, unique reference, one credited deposit per membership, balanced ledger movement, cross-user status denial, and client inability to call watcher methods.

- [ ] **Step 2: Run the integration test and verify RED**

Run: `pnpm exec vitest run --config vitest.integration.config.ts packages/db/tests/phase3-funding.integration.test.ts`

Expected: FAIL because funding tables and methods do not exist.

- [ ] **Step 3: Add the Drizzle schema**

Add:

```ts
export const depositIntents = pgTable("deposit_intents", {
  id: uuid("id").primaryKey(),
  membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  walletAddress: text("wallet_address").notNull(),
  treasuryAddress: text("treasury_address").notNull(),
  network: text("network").notNull(),
  reference: text("reference").notNull(),
  amountLuna: bigint("amount_luna", { mode: "number" }).notNull(),
  state: text("state").$type<DepositState>().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  transactionHash: text("transaction_hash"),
  observedFrom: text("observed_from"),
  observedFromType: integer("observed_from_type"),
  blockNumber: integer("block_number"),
  transactionIndex: integer("transaction_index"),
  transactionBatch: integer("transaction_batch"),
  observedAt: timestamp("observed_at", { withTimezone: true, mode: "date" }),
  finalizedAt: timestamp("finalized_at", { withTimezone: true, mode: "date" }),
  creditedAt: timestamp("credited_at", { withTimezone: true, mode: "date" }),
  exceptionCode: text("exception_code"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
}, (table) => [
  uniqueIndex("deposit_intents_reference_unique").on(table.reference),
  uniqueIndex("deposit_intents_transaction_hash_unique").on(table.transactionHash),
  index("deposit_intents_membership_state_idx").on(table.membershipId, table.state)
]);

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  podId: uuid("pod_id").notNull().references(() => pods.id, { onDelete: "cascade" }),
  membershipId: uuid("membership_id").references(() => memberships.id, { onDelete: "restrict" }),
  depositIntentId: uuid("deposit_intent_id").references(() => depositIntents.id, { onDelete: "restrict" }),
  movementType: text("movement_type").notNull(),
  debitAccount: text("debit_account").notNull(),
  creditAccount: text("credit_account").notNull(),
  amountLuna: bigint("amount_luna", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
});
```

Generate the migration with:

`pnpm --filter @pods/db db:generate`

- [ ] **Step 4: Implement transaction-scoped repository methods**

`createDepositIntent` must lock membership and Pod, require an accepted or retryable funding state, use the first occurrence opening as the intent expiry, snapshot exact contract `totalLuna`, and set membership to `deposit_pending`.

`recordWalletAttempt` and `recordTransactionHint` accept only the intent owner and never write observed/finalized/credited fields.

`recordObservedDeposit`, `finalizeDeposit`, and `creditFinalizedDeposit` are exported only by the worker-facing method group. `creditFinalizedDeposit` runs one transaction that locks intent and membership, inserts ledger idempotency key `deposit-credit:<intentId>`, changes intent to `credited_provisional`, and changes membership to `funded_provisional`.

- [ ] **Step 5: Run migration and integration tests**

Run:

```bash
pnpm --filter @pods/db db:migrate
pnpm exec vitest run --config vitest.integration.config.ts packages/db/tests/phase3-funding.integration.test.ts
```

Expected: migration applies once; Phase 3 integration tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/db
git commit -m "feat: persist deposit intents and credits"
```

## Task 3: Create guarded funding APIs

**Files:**
- Create: `apps/web/src/app/api/pods/[podId]/deposit-intents/route.ts`
- Create: `apps/web/src/app/api/deposit-intents/[intentId]/wallet-attempt/route.ts`
- Create: `apps/web/src/app/api/deposit-intents/[intentId]/transaction-hint/route.ts`
- Create: `apps/web/src/app/api/deposit-intents/[intentId]/route.ts`
- Create: `apps/web/src/lib/funding-client.ts`
- Create: `apps/web/tests/funding-client.test.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write failing request-contract tests**

```ts
expect(await createDepositIntent("pod-1", fetcher)).toEqual({
  id: "intent-1",
  state: "intent_created",
  recipient: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
  amountLuna: 50_000,
  reference: "pods-00112233445566778899aabb"
});

expect(fetcher).toHaveBeenCalledWith("/api/pods/pod-1/deposit-intents", {
  method: "POST",
  headers: { "content-type": "application/json" }
});
```

Also test wallet rejection, transaction-hint persistence, non-2xx copy, and malformed responses.

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm --filter @pods/web exec vitest run tests/funding-client.test.ts`

Expected: FAIL because `funding-client.ts` does not exist.

- [ ] **Step 3: Implement the client and routes**

The create route derives `userId` and wallet address from the HTTP-only session, derives membership and amount from Postgres, derives treasury address and network from server environment, and creates `pods-${randomBytes(12).toString("hex")}`. It accepts no user-supplied recipient, amount, reference, membership, network, or state.

The wallet-attempt route accepts only `{ event: "open" }` or `{ event: "rejected" }`. The hint route accepts only a 64-character lowercase transaction hash. The status route returns participant-safe state, timestamps, amount, reference, transaction hash, exception label, and roster outcome for the intent owner only.

Add to `.env.example`:

```text
PODS_TREASURY_ADDRESS=
PODS_TREASURY_PRIVATE_KEY_HEX=
PODS_DEPOSIT_POLL_INTERVAL_MS=5000
```

The web service reads only `PODS_TREASURY_ADDRESS`, `NIMIQ_NETWORK`, and `DATABASE_URL`.

- [ ] **Step 4: Run tests and typecheck**

Run:

```bash
pnpm --filter @pods/web exec vitest run tests/funding-client.test.ts
pnpm --filter @pods/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .env.example apps/web/src/app/api apps/web/src/lib/funding-client.ts apps/web/tests/funding-client.test.ts
git commit -m "feat: add guarded deposit intent APIs"
```

## Task 4: Add the Nimiq Pay commitment action

**Files:**
- Modify: `apps/web/src/lib/nimiq-wallet-client.ts`
- Modify: `apps/web/tests/nimiq-wallet-client.test.ts`
- Create: `apps/web/src/components/funding-commitment.tsx`
- Create: `apps/web/tests/funding-commitment.test.tsx`
- Modify: `apps/web/src/app/pods/[podId]/fund/page.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Write failing wallet and disclosure tests**

```ts
const result = await sendNimCommitment({
  recipient: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
  valueLuna: 50_000,
  reference: "pods-00112233445566778899aabb"
}, { getProvider: async () => provider });

expect(provider.sendBasicTransactionWithData).toHaveBeenCalledWith({
  recipient: "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A",
  value: 50_000,
  data: "pods-00112233445566778899aabb"
});
expect(result).toBe("a".repeat(64));
```

The component test must assert the two exact section 7.1 disclosures, occurrence count, per-occurrence amount, total upfront amount, maximum amount at risk, approved/timeout/grace/rejected/missed outcome rows, treasury custody disclosure, consent checkbox, and disabled Commit NIM action until consent.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
pnpm --filter @pods/web exec vitest run tests/nimiq-wallet-client.test.ts tests/funding-commitment.test.tsx
```

Expected: FAIL because the payment adapter and component do not exist.

- [ ] **Step 3: Implement the exact payment adapter**

```ts
interface FundingProviderLike {
  sendBasicTransactionWithData(input: {
    recipient: string;
    value: number;
    data: string;
  }): Promise<string | ProviderError>;
}

export async function sendNimCommitment(input: FundingPayment, dependencies?: FundingDependencies) {
  const provider = await (dependencies?.getProvider ?? (() => init({ timeout: 8_000 })))();
  const result = await provider.sendBasicTransactionWithData({
    recipient: input.recipient,
    value: input.valueLuna,
    data: input.reference
  });
  if (isProviderError(result)) throw new Error(result.error.message);
  if (!/^[a-f0-9]{64}$/.test(result)) throw new Error("Wallet returned an invalid transaction hash");
  return result;
}
```

The client component records `open` before invoking Nimiq Pay, records `rejected` if the provider returns an error, and records the returned hash as a hint before routing to `/pods/:podId/fund/status?intent=:intentId`. No client success branch changes membership or credits money.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
pnpm --filter @pods/web exec vitest run tests/nimiq-wallet-client.test.ts tests/funding-commitment.test.tsx
pnpm --filter @pods/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src apps/web/tests
git commit -m "feat: add Nimiq commitment action"
```

## Task 5: Build the participant funding-status rail

**Files:**
- Create: `apps/web/src/components/funding-status-rail.tsx`
- Create: `apps/web/tests/funding-status-rail.test.tsx`
- Create: `apps/web/src/app/pods/[podId]/fund/status/page.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Write failing state-rail tests**

Render every participant-facing state and assert its exact current marker and copy:

```ts
const states = [
  ["wallet_approval_pending", "Waiting on wallet confirmation"],
  ["transaction_submitted", "Transaction submitted"],
  ["observed", "Payment found on Testnet"],
  ["finalized", "Payment reached finality"],
  ["credited_provisional", "Commitment credited"],
  ["applied_to_roster", "Place secured"],
  ["refund_pending", "Refund queued"],
  ["exception_review", "Payment needs review"]
] as const;
```

Also assert `wallet_rejected`, transaction-never-observed, wrong network, reference mismatch, wrong amount/recipient, finalized-after-cutoff, capacity exclusion, and refresh-safe transaction hash presentation.

- [ ] **Step 2: Run component test and verify RED**

Run: `pnpm --filter @pods/web exec vitest run tests/funding-status-rail.test.tsx`

Expected: FAIL because the rail does not exist.

- [ ] **Step 3: Implement server-owned status rendering**

The page requires the session and intent owner. It renders status from Postgres on every request and provides a bounded client refresh every five seconds only while state is non-terminal. It must work with JavaScript refresh disabled by reloading the route manually.

Use the locked financial rail motion: 220ms stage transition, 700ms only for `applied_to_roster`, and immediate terminal-error rendering. Include `aria-live="polite"` for non-error progress and `role="alert"` for exceptions.

- [ ] **Step 4: Run component test and production build**

Run:

```bash
pnpm --filter @pods/web exec vitest run tests/funding-status-rail.test.tsx
pnpm --filter @pods/web build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src apps/web/tests/funding-status-rail.test.tsx
git commit -m "feat: add persistent funding status rail"
```

## Task 6: Implement independent chain observation

**Files:**
- Create: `apps/worker/src/funding/nimiq-deposit-rpc.ts`
- Create: `apps/worker/src/funding/deposit-reconciler.ts`
- Create: `apps/worker/tests/deposit-reconciler.test.ts`
- Modify: `apps/worker/package.json`

- [ ] **Step 1: Write failing RPC and reconciliation tests**

Fixtures must cover a valid HTLC-funded transaction and these negative paths: wrong recipient, wrong value, wrong network ID, missing reference, duplicate reference, execution false, same-batch not-final, later-batch final, and transaction hash already claimed by another intent.

```ts
expect(validateObservedDeposit(intent, transaction, chain)).toMatchObject({
  classification: "valid",
  source: { fromType: 2, directWalletMatch: false }
});
expect(validateObservedDeposit(intent, { ...transaction, value: 49_999 }, chain))
  .toEqual({ classification: "exception", code: "amount_mismatch" });
```

- [ ] **Step 2: Run worker test and verify RED**

Run: `pnpm --filter @pods/worker exec vitest run tests/deposit-reconciler.test.ts`

Expected: FAIL because the funding reconciler does not exist.

- [ ] **Step 3: Implement RPC shapes from the validated spike**

`NimiqDepositRpc` exposes:

```ts
interface DepositRpc {
  getTransactionsByAddress(address: string, limit: number): Promise<DepositTransaction[]>;
  getTransactionByHash(hash: string): Promise<DepositTransaction | undefined>;
  getBlockByNumber(blockNumber: number): Promise<{ number: number; batch: number; network: string }>;
  getLatestBlock(): Promise<{ number: number; batch: number; network: string }>;
}
```

Decode `recipientData` into the exact UTF-8 opaque reference. Store `from`, `fromType`, `relatedAddresses`, block, transaction index when present, and batch. Never require direct source equality with the membership wallet.

- [ ] **Step 4: Implement pure validation**

Validation returns one of:

```ts
type DepositClassification =
  | { classification: "valid_observed"; audit: DepositAudit }
  | { classification: "valid_finalized"; audit: DepositAudit }
  | { classification: "pending_finality"; audit: DepositAudit }
  | { classification: "exception"; code: DepositExceptionCode; audit: DepositAudit };
```

The validator has no database writes. It compares exact recipient, integer value, reference, network ID `5`, execution result, and later macro-batch finality.

- [ ] **Step 5: Run worker tests and verify GREEN**

Run: `pnpm --filter @pods/worker test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/worker
git commit -m "feat: validate Nimiq deposit transactions"
```

## Task 7: Connect the watcher to Postgres

**Files:**
- Add dependency: `apps/worker/package.json`
- Create: `apps/worker/src/funding/run-deposit-cycle.ts`
- Create: `apps/worker/tests/run-deposit-cycle.test.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] **Step 1: Write failing idempotent-cycle tests**

The test repository contains two open intents, the fake RPC returns one finalized transaction, and two consecutive cycles must produce exactly one credit:

```ts
await runDepositCycle(dependencies);
await runDepositCycle(dependencies);
expect(repository.creditFinalizedDeposit).toHaveBeenCalledTimes(1);
expect(repository.listOpenDepositIntents).toHaveBeenCalledTimes(2);
```

Also prove that an exception is recorded once and that an RPC failure leaves the intent retryable without state fabrication.

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm --filter @pods/worker exec vitest run tests/run-deposit-cycle.test.ts`

Expected: FAIL because the cycle runner does not exist.

- [ ] **Step 3: Implement one bounded cycle**

Add `@pods/db` and `pg` to worker dependencies. Each cycle:

1. Reads open intents from Postgres.
2. Scans recent treasury transactions once.
3. Matches by opaque reference, using the client hash only to prioritize lookup.
4. Records observation or one exception idempotently.
5. Rechecks observed transactions for macro-batch finality.
6. Calls `creditFinalizedDeposit` only after finality.

`apps/worker/src/index.ts` validates `NIMIQ_NETWORK=testnet`, `NIMIQ_RPC_URL`, `DATABASE_URL`, and worker-only treasury configuration, runs immediately, then at `PODS_DEPOSIT_POLL_INTERVAL_MS`, and handles `SIGINT` and `SIGTERM` without overlapping cycles.

- [ ] **Step 4: Run worker and integration tests**

Run:

```bash
pnpm --filter @pods/worker test
pnpm exec vitest run --config vitest.integration.config.ts packages/db/tests/phase3-funding.integration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/worker packages/db
git commit -m "feat: reconcile deposits in the worker"
```

## Task 8: Checkpoint 3A mobile journey

**Files:**
- Create: `apps/web/tests/e2e/phase3-funding.spec.ts`
- Create: `validation/phase-3a-results.md`
- Modify: `README.md`
- Modify: `HANDOFF.md`

- [ ] **Step 1: Add the deterministic browser contract**

The automated browser journey uses a fake injected provider only for UI behavior and asserts:

- Funding disclosures and outcome table appear before the action.
- Commit NIM is disabled before consent.
- Wallet rejection creates no credit.
- Successful provider return persists the hint and routes to status.
- Refresh preserves the same intent and submitted state.
- Direct status access by another wallet returns the generic unavailable surface.
- Test-generated users are deleted in `afterEach`.

- [ ] **Step 2: Run all automated gates**

Run:

```bash
pnpm check
env PLAYWRIGHT_BASE_URL=http://192.168.29.244:3411 pnpm --filter @pods/web exec playwright test tests/e2e/phase3-funding.spec.ts
```

Expected: every lint, type, unit, integration, build, Mobile Safari, and Android Chromium gate PASS.

- [ ] **Step 3: Run the real phone transaction**

Start both processes:

```bash
pnpm dev:lan
pnpm dev:worker
```

On Nimiq Pay Testnet, use an accepted membership to commit the exact displayed NIM amount. Verify wallet approval, transaction hash persistence, independent observation, macro-batch finality, provisional credit, refresh survival, and the absence of any manual database edits.

- [ ] **Step 4: Record PASS or exact blocker**

`validation/phase-3a-results.md` must record the intent ID, redacted reference, transaction hash, exact Luna amount, observation block/batch, finality batch, ledger idempotency key, and physical-device verdict. Do not record private keys.

- [ ] **Step 5: Commit and stop**

```bash
git add README.md HANDOFF.md validation/phase-3a-results.md apps/web/tests/e2e/phase3-funding.spec.ts
git commit -m "test: record phase 3a funding gate"
```

Stop for Abhinav's approval. Tasks 9 through 14 remain blocked until the physical 3A flow passes.

## Task 9: Add the audited local Clock

**Files:**
- Modify: `packages/db/src/schema.ts`
- Create: `packages/db/src/clock-repository.ts`
- Create: `apps/worker/src/clock/command.ts`
- Create: `apps/worker/tests/clock-command.test.ts`
- Modify: `apps/worker/package.json`
- Create: generated Phase 3 clock migration if Task 2 migration is already committed

- [ ] **Step 1: Write failing monotonic-clock tests**

Assert local/testnet-only operation, mandatory reason, monotonic advancement, immutable audit rows, and rejection on mainnet or backwards movement.

- [ ] **Step 2: Implement `clock_events` and effective time**

Each row stores `id`, `previous_time`, `effective_time`, `reason`, `actor`, and `created_at`. Production defaults to real time. The CLI may override time only when `APP_ENV=local` and `NIMIQ_NETWORK=testnet`.

- [ ] **Step 3: Add command**

```text
pnpm --filter @pods/worker clock:advance -- --to 2026-07-21T00:00:00.000Z --reason "Phase 3B phone cutoff test"
```

- [ ] **Step 4: Run tests and commit**

Expected: Clock tests and integration suite PASS.

## Task 10: Implement the serialized cutoff barrier

**Files:**
- Create: `packages/db/src/cutoff-repository.ts`
- Create: `packages/db/tests/phase3-cutoff.integration.test.ts`
- Modify: `packages/db/src/repository.ts`
- Create: `apps/worker/src/funding/run-cutoff-cycle.ts`
- Create: `apps/worker/tests/run-cutoff-cycle.test.ts`

- [ ] **Step 1: Write failing cutoff tests**

Test exact minimum, below minimum, over capacity, late finality, duplicate calls, and concurrent worker calls. The capacity case must order by block number, transaction index, then hash and produce one stable roster.

- [ ] **Step 2: Implement one transaction**

Lock the Pod, verify `enrollment_open`, transition to `cutoff_evaluating`, close active entry artifacts, snapshot credited deposits finalized before cutoff, order candidates, and then either:

- set included deposits `applied_to_roster`, memberships `roster_locked`, Pod `locked_scheduled`; or
- set Pod `cancelled_refunding`, memberships `refund_pending`, and create full refund legs.

Excluded capacity deposits become `refund_pending` and `excluded_at_cutoff`. Late or mismatched deposits remain in exception handling and never enter the roster.

- [ ] **Step 3: Prove serialization and idempotency**

Two simultaneous calls must produce one transition, one set of roster memberships, and one refund leg per excluded deposit.

- [ ] **Step 4: Run integration tests and commit**

Expected: cutoff and existing Phase 3 tests PASS.

## Task 11: Make creator cancellation financially safe

**Files:**
- Modify: `packages/db/src/enrollment-repository.ts`
- Modify: `apps/web/src/app/api/pods/[podId]/cancel/route.ts`
- Modify: `apps/web/tests/e2e/phase2-enrollment.spec.ts`
- Extend: `packages/db/tests/phase3-cutoff.integration.test.ts`

- [ ] **Step 1: Write failing credited-cancellation test**

Cancellation with no finalized deposits may still move directly to `cancelled`. Cancellation with credited deposits must atomically set `cancelled_refunding`, create one full-principal refund leg per credited deposit, and reject every new intent or application.

- [ ] **Step 2: Implement transactional cancellation**

Remove the current direct update. Lock Pod and credited deposits, create idempotent refunds, and transition according to financial exposure.

- [ ] **Step 3: Run Phase 2 and Phase 3 regressions and commit**

Expected: old no-funds cancellation remains green; credited cancellation uses refund tracking.

## Task 12: Execute and reconcile refund legs

**Files:**
- Modify: `packages/db/src/schema.ts`
- Create: `apps/worker/src/funding/refund-service.ts`
- Create: `apps/worker/tests/refund-service.test.ts`
- Modify: `apps/worker/src/index.ts`
- Extend: `packages/db/tests/phase3-cutoff.integration.test.ts`

- [ ] **Step 1: Write failing transfer tests**

Cover prepared-before-broadcast, hash persistence, confirmed finality, unknown result, retryable failure, no blind retry, exact membership-wallet recipient, operator-paid fee, and confirmed-refund ledger entry.

- [ ] **Step 2: Implement DB-backed transfer legs**

Each refund leg has immutable `idempotencyKey`, type `refund`, membership wallet recipient, positive Luna amount, prepared raw transaction/hash, state, attempt timestamps, and error code. The worker reuses the Phase 0 signer and RPC behavior but replaces the file repository with Postgres.

- [ ] **Step 3: Post ledger movement on confirmation**

Confirmation appends `refund-confirmed:<transferLegId>` from participant refund liability to treasury asset outflow, marks deposit `refunded`, membership `refunded`, and closes the Pod only after every leg is resolved.

- [ ] **Step 4: Run tests and commit**

Expected: transfer and conservation tests PASS.

## Task 13: Add waiting room and creator funding administration

**Files:**
- Create: `apps/web/src/app/pods/[podId]/today/page.tsx`
- Create: `apps/web/src/app/pods/[podId]/admin/funding/page.tsx`
- Modify: `apps/web/src/app/today/page.tsx`
- Modify: `apps/web/src/app/my-pods/page.tsx`
- Create: `apps/web/tests/phase3-waiting-room.test.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Write failing participant-safe screen tests**

The waiting room shows own funding and roster status, confirmed participant count, remaining capacity, exact cutoff, frozen schedule, first occurrence, verification explanation, and refund rail when applicable. Creator funding admin shows member handles and safe statuses only, never wallet addresses, raw references, treasury secrets, or ledger account codes.

- [ ] **Step 2: Implement guarded routes**

`/pods/:podId/today` permits funded provisional, roster locked, refunded, or the creator. `/admin/funding` requires the creator. Today priority remains one action only.

- [ ] **Step 3: Run component, privacy, and mobile tests and commit**

Expected: PASS.

## Task 14: Checkpoint 3B end-to-end gate

**Files:**
- Extend: `apps/web/tests/e2e/phase3-funding.spec.ts`
- Create: `validation/phase-3b-results.md`
- Modify: `README.md`
- Modify: `HANDOFF.md`

- [ ] **Step 1: Automate both cutoff outcomes**

Use the audited Clock command, never direct timestamps. Browser and integration coverage must prove:

- Minimum roster met and member reaches `roster_locked`.
- Over-capacity member is excluded by disclosed chain ordering and refunded.
- Below-minimum Pod becomes `cancelled_refunding` and every credited member is refunded.
- Refresh and WebView closure preserve every intermediate state.
- Unknown transfer broadcast is chain-checked before retry.

- [ ] **Step 2: Run the full gate**

Run:

```bash
pnpm check
env PLAYWRIGHT_BASE_URL=http://192.168.29.244:3411 pnpm --filter @pods/web exec playwright test tests/e2e/phase1-creation.spec.ts tests/e2e/phase2-enrollment.spec.ts tests/e2e/phase3-funding.spec.ts
```

Expected: all checks PASS and test-fixture count returns to zero.

- [ ] **Step 3: Run physical 3B flow**

Use funded Testnet wallets, advance only with the audited Clock command, inspect roster lock and one real refund, then verify the refund transaction hash in Nimiq Pay and through RPC.

- [ ] **Step 4: Record and commit**

Record exact, non-secret evidence in `validation/phase-3b-results.md`, commit, and stop for Abhinav's approval before Phase 4.

## Plan self-review

- Spec coverage: deposit intent, exact NIM payment, HTLC-aware observation, finality, credit, append-only ledger, cutoff serialization, capacity ordering, cancellation, refunds, status rails, waiting room, and creator-safe funding status each map to a task.
- Negative paths: wallet rejection, provider unavailable, never observed, wrong network, reference mismatch, duplicate, wrong value, wrong recipient, execution failure, late finality, capacity exclusion, below minimum, and unknown broadcast are explicit tests.
- Type consistency: deposit states, membership states, Pod states, exception codes, and transfer states have one domain definition and are reused across DB, web, and worker.
- Scope: settlement payouts, evidence, review, and occurrence scheduling remain outside Phase 3.
- Placeholder scan: no implementation step depends on a TBD value or invented client-credit path.
- User gate: 3A and 3B stop separately for physical Nimiq Pay approval.
