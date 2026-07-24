import { pathToFileURL } from "node:url";

import { createPodsRepository } from "@pods/db";

type AmendmentRepository = Pick<
  ReturnType<typeof createPodsRepository>,
  | "getEffectiveTime"
  | "amendLegacyPodVerifierForTestnet"
  | "protectTimedOutReviewsForPod"
>;

type AmendmentEnvironment = Record<string, string | undefined>;

function readOption(argv: string[], option: string) {
  const index = argv.indexOf(option);
  return index === -1 ? undefined : argv[index + 1]?.trim();
}

function requiredOption(argv: string[], option: string) {
  const value = readOption(argv, option);
  if (!value) {
    throw new Error(
      `Legacy verifier amendment requires ${option} with an exact value`
    );
  }
  return value;
}

export async function runLegacyVerifierAmendmentCommand(input: {
  argv: string[];
  env: AmendmentEnvironment;
  repository: AmendmentRepository;
  realNow?: () => Date;
}) {
  if (
    input.env.APP_ENV !== "alpha" ||
    input.env.NIMIQ_NETWORK !== "testnet" ||
    input.env.PODS_LEGACY_VERIFIER_AMENDMENT_ENABLED !== "true"
  ) {
    throw new Error(
      "Legacy verifier amendment is restricted to enabled alpha Testnet"
    );
  }
  const podId = requiredOption(input.argv, "--pod-id");
  const expectedContractHash = requiredOption(input.argv, "--contract-hash");
  const expectedCreatorUserId = requiredOption(input.argv, "--creator-user-id");
  const actor = requiredOption(input.argv, "--actor");
  const reason = requiredOption(input.argv, "--reason");
  const createdAt = (input.realNow ?? (() => new Date()))();
  const effectiveAt = await input.repository.getEffectiveTime(createdAt);
  const amendment = await input.repository.amendLegacyPodVerifierForTestnet({
    network: "testnet",
    podId,
    expectedContractHash,
    expectedCreatorUserId,
    actor,
    reason,
    effectiveAt,
    createdAt
  });
  const timeoutProtection =
    await input.repository.protectTimedOutReviewsForPod({
      podId,
      now: effectiveAt
    });
  return { amendment, timeoutProtection };
}

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "postgresql://pods:pods-local-only@127.0.0.1:54329/pods");
  if (!databaseUrl) {
    throw new Error("Legacy verifier amendment requires DATABASE_URL");
  }
  const repository = createPodsRepository(databaseUrl);
  try {
    const result = await runLegacyVerifierAmendmentCommand({
      argv: process.argv.slice(2),
      env: process.env,
      repository
    });
    process.stdout.write(
      `${JSON.stringify({
        kind: result.amendment.kind,
        authority: result.amendment.authority,
        protectedSubmissions:
          result.timeoutProtection.protectedSubmissions
      })}\n`
    );
  } finally {
    await repository.close();
  }
}

const executedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === executedPath) {
  void main().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Verifier amendment failed";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
