import { parseAlphaCapabilities } from "@pods/domain";

export type ReadinessCheck = "ready" | "failed";

type ReadinessDependencies = {
  database: () => Promise<void>;
  evidenceStorage: () => Promise<void>;
  environment?: NodeJS.ProcessEnv;
};

export async function checkWebReadiness({
  database,
  evidenceStorage,
  environment = process.env
}: ReadinessDependencies) {
  const [databaseResult, evidenceStorageResult, configurationResult] =
    await Promise.allSettled([
      database(),
      evidenceStorage(),
      Promise.resolve().then(() => parseAlphaCapabilities(environment))
    ]);

  const checks = {
    configuration:
      configurationResult.status === "fulfilled" ? "ready" : "failed",
    database: databaseResult.status === "fulfilled" ? "ready" : "failed",
    evidenceStorage:
      evidenceStorageResult.status === "fulfilled" ? "ready" : "failed"
  } satisfies Record<string, ReadinessCheck>;

  return {
    ready: Object.values(checks).every((check) => check === "ready"),
    checks
  };
}
