import { randomUUID } from "node:crypto";

import type { PublishedPodContract } from "@pods/domain";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/index";
import { runPodsMigrations } from "../src/migration-runner";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const repository = createPodsRepository(databaseUrl);
const testUserIds = new Set<string>();

const contract: PublishedPodContract = {
  version: 1,
  templateId: "build",
  evidenceMode: "per_occurrence_commitment",
  settlementMode: "proportional",
  activity: {
    name: "Settlement integration",
    purpose: "Prove immutable per-occurrence settlement and exact treasury conservation.",
    startDate: "2027-05-03",
    endDate: "2027-05-03",
    timeZone: "UTC",
    weekdays: [1],
    config: {
      projectTheme: "Settlement correctness",
      allowedDeliverables: ["pull_request"],
      commitmentCutoff: "09:00"
    }
  },
  community: {
    visibility: "public",
    minParticipants: 2,
    maxParticipants: 5,
    applicationQuestions: []
  },
  commitment: {
    lunaPerOccurrence: 10_000,
    occurrenceCount: 1,
    totalLuna: 10_000
  },
  verification: {
    verifier: "creator",
    targetReviewHours: 12,
    timeoutProtectionHours: 24
  }
};

beforeAll(async () => {
  await runPodsMigrations(databaseUrl);
});

afterAll(async () => {
  await repository.close();
  if (testUserIds.size === 0) return;
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
      [...testUserIds]
    ]);
  } finally {
    await pool.end();
  }
});

