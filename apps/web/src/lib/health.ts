import {
  PODS_SCHEMA_MIGRATION_HASH,
  PODS_SCHEMA_VERSION
} from "@pods/db";
import {
  parseAlphaCapabilities,
  parsePublicRuntimeIdentity
} from "@pods/domain";

export type ReadinessCheck = "ready" | "failed";

type ReadinessDependencies = {
  database: () => Promise<{
    schemaVersion: string;
    migrationHash: string;
  }>;
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
      Promise.resolve().then(() => {
        parseAlphaCapabilities(environment);
        return parsePublicRuntimeIdentity(environment, PODS_SCHEMA_VERSION);
      })
    ]);

  const schemaReady =
    configurationResult.status === "fulfilled" &&
    databaseResult.status === "fulfilled" &&
    databaseResult.value.schemaVersion ===
      configurationResult.value.schemaVersion &&
    databaseResult.value.migrationHash === PODS_SCHEMA_MIGRATION_HASH;
  const checks = {
    configuration:
      configurationResult.status === "fulfilled" ? "ready" : "failed",
    database: databaseResult.status === "fulfilled" ? "ready" : "failed",
    evidenceStorage:
      evidenceStorageResult.status === "fulfilled" ? "ready" : "failed",
    schema: schemaReady ? "ready" : "failed"
  } satisfies Record<string, ReadinessCheck>;

  return {
    ready: Object.values(checks).every((check) => check === "ready"),
    checks,
    runtime: schemaReady ? configurationResult.value : null
  };
}
