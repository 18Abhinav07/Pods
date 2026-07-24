import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

import { KeyPair, PrivateKey } from "@nimiq/core";
import { createPodsRepository } from "@pods/db";
import type { PublishedPodContract } from "@pods/domain";
import { expect, test, type BrowserContext } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3410";
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const signedMessagePrefix = "\x16Nimiq Signed Message:\n";
const repository = createPodsRepository(databaseUrl);
const testUserIds = new Set<string>();

type QueryResult = { rows: Array<Record<string, unknown>> };
type DatabasePool = {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
  end(): Promise<void>;
};
type DatabasePoolConstructor = new (options: {
  connectionString: string;
}) => DatabasePool;

function databasePool() {
  const requireFromDatabaseWorkspace = createRequire(
    path.resolve(process.cwd(), "../../packages/db/package.json")
  );
  const { Pool } = requireFromDatabaseWorkspace("pg") as {
    Pool: DatabasePoolConstructor;
  };
  return new Pool({ connectionString: databaseUrl });
}

async function userIdForWallet(walletAddress: string) {
  const pool = databasePool();
  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE wallet_address = $1",
      [walletAddress]
    );
    const id = result.rows[0]?.id;
    if (typeof id !== "string") {
      throw new Error("Authenticated settlement user was not found");
    }
    return id;
  } finally {
    await pool.end();
  }
}

async function authenticate(
  context: BrowserContext,
  label: string
) {
  const keyPair = KeyPair.derive(
    PrivateKey.fromHex(randomBytes(32).toString("hex"))
  );
  const walletAddress = keyPair.toAddress().toUserFriendlyAddress();
  const challengeResponse = await context.request.post(
    `${baseUrl}/api/auth/challenge`,
    { data: { walletAddress } }
  );
  expect(challengeResponse.ok()).toBe(true);
  const challenge = (await challengeResponse.json()) as {
    id: string;
    message: string;
  };
  const messageBytes = new TextEncoder().encode(challenge.message);
  const digest = createHash("sha256")
    .update(
      Buffer.concat([
        Buffer.from(signedMessagePrefix, "utf8"),
        Buffer.from(String(messageBytes.byteLength), "utf8"),
        Buffer.from(messageBytes)
      ])
    )
    .digest();
  const verifyResponse = await context.request.post(
    `${baseUrl}/api/auth/verify`,
    {
      data: {
        challengeId: challenge.id,
        publicKey: keyPair.publicKey.toHex(),
        signature: keyPair.sign(digest).toHex()
      }
    }
  );
  expect(verifyResponse.ok()).toBe(true);
  const userId = await userIdForWallet(walletAddress);
  testUserIds.add(userId);
  await repository.saveProfile(userId, {
    handle: `phase5_${label}_${randomUUID().replaceAll("-", "").slice(0, 8)}`,
    displayName: label,
    bio: "",
    avatar: { kind: "preset", preset: "indigo" },
    visibility: "private",
    dmPolicy: "friends",
    activityStatusVisible: false
  });
  return { userId, walletAddress };
}

async function seedSettlement(input: {
  creatorUserId: string;
  approved: { userId: string; walletAddress: string };
  rejected: { userId: string; walletAddress: string };
}) {
  const podId = randomUUID();
  const occurrenceId = randomUUID();
  const contractHash = randomUUID();
  const now = new Date("2027-05-04T00:00:00.000Z");
  const contract: PublishedPodContract = {
    version: 1,
    templateId: "build",
    evidenceMode: "per_occurrence_commitment",
    settlementMode: "proportional",
    activity: {
      name: "Mobile settlement proof",
      purpose: "Verify conserved settlement on both supported mobile layouts.",
      startDate: "2027-05-03",
      endDate: "2027-05-03",
      timeZone: "UTC",
      weekdays: [1],
      config: {
        projectTheme: "Settlement release",
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
  const pool = databasePool();
  try {
    await pool.query(
      `INSERT INTO pods (
         id, creator_user_id, state, template_id, draft_data, contract_data,
         contract_hash, published_at, created_at, updated_at
       ) VALUES ($1, $2, 'final_review', 'build', '{}', $3::jsonb, $4, $5, $5, $5)`,
      [podId, input.creatorUserId, JSON.stringify(contract), contractHash, now]
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
      [randomUUID(), podId, now]
    );

    const participants = [input.approved, input.rejected];
    for (let index = 0; index < participants.length; index += 1) {
      const participant = participants[index]!;
      const membershipId = randomUUID();
      const intentId = randomUUID();
      const commitmentId = randomUUID();
      const state = index === 0 ? "approved" : "rejected";
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
          "treasury_asset:testnet",
          `participant_liability:${membershipId}`,
          now
        ]
      );
      await pool.query(
        `INSERT INTO occurrence_commitments (
           id, occurrence_id, membership_id, task, deliverable_type, locked_at
         ) VALUES ($1, $2, $3, $4, 'pull_request', $5)`,
        [
          commitmentId,
          occurrenceId,
          membershipId,
          `Ship mobile settlement outcome ${index + 1}`,
          new Date("2027-05-03T08:00:00.000Z")
        ]
      );
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
          randomUUID(),
          occurrenceId,
          membershipId,
          commitmentId,
          state,
          `Settlement browser result ${index + 1} is complete.`,
          `https://github.com/18Abhinav07/Pods/pull/${80 + index}`,
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
  await repository.finalizePodSettlement({ podId, now });
  return { podId };
}

test.afterAll(async () => {
  if (testUserIds.size > 0) {
    const pool = databasePool();
    try {
      await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
        [...testUserIds]
      ]);
    } finally {
      await pool.end();
    }
  }
  await repository.close();
});

test("creator and participant settlement projections stay mobile and private", async ({
  browser
}) => {
  const creatorContext = await browser.newContext();
  const approvedContext = await browser.newContext();
  const rejectedContext = await browser.newContext();
  try {
    const creator = await authenticate(creatorContext, "Settlement creator");
    const approved = await authenticate(approvedContext, "Approved builder");
    const rejected = await authenticate(rejectedContext, "Rejected builder");
    const fixture = await seedSettlement({
      creatorUserId: creator.userId,
      approved,
      rejected
    });

    const creatorPage = await creatorContext.newPage();
    await creatorPage.goto(`/pods/${fixture.podId}/settlement`);
    await expect(creatorPage.getByText("Treasury conserved")).toBeVisible();
    await expect(
      creatorPage.getByText("2 participant entitlements")
    ).toBeVisible();

    const approvedPage = await approvedContext.newPage();
    await approvedPage.goto(`/pods/${fixture.podId}/settlement`);
    await expect(
      approvedPage.getByText("Your final entitlement")
    ).toBeVisible();
    await expect(
      approvedPage.locator(".settlement-balance > strong")
    ).toHaveText("0.2 NIM");
    await expect(approvedPage.getByText("Queued", { exact: true })).toBeVisible();

    const rejectedPage = await rejectedContext.newPage();
    await rejectedPage.goto(`/pods/${fixture.podId}/settlement`);
    await expect(rejectedPage.getByText("Rejected", { exact: true })).toBeVisible();
    await expect(
      rejectedPage.getByText("No transfer required", { exact: true })
    ).toBeVisible();
    await expect(rejectedPage.locator("body")).not.toContainText("NQ");
  } finally {
    await creatorContext.close();
    await approvedContext.close();
    await rejectedContext.close();
  }
});
