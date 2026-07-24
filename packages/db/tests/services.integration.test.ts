import { Client } from "pg";
import { describe, expect, it } from "vitest";

import { createPodsRepository } from "../src/repository";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const objectStorageHealthUrl =
  process.env.S3_HEALTH_URL ??
  "http://127.0.0.1:59000/minio/health/live";

describe("local Phase 0 services", () => {
  it("accepts a real Postgres query", async () => {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const result = await client.query<{ ready: number }>("select 1 as ready");
      expect(result.rows).toEqual([{ ready: 1 }]);
    } finally {
      await client.end();
    }
  });

  it("reports the exact applied schema version for this build", async () => {
    const repository = createPodsRepository(databaseUrl);
    try {
      await expect(repository.checkHealth()).resolves.toEqual({
        schemaVersion: "0017_robust_loners",
        migrationHash:
          "97136dbc69adf6a53bbcb077015df750ad185f71c022dbd27253f2bd150bc4cd"
      });
    } finally {
      await repository.close();
    }
  });

  it("reports the object store as live", async () => {
    const response = await fetch(objectStorageHealthUrl);
    expect(response.status).toBe(200);
  });
});
