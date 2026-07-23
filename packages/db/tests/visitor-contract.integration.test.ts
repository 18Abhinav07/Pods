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
  const session = await repository.createSession({
    walletAddress: `NQTEST${randomUUID()}`,
    publicKey: randomUUID().replaceAll("-", ""),
    tokenHash: randomUUID().replaceAll("-", ""),
    expiresAt: new Date(Date.now() + 60_000)
  });
  testUserIds.add(session.userId);
  return session;
}

async function visitorDraft(creatorUserId: string) {
  const draft = await repository.createDraft(creatorUserId, "build");
  const input = {
    templateId: "build" as const,
    activity: {
      name: `Public visitor Pod ${randomUUID()}`,
      purpose: "Ship one visible Pods improvement while the public follows the locked group.",
      startDate: "2027-03-01",
      endDate: "2027-03-05",
      timeZone: "UTC",
      weekdays: [1, 3, 5],
      config: {
        projectTheme: "Pods",
        allowedDeliverables: ["pull_request"],
        commitmentCutoff: "09:00"
      }
    },
    community: {
      visibility: "public" as const,
      minParticipants: 2,
      maxParticipants: 4,
      applicationQuestions: ["What will you ship?"],
      roomAudience: "public_read_only" as const
    },
    commitment: { nimPerOccurrence: "0.1" }
  };
  await repository.saveActivityStep(creatorUserId, draft.id, input.activity);
  await repository.saveCommunityStep(creatorUserId, draft.id, input.community);
  await repository.saveCommitmentStep(creatorUserId, draft.id, input.commitment);
  const frozen = buildPublishedContract(input);
  if (!frozen.success) throw new Error(frozen.errors.join(", "));
  return { draft, frozen };
}

describe("version two public visitor contract consent", () => {
  it("requires and records creator consent against the published fingerprint", async () => {
    const creator = await createUser();
    const { draft, frozen } = await visitorDraft(creator.userId);

    await expect(repository.publishDraft({
      creatorUserId: creator.userId,
      podId: draft.id,
      contract: frozen.contract,
      occurrences: frozen.occurrences,
      creatorConsentAccepted: false
    })).rejects.toThrow("Creator consent is required for a public visitor room");

    const published = await repository.publishDraft({
      creatorUserId: creator.userId,
      podId: draft.id,
      contract: frozen.contract,
      occurrences: frozen.occurrences,
      creatorConsentAccepted: true
    });

    expect(published.creatorConsentAt).toBeInstanceOf(Date);
    expect(published.creatorConsentContractHash).toBe(published.contractHash);
  });

  it("requires the exact frozen fingerprint at application and funding", async () => {
    const creator = await createUser();
    const applicant = await createUser();
    const { draft, frozen } = await visitorDraft(creator.userId);
    const pod = await repository.publishDraft({
      creatorUserId: creator.userId,
      podId: draft.id,
      contract: frozen.contract,
      occurrences: frozen.occurrences,
      creatorConsentAccepted: true
    });
    const now = new Date("2026-08-01T00:00:00.000Z");
    const answers = [{ question: "What will you ship?", answer: "A tested visitor room" }];

    await expect(repository.applyToPublicPod({
      podId: pod.id,
      applicantUserId: applicant.userId,
      answers,
      acceptedContractHash: "stale-contract",
      visitorDisclosureAccepted: true,
      now
    })).rejects.toThrow("Accept the current frozen Pod contract");

    const application = await repository.applyToPublicPod({
      podId: pod.id,
      applicantUserId: applicant.userId,
      answers,
      acceptedContractHash: pod.contractHash!,
      visitorDisclosureAccepted: true,
      now
    });
    expect(application.acceptedContractHash).toBe(pod.contractHash);
    expect(application.visitorDisclosureAcceptedAt).toEqual(now);

    await repository.decideApplication({
      creatorUserId: creator.userId,
      podId: pod.id,
      applicationId: application.id,
      decision: "accept",
      now
    });
    expect(await repository.getMembershipForUser(applicant.userId, pod.id)).toMatchObject({
      acceptedContractHash: pod.contractHash
    });

    await expect(repository.createDepositIntent({
      podId: pod.id,
      userId: applicant.userId,
      walletAddress: applicant.walletAddress,
      treasuryAddress: "NQ00 TEST TREASURY",
      network: "testnet",
      reference: `pods-${randomUUID()}`,
      now
    })).resolves.toMatchObject({ podId: pod.id });
  });
});
