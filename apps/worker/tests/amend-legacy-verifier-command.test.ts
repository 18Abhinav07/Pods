import { describe, expect, it, vi } from "vitest";

import { runLegacyVerifierAmendmentCommand } from "../src/activity/amend-legacy-verifier";

const podId = "82663fcc-0f27-4b38-8432-d4c5986a0e70";
const creatorUserId = "10abbd05-e651-4f7d-aea9-93d71d1ca6b8";
const effectiveAt = new Date("2026-07-24T08:30:00.000Z");
const realNow = new Date("2026-07-24T08:31:00.000Z");

function repository() {
  return {
    getEffectiveTime: vi.fn(async () => effectiveAt),
    amendLegacyPodVerifierForTestnet: vi.fn(async () => ({
      kind: "created" as const,
      authority: {
        creatorUserId,
        frozenVerifier: "pods_team" as const,
        effectiveVerifier: "creator" as const,
        source: "testnet_override" as const,
        amendedAt: effectiveAt
      }
    })),
    protectTimedOutReviewsForPod: vi.fn(async () => ({
      protectedSubmissions: 1
    }))
  };
}

const env = {
  APP_ENV: "alpha",
  NIMIQ_NETWORK: "testnet",
  PODS_LEGACY_VERIFIER_AMENDMENT_ENABLED: "true"
};
const argv = [
  "--pod-id", podId,
  "--contract-hash", "phase4-contract",
  "--creator-user-id", creatorUserId,
  "--actor", "ops:abhinav",
  "--reason", "Authorize creator review for the approved Testnet legacy Pod."
];

describe("legacy Testnet verifier amendment command", () => {
  it("records the exact override and protects only that Pod at audited time", async () => {
    const store = repository();
    const result = await runLegacyVerifierAmendmentCommand({
      argv,
      env,
      repository: store,
      realNow: () => realNow
    });

    expect(store.amendLegacyPodVerifierForTestnet).toHaveBeenCalledWith({
      network: "testnet",
      podId,
      expectedContractHash: "phase4-contract",
      expectedCreatorUserId: creatorUserId,
      actor: "ops:abhinav",
      reason: "Authorize creator review for the approved Testnet legacy Pod.",
      effectiveAt,
      createdAt: realNow
    });
    expect(store.protectTimedOutReviewsForPod).toHaveBeenCalledWith({
      podId,
      now: effectiveAt
    });
    expect(result).toMatchObject({
      amendment: { kind: "created" },
      timeoutProtection: { protectedSubmissions: 1 }
    });
  });

  it("fails closed outside the explicit alpha Testnet feature gate", async () => {
    for (const invalid of [
      { ...env, APP_ENV: "production" },
      { ...env, NIMIQ_NETWORK: "mainnet" },
      { ...env, PODS_LEGACY_VERIFIER_AMENDMENT_ENABLED: "false" }
    ]) {
      const store = repository();
      await expect(runLegacyVerifierAmendmentCommand({
        argv,
        env: invalid,
        repository: store,
        realNow: () => realNow
      })).rejects.toThrow("Legacy verifier amendment is restricted to enabled alpha Testnet");
      expect(store.amendLegacyPodVerifierForTestnet).not.toHaveBeenCalled();
    }
  });

  it("requires every exact identity and audit option", async () => {
    const store = repository();
    await expect(runLegacyVerifierAmendmentCommand({
      argv: ["--pod-id", podId],
      env,
      repository: store,
      realNow: () => realNow
    })).rejects.toThrow("Legacy verifier amendment requires");
    expect(store.amendLegacyPodVerifierForTestnet).not.toHaveBeenCalled();
  });
});
