import { randomUUID } from "node:crypto";

import { buildPublishedContract } from "../../domain/src/index";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/index";
import { runPodsMigrations } from "../src/migration-runner";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const repository = createPodsRepository(databaseUrl);
const testUserIds = new Set<string>();
const treasuryAddress = "NQ41 ENPQ 41CH URE0 BQ41 N6XJ RUFN JPE7 4U0A";

beforeAll(async () => {
  await runPodsMigrations(databaseUrl);
});

afterAll(async () => {
  await repository.close();
  if (testUserIds.size === 0) return;
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[...testUserIds]]);
  } finally {
    await pool.end();
  }
});

async function createUser() {
  const walletAddress = `NQTEST${randomUUID()}`;
  const session = await repository.createSession({
    walletAddress,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date("2027-01-01T00:00:00.000Z")
  });
  testUserIds.add(session.userId);
  return { ...session, walletAddress };
}

async function publishPublicPod(creatorUserId: string) {
  const draft = await repository.createDraft(creatorUserId, "build");
  const activity = {
    name: `Phase 3 Funding ${randomUUID()}`,
    purpose: "Prove exact Testnet NIM commitment attribution and funding finality for Pods.",
    startDate: "2027-03-08",
    endDate: "2027-03-12",
    timeZone: "UTC",
    weekdays: [1, 2, 3, 4, 5],
    config: {
      projectTheme: "Pods Phase 3",
      allowedDeliverables: ["pull_request"],
      commitmentCutoff: "09:00"
    }
  };
  const community = {
    visibility: "public" as const,
    minParticipants: 2,
    maxParticipants: 4,
    applicationQuestions: ["What will you fund?"]
  };
  const commitment = { nimPerOccurrence: "0.1" };
  await repository.saveActivityStep(creatorUserId, draft.id, activity);
  await repository.saveCommunityStep(creatorUserId, draft.id, community);
  await repository.saveCommitmentStep(creatorUserId, draft.id, commitment);
  const frozen = buildPublishedContract({
    templateId: "build",
    activity,
    community,
    commitment
  });
  if (!frozen.success) throw new Error(frozen.errors.join(", "));
  return repository.publishDraft({
    creatorUserId,
    podId: draft.id,
    contract: frozen.contract,
    occurrences: frozen.occurrences
  });
}

async function acceptMember(podId: string, creatorUserId: string, userId: string) {
  const application = await repository.applyToPublicPod({
    podId,
    applicantUserId: userId,
    answers: [{ question: "What will you fund?", answer: "One exact NIM commitment" }],
    now: new Date("2027-03-01T00:00:00.000Z")
  });
  await repository.decideApplication({
    creatorUserId,
    podId,
    applicationId: application.id,
    decision: "accept",
    now: new Date("2027-03-01T00:01:00.000Z")
  });
  const membership = await repository.getMembershipForUser(userId, podId);
  if (!membership) throw new Error("Accepted membership was not created");
  return membership;
}

async function createAcceptedFixture() {
  const creator = await createUser();
  const member = await createUser();
  const pod = await publishPublicPod(creator.userId);
  const membership = await acceptMember(pod.id, creator.userId, member.userId);
  return { creator, member, pod, membership };
}

function intentInput(fixture: Awaited<ReturnType<typeof createAcceptedFixture>>, reference: string) {
  return {
    podId: fixture.pod.id,
    userId: fixture.member.userId,
    walletAddress: fixture.member.walletAddress,
    treasuryAddress,
    network: "testnet" as const,
    reference,
    now: new Date("2027-03-01T01:00:00.000Z")
  };
}

