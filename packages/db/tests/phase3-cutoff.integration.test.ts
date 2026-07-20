import { createHash, randomUUID } from "node:crypto";

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
const cutoff = new Date("2027-03-08T00:00:00.000Z");

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
    expiresAt: new Date("2028-01-01T00:00:00.000Z")
  });
  testUserIds.add(session.userId);
  return { ...session, walletAddress };
}

async function publishPod(creatorUserId: string, minParticipants: number, maxParticipants: number) {
  const draft = await repository.createDraft(creatorUserId, "build");
  const activity = {
    name: `Phase 3B Cutoff ${randomUUID()}`,
    purpose: "Prove serialized roster lock and principal-safe refund creation.",
    startDate: "2027-03-08",
    endDate: "2027-03-12",
    timeZone: "UTC",
    weekdays: [1, 2, 3, 4, 5],
    config: {
      projectTheme: "Pods Phase 3B",
      allowedDeliverables: ["pull_request"],
      commitmentCutoff: "09:00"
    }
  };
  const community = {
    visibility: "public" as const,
    minParticipants,
    maxParticipants,
    applicationQuestions: ["What will you build?"]
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

async function createPodFixture(minParticipants: number, maxParticipants: number) {
  const creator = await createUser();
  const pod = await publishPod(creator.userId, minParticipants, maxParticipants);
  return { creator, pod };
}

async function acceptMember(podId: string, creatorUserId: string) {
  const member = await createUser();
  const application = await repository.applyToPublicPod({
    podId,
    applicantUserId: member.userId,
    answers: [{ question: "What will you build?", answer: "A tested Pods milestone" }],
    now: new Date("2027-03-01T00:00:00.000Z")
  });
  await repository.decideApplication({
    creatorUserId,
    podId,
    applicationId: application.id,
    decision: "accept",
    now: new Date("2027-03-01T00:01:00.000Z")
  });
  const membership = await repository.getMembershipForUser(member.userId, podId);
  if (!membership) throw new Error("Membership was not created");
  return { member, membership };
}

async function fundMember(input: {
  podId: string;
  creatorUserId: string;
  blockNumber: number;
  transactionIndex: number;
  finalizedAt?: Date;
}) {
  const accepted = await acceptMember(input.podId, input.creatorUserId);
  const random = randomUUID().replaceAll("-", "");
  const transactionHash = createHash("sha256").update(random).digest("hex");
  const intent = await repository.createDepositIntent({
    podId: input.podId,
    userId: accepted.member.userId,
    walletAddress: accepted.member.walletAddress,
    treasuryAddress,
    network: "testnet",
    reference: `pods-${random.slice(0, 24)}`,
    now: new Date("2027-03-01T01:00:00.000Z")
  });
  await repository.recordDepositWalletAttempt({
    intentId: intent.id,
    userId: accepted.member.userId,
    event: "open",
    now: new Date("2027-03-01T01:01:00.000Z")
  });
  await repository.recordDepositTransactionHint({
    intentId: intent.id,
    userId: accepted.member.userId,
    transactionHash,
    now: new Date("2027-03-01T01:02:00.000Z")
  });
  await repository.recordObservedDeposit({
    intentId: intent.id,
    transactionHash,
    observedFrom: accepted.member.walletAddress,
    observedFromType: 0,
    observedRelatedAddresses: [accepted.member.walletAddress, treasuryAddress],
    blockNumber: input.blockNumber,
    transactionIndex: input.transactionIndex,
    transactionBatch: 100,
    now: new Date("2027-03-01T01:03:00.000Z")
  });
  const finalizedAt = input.finalizedAt ?? new Date("2027-03-07T23:59:00.000Z");
  await repository.finalizeObservedDeposit({ intentId: intent.id, now: finalizedAt });
  await repository.creditFinalizedDeposit({ intentId: intent.id, now: finalizedAt });
  return { ...accepted, intent, transactionHash };
}

describe("Phase 3 serialized cutoff", () => {
  it("locks an exact-minimum roster in deterministic chain order", async () => {
    const fixture = await createPodFixture(2, 4);
    const later = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 101,
      transactionIndex: 0
    });
    const earlier = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 100,
      transactionIndex: 4
    });

    const result = await repository.applyPodCutoff({ podId: fixture.pod.id, now: cutoff });

    expect(result).toMatchObject({
      podId: fixture.pod.id,
      podState: "locked_scheduled",
      includedMembershipIds: [earlier.membership.id, later.membership.id],
      refundLegIds: []
    });
    expect(await repository.getMembershipForUser(earlier.member.userId, fixture.pod.id))
      .toMatchObject({ state: "roster_locked" });
    expect(await repository.getDepositIntentForUser(earlier.member.userId, earlier.intent.id))
      .toMatchObject({ state: "applied_to_roster" });
  });

  it("cancels below minimum and queues one full refund exactly once", async () => {
    const fixture = await createPodFixture(2, 4);
    const funded = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 100,
      transactionIndex: 0
    });

    const first = await repository.applyPodCutoff({ podId: fixture.pod.id, now: cutoff });
    const second = await repository.applyPodCutoff({ podId: fixture.pod.id, now: cutoff });
    const transfers = await repository.listTransferLegsForPod(fixture.pod.id);

    expect(first.podState).toBe("cancelled_refunding");
    expect(second.podState).toBe("cancelled_refunding");
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toMatchObject({
      type: "refund",
      membershipId: funded.membership.id,
      depositIntentId: funded.intent.id,
      recipientWallet: funded.member.walletAddress,
      amountLuna: 50000,
      state: "queued"
    });
    expect(await repository.getMembershipForUser(funded.member.userId, fixture.pod.id))
      .toMatchObject({ state: "refund_pending" });
    expect(await repository.getDepositIntentForUser(funded.member.userId, funded.intent.id))
      .toMatchObject({ state: "refund_pending" });
    expect(await repository.listLedgerEntriesForDeposit(funded.intent.id))
      .toHaveLength(2);
  });

  it("persists refund bytes before broadcast and confirms the refund exactly once", async () => {
    const fixture = await createPodFixture(2, 4);
    const funded = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 100,
      transactionIndex: 0
    });
    const cutoffResult = await repository.applyPodCutoff({
      podId: fixture.pod.id,
      now: cutoff
    });
    const legId = cutoffResult.refundLegIds[0];
    if (!legId) throw new Error("Refund leg was not queued");

    const prepared = await repository.markRefundTransferPrepared({
      legId,
      rawTransactionHex: "aabbccdd",
      transactionHash: createHash("sha256").update(legId).digest("hex"),
      validityStartHeight: 700,
      now: new Date("2027-03-08T00:01:00.000Z")
    });
    expect(prepared).toMatchObject({
      state: "prepared",
      rawTransactionHex: "aabbccdd",
      validityStartHeight: 700
    });
    await repository.markRefundTransferBroadcast({
      legId,
      now: new Date("2027-03-08T00:02:00.000Z")
    });
    const first = await repository.confirmRefundTransfer({
      legId,
      now: new Date("2027-03-08T00:03:00.000Z")
    });
    const second = await repository.confirmRefundTransfer({
      legId,
      now: new Date("2027-03-08T00:04:00.000Z")
    });

    expect(first?.state).toBe("confirmed");
    expect(second?.state).toBe("confirmed");
    expect(await repository.getMembershipForUser(funded.member.userId, fixture.pod.id))
      .toMatchObject({ state: "refunded" });
    expect(await repository.getDepositIntentForUser(funded.member.userId, funded.intent.id))
      .toMatchObject({ state: "refunded" });
    expect(await repository.listLedgerEntriesForDeposit(funded.intent.id))
      .toHaveLength(3);
    expect(await repository.getPodForOwner(fixture.creator.userId, fixture.pod.id))
      .toMatchObject({ state: "cancelled" });
  });

  it("confirms an over-capacity refund without cancelling the locked Pod", async () => {
    const fixture = await createPodFixture(2, 2);
    await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 100,
      transactionIndex: 0
    });
    await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 101,
      transactionIndex: 0
    });
    const excluded = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 102,
      transactionIndex: 0
    });
    const cutoffResult = await repository.applyPodCutoff({
      podId: fixture.pod.id,
      now: cutoff
    });
    const legId = cutoffResult.refundLegIds[0];
    if (!legId) throw new Error("Refund leg was not queued");
    await repository.markRefundTransferPrepared({
      legId,
      rawTransactionHex: "eeff0011",
      transactionHash: createHash("sha256").update(legId).digest("hex"),
      validityStartHeight: 701,
      now: new Date("2027-03-08T00:01:00.000Z")
    });
    await repository.markRefundTransferBroadcast({
      legId,
      now: new Date("2027-03-08T00:02:00.000Z")
    });
    await repository.confirmRefundTransfer({
      legId,
      now: new Date("2027-03-08T00:03:00.000Z")
    });

    expect(await repository.getMembershipForUser(excluded.member.userId, fixture.pod.id))
      .toMatchObject({ state: "refunded" });
    expect(await repository.getPodForOwner(fixture.creator.userId, fixture.pod.id))
      .toMatchObject({ state: "locked_scheduled" });
  });

  it("serializes concurrent over-capacity calls into one stable roster and one refund", async () => {
    const fixture = await createPodFixture(2, 2);
    const third = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 103,
      transactionIndex: 0
    });
    const first = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 101,
      transactionIndex: 2
    });
    const second = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 101,
      transactionIndex: 3
    });

    const [left, right] = await Promise.all([
      repository.applyPodCutoff({ podId: fixture.pod.id, now: cutoff }),
      repository.applyPodCutoff({ podId: fixture.pod.id, now: cutoff })
    ]);

    expect(left.includedMembershipIds).toEqual([first.membership.id, second.membership.id]);
    expect(right.includedMembershipIds).toEqual(left.includedMembershipIds);
    expect(await repository.listTransferLegsForPod(fixture.pod.id)).toHaveLength(1);
    expect(await repository.getMembershipForUser(third.member.userId, fixture.pod.id))
      .toMatchObject({ state: "excluded_at_cutoff" });
  });

  it("never admits a deposit finalized after cutoff", async () => {
    const fixture = await createPodFixture(2, 4);
    const early = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 100,
      transactionIndex: 0
    });
    const late = await fundMember({
      podId: fixture.pod.id,
      creatorUserId: fixture.creator.userId,
      blockNumber: 101,
      transactionIndex: 0,
      finalizedAt: new Date("2027-03-08T00:00:01.000Z")
    });

    const result = await repository.applyPodCutoff({ podId: fixture.pod.id, now: cutoff });

    expect(result.podState).toBe("cancelled_refunding");
    expect(result.includedMembershipIds).toEqual([]);
    expect(await repository.getDepositIntentForUser(late.member.userId, late.intent.id))
      .toMatchObject({ state: "exception_review", exceptionCode: "finalized_after_cutoff" });
    expect(await repository.getMembershipForUser(early.member.userId, fixture.pod.id))
      .toMatchObject({ state: "refund_pending" });
  });
});

describe("financially safe creator cancellation", () => {
  it("cancels directly with no deposits and queues refunds when principal is credited", async () => {
    const empty = await createPodFixture(2, 4);
    expect(await repository.cancelEnrollmentPod({
      creatorUserId: empty.creator.userId,
      podId: empty.pod.id,
      now: new Date("2027-03-02T00:00:00.000Z")
    })).toMatchObject({ state: "cancelled" });

    const fundedFixture = await createPodFixture(2, 4);
    const funded = await fundMember({
      podId: fundedFixture.pod.id,
      creatorUserId: fundedFixture.creator.userId,
      blockNumber: 100,
      transactionIndex: 0
    });
    expect(await repository.cancelEnrollmentPod({
      creatorUserId: fundedFixture.creator.userId,
      podId: fundedFixture.pod.id,
      now: new Date("2027-03-02T00:00:00.000Z")
    })).toMatchObject({ state: "cancelled_refunding" });
    expect(await repository.listTransferLegsForPod(fundedFixture.pod.id))
      .toEqual([expect.objectContaining({ depositIntentId: funded.intent.id, state: "queued" })]);
  });
});