async function createUser(label: string) {
  const session = await repository.createSession({
    walletAddress: `NQTEST${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date("2028-01-01T00:00:00.000Z")
  });
  testUserIds.add(session.userId);
  await repository.saveProfile(session.userId, {
    handle: `${label}_${session.userId.slice(0, 8)}`,
    displayName: label,
    bio: "Testing deterministic settlement for Pods.",
    avatar: { kind: "preset", preset: "indigo" },
    visibility: "private",
    dmPolicy: "friends",
    activityStatusVisible: false
  });
  return session;
}

async function seedApprovedAndRejectedPod() {
  const creator = await createUser("settlement_creator");
  const approved = await createUser("approved_member");
  const rejected = await createUser("rejected_member");
  const podId = randomUUID();
  const occurrenceId = randomUUID();
  const conversationId = randomUUID();
  const membershipIds = [randomUUID(), randomUUID()];
  const intentIds = [randomUUID(), randomUUID()];
  const commitmentIds = [randomUUID(), randomUUID()];
  const submissionIds = [randomUUID(), randomUUID()];
  const contractHash = randomUUID();
  const now = new Date("2027-05-04T00:00:00.000Z");
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(
      `INSERT INTO pods (
         id, creator_user_id, state, template_id, draft_data, contract_data,
         contract_hash, published_at, created_at, updated_at
       ) VALUES ($1, $2, 'final_review', 'build', '{}', $3::jsonb, $4, $5, $5, $5)`,
      [podId, creator.userId, JSON.stringify(contract), contractHash, now]
    );
    await pool.query(
      `INSERT INTO occurrences (
         id, pod_id, ordinal, local_date, opens_at, closes_at,
         commitment_deadline_at, state
       ) VALUES ($1, $2, 1, '2027-05-03', $3, $4, $5, 'review_open')`,
      [
        occurrenceId,
        podId,
        new Date("2027-05-03T00:00:00.000Z"),
        new Date("2027-05-04T00:00:00.000Z"),
        new Date("2027-05-03T09:00:00.000Z")
      ]
    );
    await pool.query(
      `INSERT INTO conversations (
         id, kind, pod_id, room_state, last_sequence, created_at, updated_at
       ) VALUES ($1, 'pod', $2, 'archived', 0, $3, $3)`,
      [conversationId, podId, now]
    );
    const participantUsers = [approved, rejected];
    for (let index = 0; index < participantUsers.length; index += 1) {
      const participant = participantUsers[index]!;
      const membershipId = membershipIds[index]!;
      const intentId = intentIds[index]!;
      await pool.query(
        `INSERT INTO memberships (
           id, pod_id, user_id, admission_source, state, deposit_intent_id,
           accepted_contract_hash, accepted_at, created_at, updated_at
         ) VALUES ($1, $2, $3, 'public_application', 'active', $4, $5, $6, $6, $6)`,
        [membershipId, podId, participant.userId, intentId, contractHash, now]
      );
      await pool.query(
        `INSERT INTO deposit_intents (
           id, membership_id, pod_id, user_id, wallet_address, treasury_address,
           network, reference, amount_luna, state, expires_at, transaction_hash,
           block_number, transaction_index, observed_at, finalized_at, credited_at,
           created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, 'NQ99 TREASURY', 'testnet', $6, 10000,
           'applied_to_roster', $7, $8, $9, $10, $11, $11, $11, $11, $11
         )`,
        [
          intentId,
          membershipId,
          podId,
          participant.userId,
          participant.walletAddress,
          randomUUID().replaceAll("-", ""),
          new Date("2027-05-02T00:00:00.000Z"),
          randomUUID().replaceAll("-", ""),
          100 + index,
          index,
          new Date("2027-05-02T12:00:00.000Z")
        ]
      );
      await pool.query(
        `INSERT INTO ledger_entries (
           id, idempotency_key, pod_id, membership_id, deposit_intent_id,
           movement_type, debit_account, credit_account, amount_luna, created_at
         ) VALUES ($1, $2, $3, $4, $5, 'deposit_credit', $6, $7, 10000, $8)`,
        [
          randomUUID(),
          `deposit-credit:${intentId}`,
          podId,
          membershipId,
          intentId,
          `treasury_asset:testnet`,
          `participant_liability:${membershipId}`,
          now
        ]
      );
      await pool.query(
        `INSERT INTO occurrence_commitments (
           id, occurrence_id, membership_id, task, deliverable_type, locked_at
         ) VALUES ($1, $2, $3, $4, 'pull_request', $5)`,
        [
          commitmentIds[index],
          occurrenceId,
          membershipId,
          `Ship settlement outcome ${index + 1}`,
          new Date("2027-05-03T08:00:00.000Z")
        ]
      );
      const state = index === 0 ? "approved" : "rejected";
      await pool.query(
        `INSERT INTO submissions (
           id, occurrence_id, membership_id, commitment_id, state,
           result_summary, artifact_url, proof_share_mode, submitted_at,
           review_target_at, review_hard_deadline_at, reviewed_at, approved_at,
           created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, 'reviewer_only', $8, $9, $10, $11,
           $12, $8, $11
         )`,
        [
          submissionIds[index],
          occurrenceId,
          membershipId,
          commitmentIds[index],
          state,
          `Settlement integration result ${index + 1} is complete and reviewable.`,
          `https://github.com/18Abhinav07/Pods/pull/${index + 50}`,
          new Date("2027-05-03T12:00:00.000Z"),
          new Date("2027-05-04T00:00:00.000Z"),
          new Date("2027-05-04T12:00:00.000Z"),
          new Date("2027-05-03T13:00:00.000Z"),
          index === 0 ? new Date("2027-05-03T13:00:00.000Z") : null
        ]
      );
    }
  } finally {
    await pool.end();
  }
  return {
    podId,
    occurrenceId,
    conversationId,
    membershipIds,
    intentIds,
    creatorUserId: creator.userId,
    approvedUserId: approved.userId,
    now
  };
}