describe("Phase 3 deposit persistence", () => {
  it("creates one exact open intent for an accepted membership", async () => {
    const fixture = await createAcceptedFixture();
    const input = intentInput(fixture, "pods-00112233445566778899aabb");

    const intent = await repository.createDepositIntent(input);

    expect(intent).toMatchObject({
      membershipId: fixture.membership.id,
      userId: fixture.member.userId,
      walletAddress: fixture.member.walletAddress,
      treasuryAddress,
      network: "testnet",
      reference: input.reference,
      amountLuna: 50_000,
      state: "intent_created",
      expiresAt: new Date("2027-03-08T00:00:00.000Z")
    });
    await expect(
      repository.createDepositIntent({ ...input, reference: "pods-aabbccddeeff001122334455" })
    ).rejects.toThrow("Membership already has an open deposit intent");
    expect(
      await repository.getOpenDepositIntentForUser(fixture.member.userId, fixture.pod.id)
    ).toMatchObject({ id: intent.id, reference: input.reference });
    expect(await repository.getMembershipForUser(fixture.member.userId, fixture.pod.id))
      .toMatchObject({ state: "deposit_pending" });
  });

  it("enforces per-deposit and reserved treasury exposure caps", async () => {
    const cappedTreasuryAddress = `NQCAP${randomUUID()}`;
    const first = await createAcceptedFixture();
    await expect(repository.createDepositIntent({
      ...intentInput(first, "pods-cap-too-small-001"),
      treasuryAddress: cappedTreasuryAddress,
      maximumDepositLuna: 49_999,
      maximumTreasuryExposureLuna: 100_000
    })).rejects.toThrow("Commitment exceeds the alpha deposit cap");

    await repository.createDepositIntent({
      ...intentInput(first, "pods-cap-first-reserved"),
      treasuryAddress: cappedTreasuryAddress,
      maximumDepositLuna: 50_000,
      maximumTreasuryExposureLuna: 50_000
    });
    const second = await createAcceptedFixture();
    await expect(repository.createDepositIntent({
      ...intentInput(second, "pods-cap-second-blocked"),
      treasuryAddress: cappedTreasuryAddress,
      maximumDepositLuna: 50_000,
      maximumTreasuryExposureLuna: 50_000
    })).rejects.toThrow("Alpha treasury exposure cap has been reached");
  });

  it("detaches a rejected wallet intent so the member can retry funding", async () => {
    const fixture = await createAcceptedFixture();
    const firstIntent = await repository.createDepositIntent(
      intentInput(fixture, "pods-rejected-wallet-first")
    );

    await repository.recordDepositWalletAttempt({
      intentId: firstIntent.id,
      userId: fixture.member.userId,
      event: "open",
      now: new Date("2027-03-01T01:01:00.000Z")
    });
    await repository.recordDepositWalletAttempt({
      intentId: firstIntent.id,
      userId: fixture.member.userId,
      event: "rejected",
      now: new Date("2027-03-01T01:02:00.000Z")
    });

    expect(await repository.getMembershipForUser(fixture.member.userId, fixture.pod.id))
      .toMatchObject({ state: "funding_failed", depositIntentId: null });
    expect(await repository.getOpenDepositIntentForUser(fixture.member.userId, fixture.pod.id))
      .toBeNull();

    const retryIntent = await repository.createDepositIntent({
      ...intentInput(fixture, "pods-rejected-wallet-retry"),
      now: new Date("2027-03-01T01:03:00.000Z")
    });
    expect(retryIntent).toMatchObject({ state: "intent_created" });
  });

  it("records only owner wallet events and treats the hash as a non-crediting hint", async () => {
    const fixture = await createAcceptedFixture();
    const stranger = await createUser();
    const intent = await repository.createDepositIntent(
      intentInput(fixture, "pods-11223344556677889900aabb")
    );

    expect(await repository.getDepositIntentForUser(stranger.userId, intent.id)).toBeNull();
    expect(
      await repository.recordDepositWalletAttempt({
        intentId: intent.id,
        userId: fixture.member.userId,
        event: "open",
        now: new Date("2027-03-01T01:01:00.000Z")
      })
    ).toMatchObject({ state: "wallet_approval_pending" });
    expect(
      await repository.recordDepositTransactionHint({
        intentId: intent.id,
        userId: fixture.member.userId,
        transactionHash: "a".repeat(64),
        now: new Date("2027-03-01T01:02:00.000Z")
      })
    ).toMatchObject({ state: "transaction_submitted", transactionHash: "a".repeat(64) });
    expect(
      await repository.recordObservedDeposit({
        intentId: intent.id,
        transactionHash: "e".repeat(64),
        observedFrom: "NQHTLC",
        observedFromType: 2,
        blockNumber: 6_407_464,
        transactionIndex: 3,
        transactionBatch: 56_258,
        now: new Date("2027-03-01T01:03:00.000Z")
      })
    ).toMatchObject({ state: "observed", transactionHash: "e".repeat(64) });
    expect(await repository.getMembershipForUser(fixture.member.userId, fixture.pod.id))
      .toMatchObject({ state: "deposit_pending" });
  });

  it("credits one finalized transaction once and appends one balanced ledger movement", async () => {
    const fixture = await createAcceptedFixture();
    const intent = await repository.createDepositIntent(
      intentInput(fixture, "pods-22334455667788990011aabb")
    );
    await repository.recordDepositWalletAttempt({
      intentId: intent.id,
      userId: fixture.member.userId,
      event: "open",
      now: new Date("2027-03-01T01:01:00.000Z")
    });
    await repository.recordDepositTransactionHint({
      intentId: intent.id,
      userId: fixture.member.userId,
      transactionHash: "b".repeat(64),
      now: new Date("2027-03-01T01:02:00.000Z")
    });
    await repository.recordObservedDeposit({
      intentId: intent.id,
      transactionHash: "b".repeat(64),
      observedFrom: "NQHTLC",
      observedFromType: 2,
      blockNumber: 6_407_464,
      transactionIndex: 3,
      transactionBatch: 56_258,
      now: new Date("2027-03-01T01:03:00.000Z")
    });
    await repository.finalizeObservedDeposit({
      intentId: intent.id,
      now: new Date("2027-03-01T01:04:00.000Z")
    });

    const firstCredit = await repository.creditFinalizedDeposit({
      intentId: intent.id,
      now: new Date("2027-03-01T01:05:00.000Z")
    });
    const replayCredit = await repository.creditFinalizedDeposit({
      intentId: intent.id,
      now: new Date("2027-03-01T01:06:00.000Z")
    });

    expect(firstCredit).toMatchObject({ state: "credited_provisional" });
    expect(replayCredit).toMatchObject({ state: "credited_provisional" });
    expect(await repository.getMembershipForUser(fixture.member.userId, fixture.pod.id))
      .toMatchObject({ state: "funded_provisional" });
    expect(await repository.listLedgerEntriesForDeposit(intent.id)).toEqual([
      expect.objectContaining({
        idempotencyKey: `deposit-credit:${intent.id}`,
        movementType: "deposit_credit",
        debitAccount: "treasury_asset:testnet",
        creditAccount: `participant_liability:${fixture.membership.id}`,
        amountLuna: 50_000
      })
    ]);
  });

  it("rejects one transaction hash being claimed by two intents", async () => {
    const first = await createAcceptedFixture();
    const second = await createAcceptedFixture();
    const firstIntent = await repository.createDepositIntent(
      intentInput(first, "pods-33445566778899001122aabb")
    );
    const secondIntent = await repository.createDepositIntent(
      intentInput(second, "pods-44556677889900112233aabb")
    );
    for (const [fixture, intent] of [[first, firstIntent], [second, secondIntent]] as const) {
      await repository.recordDepositWalletAttempt({
        intentId: intent.id,
        userId: fixture.member.userId,
        event: "open",
        now: new Date("2027-03-01T01:01:00.000Z")
      });
    }
    await repository.recordObservedDeposit({
      intentId: firstIntent.id,
      transactionHash: "c".repeat(64),
      observedFrom: "NQHTLC1",
      observedFromType: 2,
      blockNumber: 100,
      transactionIndex: 1,
      transactionBatch: 10,
      now: new Date("2027-03-01T01:02:00.000Z")
    });

    await expect(
      repository.recordObservedDeposit({
        intentId: secondIntent.id,
        transactionHash: "c".repeat(64),
        observedFrom: "NQHTLC2",
        observedFromType: 2,
        blockNumber: 101,
        transactionIndex: 1,
        transactionBatch: 10,
        now: new Date("2027-03-01T01:03:00.000Z")
      })
    ).rejects.toThrow("Transaction hash is already assigned to another deposit intent");
  });

  it("records one worker exception idempotently without creating ledger credit", async () => {
    const fixture = await createAcceptedFixture();
    const intent = await repository.createDepositIntent(
      intentInput(fixture, "pods-55667788990011223344aabb")
    );
    await repository.recordDepositWalletAttempt({
      intentId: intent.id,
      userId: fixture.member.userId,
      event: "open",
      now: new Date("2027-03-01T01:01:00.000Z")
    });

    const first = await repository.recordDepositException({
      intentId: intent.id,
      code: "amount_mismatch",
      now: new Date("2027-03-01T01:02:00.000Z")
    });
    const replay = await repository.recordDepositException({
      intentId: intent.id,
      code: "amount_mismatch",
      now: new Date("2027-03-01T01:03:00.000Z")
    });

    expect(first).toMatchObject({ state: "exception_review", exceptionCode: "amount_mismatch" });
    expect(replay).toMatchObject({ state: "exception_review", exceptionCode: "amount_mismatch" });
    expect(await repository.listLedgerEntriesForDeposit(intent.id)).toEqual([]);
    await expect(repository.isDepositTransactionHashClaimed("d".repeat(64), intent.id))
      .resolves.toBe(false);
  });
});
