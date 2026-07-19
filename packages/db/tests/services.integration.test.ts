import { Client } from "pg";
import { describe, expect, it } from "vitest";

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

  it("reports the object store as live", async () => {
    const response = await fetch(objectStorageHealthUrl);
    expect(response.status).toBe(200);
  });
});