describe("Phase 5 settlement persistence", () => {
  it.each([
    "unknown",
    "retryable_failed",
    "mismatched",
    "late",
    "manual_review"
  ] as const)("filters the operations payout queue by %s", async (state) => {
    const fixture = await seedApprovedAndRejectedPod();
    await repository.finalizePodSettlement({
      podId: fixture.podId,
      now: fixture.now
    });
    const leg = (await repository.listOpenPayoutTransferLegs()).find(
      (candidate) => candidate.podId === fixture.podId
    );
    if (!leg) throw new Error("Payout leg fixture is missing");
    const prepared = await repository.persistPayoutTransferAttempt({
      legId: leg.id,
      dataReference: `pods:payout:${leg.id}:1`,
      rawTransactionHex: "operations-filter-attempt",
      transactionHash: randomUUID().replaceAll("-", ""),
      validityStartHeight: 1_000,
      now: new Date("2027-05-04T00:01:00.000Z")
    });
    if (!prepared?.attempt) throw new Error("Payout attempt fixture is missing");

    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query(
        "UPDATE transfer_attempts SET state = $1, updated_at = $2 WHERE id = $3",
        [state, new Date("2027-05-04T00:02:00.000Z"), prepared.attempt.id]
      );
      await pool.query(
        "UPDATE transfer_legs SET state = $1, updated_at = $2 WHERE id = $3",
        [state, new Date("2027-05-04T00:02:00.000Z"), leg.id]
      );
    } finally {
      await pool.end();
    }

    const rows = await repository.listPayoutTransferOperations({
      states: [state],
      limit: 25
    });

    expect(rows).toEqual([
      expect.objectContaining({
        id: leg.id,
        podId: fixture.podId,
        state,
        attempt: expect.objectContaining({
          id: prepared.attempt.id,
          sequence: 1,
          state
        })
      })
    ]);
    expect(JSON.stringify(rows)).not.toMatch(
      /recipientWallet|rawTransactionHex|dataReference/
    );
  });

  it("creates a second immutable attempt only after an audited terminal retry request", async () => {
    const fixture = await seedApprovedAndRejectedPod();
    await repository.finalizePodSettlement({
      podId: fixture.podId,
      now: fixture.now
    });
    const leg = (await repository.listOpenPayoutTransferLegs()).find(
      (candidate) => candidate.podId === fixture.podId
    );
    if (!leg) throw new Error("Payout leg fixture is missing");
    const first = await repository.persistPayoutTransferAttempt({
      legId: leg.id,
      dataReference: `pods:payout:${leg.id}:1`,
      rawTransactionHex: "first-attempt",
      transactionHash: randomUUID().replaceAll("-", ""),
      validityStartHeight: 1_000,
      now: new Date("2027-05-04T00:01:00.000Z")
    });
    if (!first?.attempt) throw new Error("First payout attempt is missing");
    await repository.claimPayoutBroadcast({
      legId: leg.id,
      attemptId: first.attempt.id,
      now: new Date("2027-05-04T00:02:00.000Z")
    });
    await repository.markPayoutTransferLate({
      legId: leg.id,
      attemptId: first.attempt.id,
      now: new Date("2027-05-04T00:03:00.000Z")
    });

    await repository.requestPayoutRetry({
      legId: leg.id,
      attemptId: first.attempt.id,
      actor: "pods-operations",
      reason: "Fresh chain lookup confirmed the expired attempt is absent.",
      now: new Date("2027-05-04T00:04:00.000Z")
    });
    const replacement = await repository.persistPayoutTransferAttempt({
      legId: leg.id,
      dataReference: `pods:payout:${leg.id}:2`,
      rawTransactionHex: "second-attempt",
      transactionHash: randomUUID().replaceAll("-", ""),
      validityStartHeight: 9_000,
      now: new Date("2027-05-04T00:05:00.000Z")
    });

    expect(replacement?.state).toBe("prepared");
    expect(replacement?.attempt).toEqual(
      expect.objectContaining({
        sequence: 2,
        state: "prepared",
        dataReference: `pods:payout:${leg.id}:2`
      })
    );
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      const attempts = await pool.query(
        `SELECT sequence, state, raw_transaction_hex
           FROM transfer_attempts
          WHERE transfer_leg_id = $1
          ORDER BY sequence`,
        [leg.id]
      );
      expect(attempts.rows).toEqual([
        {
          sequence: 1,
          state: "late",
          raw_transaction_hex: "first-attempt"
        },
        {
          sequence: 2,
          state: "prepared",
          raw_transaction_hex: "second-attempt"
        }
      ]);
      const audit = await pool.query(
        `SELECT actor, from_state, to_state, reason
           FROM transfer_events
          WHERE transfer_leg_id = $1
            AND actor = 'operations'
          ORDER BY created_at`,
        [leg.id]
      );
      expect(audit.rows).toEqual([
        expect.objectContaining({
          actor: "operations",
          from_state: "late",
          to_state: "queued",
          reason: expect.stringContaining("Fresh chain lookup confirmed")
        })
      ]);
    } finally {
      await pool.end();
    }
  });

  it("projects participant detail and creator conservation without wallet data", async () => {
    const fixture = await seedApprovedAndRejectedPod();
    await repository.finalizePodSettlement({
      podId: fixture.podId,
      now: fixture.now
    });

    const participant = await repository.getParticipantSettlement({
      podId: fixture.podId,
      userId: fixture.approvedUserId
    });
    const creator = await repository.getCreatorSettlement({
      podId: fixture.podId,
      creatorUserId: fixture.creatorUserId
    });

    expect(participant).toMatchObject({
      pod: { id: fixture.podId, state: "final_review" },
      settlement: {
        state: "executing",
        totalDepositLuna: 20_000,
        totalPayoutLuna: 20_000
      },
      entitlement: {
        principalLuna: 10_000,
        bonusLuna: 10_000,
        payoutLuna: 20_000,
        state: "transfer_queued"
      },
      transfer: {
        state: "queued",
        amountLuna: 20_000,
        transactionHash: null
      },
      outcomes: [
        expect.objectContaining({ ordinal: 1, state: "approved" })
      ]
    });
    expect(creator).toMatchObject({
      pod: { id: fixture.podId, state: "final_review" },
      settlement: {
        state: "executing",
        totalDepositLuna: 20_000,
        totalPayoutLuna: 20_000
      }
    });
    expect(creator?.entitlements).toHaveLength(2);
    expect(JSON.stringify(participant)).not.toMatch(/wallet/i);
    expect(JSON.stringify(creator)).not.toMatch(/wallet/i);
  });

  it("persists immutable payout attempts and completes the Pod only after confirmation", async () => {
    const fixture = await seedApprovedAndRejectedPod();
    await repository.finalizePodSettlement({
      podId: fixture.podId,
      now: fixture.now
    });
    const leg = (await repository.listOpenPayoutTransferLegs()).find(
      (candidate) => candidate.podId === fixture.podId
    );
    expect(leg).toBeDefined();
    if (!leg) throw new Error("Payout leg fixture is missing");

    const prepared = await repository.persistPayoutTransferAttempt({
      legId: leg.id,
      dataReference: `pods:payout:${leg.id}:1`,
      rawTransactionHex: "signed-payout-bytes",
      transactionHash: randomUUID().replaceAll("-", ""),
      validityStartHeight: 1_000,
      now: new Date("2027-05-04T00:01:00.000Z")
    });
    expect(prepared?.state).toBe("prepared");
    expect(prepared?.attempt).toEqual(
      expect.objectContaining({
        sequence: 1,
        state: "prepared",
        dataReference: `pods:payout:${leg.id}:1`
      })
    );

    await expect(
      repository.persistPayoutTransferAttempt({
        legId: leg.id,
        dataReference: `pods:payout:${leg.id}:1`,
        rawTransactionHex: "different-signed-payout-bytes",
        transactionHash: randomUUID().replaceAll("-", ""),
        validityStartHeight: 1_001,
        now: new Date("2027-05-04T00:01:01.000Z")
      })
    ).resolves.toEqual(prepared);

    const claimed = await repository.claimPayoutBroadcast({
      legId: leg.id,
      attemptId: prepared!.attempt!.id,
      now: new Date("2027-05-04T00:02:00.000Z")
    });
    const duplicateClaim = await repository.claimPayoutBroadcast({
      legId: leg.id,
      attemptId: prepared!.attempt!.id,
      now: new Date("2027-05-04T00:02:01.000Z")
    });
    expect(claimed).toBe(true);
    expect(duplicateClaim).toBe(false);

    await repository.markPayoutTransferBroadcast({
      legId: leg.id,
      attemptId: prepared!.attempt!.id,
      now: new Date("2027-05-04T00:02:02.000Z")
    });
    await repository.confirmPayoutTransfer({
      legId: leg.id,
      attemptId: prepared!.attempt!.id,
      now: new Date("2027-05-04T00:03:00.000Z")
    });

    const pool = new Pool({ connectionString: databaseUrl });
    try {
      const state = await pool.query<{
        pod_state: string;
        run_state: string;
        entitlement_state: string;
        leg_state: string;
        attempt_state: string;
      }>(
        `SELECT p.state AS pod_state, sr.state AS run_state,
                se.state AS entitlement_state, tl.state AS leg_state,
                ta.state AS attempt_state
         FROM transfer_legs tl
         JOIN transfer_attempts ta ON ta.transfer_leg_id = tl.id
         JOIN settlement_entitlements se ON se.id = tl.settlement_entitlement_id
         JOIN settlement_runs sr ON sr.id = se.settlement_run_id
         JOIN pods p ON p.id = sr.pod_id
         WHERE tl.id = $1`,
        [leg.id]
      );
      const payoutLedger = await pool.query<{
        movement_type: string;
        debit_account: string;
        credit_account: string;
        amount_luna: string;
      }>(
        `SELECT movement_type, debit_account, credit_account, amount_luna
         FROM ledger_entries
         WHERE pod_id = $1 AND movement_type = 'payout_confirmed'`,
        [fixture.podId]
      );
      const events = await pool.query<{ to_state: string; reason: string }>(
        `SELECT to_state, reason
         FROM transfer_events
         WHERE transfer_leg_id = $1
         ORDER BY created_at, id`,
        [leg.id]
      );

      expect(state.rows).toEqual([
        {
          pod_state: "completed",
          run_state: "settled",
          entitlement_state: "transfer_confirmed",
          leg_state: "confirmed",
          attempt_state: "confirmed"
        }
      ]);
      expect(payoutLedger.rows).toEqual([
        expect.objectContaining({
          movement_type: "payout_confirmed",
          credit_account: "treasury_asset:testnet",
          amount_luna: "20000"
        })
      ]);
      const completionEvent = await pool.query(
        `SELECT conversation_id, recipient_user_id, kind
           FROM realtime_events
          WHERE conversation_id = $1
            AND kind = 'pod.completed'`,
        [fixture.conversationId]
      );
      expect(completionEvent.rows).toEqual([
        {
          conversation_id: fixture.conversationId,
          recipient_user_id: null,
          kind: "pod.completed"
        }
      ]);
      expect(events.rows).toEqual(
        expect.arrayContaining([
          { to_state: "prepared", reason: "attempt_prepared" },
          { to_state: "unknown", reason: "broadcast_claimed" },
          { to_state: "broadcast", reason: "broadcast_submitted" },
          { to_state: "confirmed", reason: "chain_finalized" }
        ])
      );
    } finally {
      await pool.end();
    }
  });

  it("lists only proportional final-review Pods whose frozen matrix is terminal", async () => {
    const fixture = await seedApprovedAndRejectedPod();

    const before = await repository.listSettlementReadyPods(fixture.now);
    expect(before).toContainEqual({ id: fixture.podId });

    await repository.finalizePodSettlement({
      podId: fixture.podId,
      now: fixture.now
    });

    const after = await repository.listSettlementReadyPods(fixture.now);
    expect(after).not.toContainEqual({ id: fixture.podId });
  });

  it("rejects a funded roster with an extra deposit credit movement", async () => {
    const fixture = await seedApprovedAndRejectedPod();
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query(
        `INSERT INTO ledger_entries (
           id, idempotency_key, pod_id, membership_id, deposit_intent_id,
           movement_type, debit_account, credit_account, amount_luna, created_at
         ) VALUES ($1, $2, $3, $4, $5, 'deposit_credit', $6, $7, 1, $8)`,
        [
          randomUUID(),
          `unexpected-deposit-credit:${fixture.intentIds[0]}`,
          fixture.podId,
          fixture.membershipIds[0],
          fixture.intentIds[0],
          "treasury_asset:testnet",
          `participant_liability:${fixture.membershipIds[0]}`,
          fixture.now
        ]
      );
    } finally {
      await pool.end();
    }

    await expect(
      repository.finalizePodSettlement({
        podId: fixture.podId,
        now: fixture.now
      })
    ).rejects.toThrow("Deposit credit ledger does not match the frozen roster");
  });

  it("finalizes immutable conserved entitlements and skips a zero-Luna transfer", async () => {
    const fixture = await seedApprovedAndRejectedPod();

    const first = await repository.finalizePodSettlement({
      podId: fixture.podId,
      now: fixture.now
    });
    const repeated = await repository.finalizePodSettlement({
      podId: fixture.podId,
      now: new Date(fixture.now.getTime() + 1_000)
    });

    expect(first.kind).toBe("finalized");
    expect(repeated.kind).toBe("already_finalized");
    expect(repeated.settlement.id).toBe(first.settlement.id);

    const pool = new Pool({ connectionString: databaseUrl });
    try {
      const runs = await pool.query<{
        id: string;
        state: string;
        total_deposit_luna: string;
        total_payout_luna: string;
      }>(
        `SELECT id, state, total_deposit_luna, total_payout_luna
         FROM settlement_runs
         WHERE pod_id = $1`,
        [fixture.podId]
      );
      const occurrences = await pool.query<{
        state: string;
        forfeiture_pool_luna: string;
        bonus_recipient_count: number;
      }>(
        `SELECT state, forfeiture_pool_luna, bonus_recipient_count
         FROM settlement_occurrences
         WHERE pod_id = $1`,
        [fixture.podId]
      );
      const entitlements = await pool.query<{
        membership_id: string;
        principal_luna: string;
        bonus_luna: string;
        payout_luna: string;
        state: string;
      }>(
        `SELECT membership_id, principal_luna, bonus_luna, payout_luna, state
         FROM settlement_entitlements
         WHERE pod_id = $1
         ORDER BY membership_id`,
        [fixture.podId]
      );
      const transfers = await pool.query<{
        membership_id: string;
        type: string;
        amount_luna: string;
        state: string;
      }>(
        `SELECT membership_id, type, amount_luna, state
         FROM transfer_legs
         WHERE pod_id = $1 AND type = 'payout'`,
        [fixture.podId]
      );
      const settlementLedger = await pool.query<{
        movement_type: string;
        debit_account: string;
        credit_account: string;
        amount_luna: string;
      }>(
        `SELECT movement_type, debit_account, credit_account, amount_luna
         FROM ledger_entries
         WHERE pod_id = $1 AND movement_type <> 'deposit_credit'
         ORDER BY movement_type, idempotency_key`,
        [fixture.podId]
      );

      expect(runs.rows).toEqual([
        expect.objectContaining({
          state: "executing",
          total_deposit_luna: "20000",
          total_payout_luna: "20000"
        })
      ]);
      expect(occurrences.rows).toEqual([
        {
          state: "closed",
          forfeiture_pool_luna: "10000",
          bonus_recipient_count: 1
        }
      ]);
      expect(entitlements.rows).toHaveLength(2);
      expect(entitlements.rows).toEqual(
        expect.arrayContaining([
          {
            membership_id: fixture.membershipIds[0],
            principal_luna: "10000",
            bonus_luna: "10000",
            payout_luna: "20000",
            state: "transfer_queued"
          },
          {
            membership_id: fixture.membershipIds[1],
            principal_luna: "0",
            bonus_luna: "0",
            payout_luna: "0",
            state: "no_transfer_required"
          }
        ])
      );
      expect(transfers.rows).toEqual([
        {
          membership_id: fixture.membershipIds[0],
          type: "payout",
          amount_luna: "20000",
          state: "queued"
        }
      ]);
      expect(settlementLedger.rows).toEqual(
        expect.arrayContaining([
          {
            movement_type: "principal_allocation",
            debit_account: `participant_liability:${fixture.membershipIds[0]}`,
            credit_account: `occurrence_liability:${fixture.occurrenceId}:${fixture.membershipIds[0]}`,
            amount_luna: "10000"
          },
          {
            movement_type: "principal_allocation",
            debit_account: `participant_liability:${fixture.membershipIds[1]}`,
            credit_account: `occurrence_liability:${fixture.occurrenceId}:${fixture.membershipIds[1]}`,
            amount_luna: "10000"
          },
          expect.objectContaining({
            movement_type: "principal_protection",
            amount_luna: "10000"
          }),
          expect.objectContaining({
            movement_type: "provisional_forfeiture",
            amount_luna: "10000"
          }),
          expect.objectContaining({
            movement_type: "bonus_entitlement",
            amount_luna: "10000"
          })
        ])
      );
    } finally {
      await pool.end();
    }
  });
});
