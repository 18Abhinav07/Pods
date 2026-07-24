import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  PODS_SCHEMA_MIGRATION_CREATED_AT,
  PODS_SCHEMA_MIGRATION_HASH,
  PODS_SCHEMA_VERSION,
  schemaIdentityForMigration
} from "../src/schema-version";

describe("Pods schema version", () => {
  it("matches the final code-owned Drizzle journal entry", async () => {
    const journal = JSON.parse(
      await readFile(new URL("../migrations/meta/_journal.json", import.meta.url), "utf8")
    ) as {
      entries: Array<{ tag: string; when: number }>;
    };
    const latest = journal.entries.at(-1);

    expect(latest).toEqual({
      idx: 17,
      version: "7",
      when: PODS_SCHEMA_MIGRATION_CREATED_AT,
      tag: PODS_SCHEMA_VERSION,
      breakpoints: true
    });
  });

  it("matches the exact SHA-256 of the final migration SQL", async () => {
    const migration = await readFile(
      new URL("../migrations/0017_robust_loners.sql", import.meta.url)
    );

    expect(createHash("sha256").update(migration).digest("hex")).toBe(
      PODS_SCHEMA_MIGRATION_HASH
    );
  });

  it("accepts only the exact migration attached to this build", () => {
    expect(
      schemaIdentityForMigration({
        createdAt: String(PODS_SCHEMA_MIGRATION_CREATED_AT),
        hash: PODS_SCHEMA_MIGRATION_HASH
      })
    ).toEqual({
      schemaVersion: PODS_SCHEMA_VERSION,
      migrationHash: PODS_SCHEMA_MIGRATION_HASH
    });
    expect(() =>
      schemaIdentityForMigration({
        createdAt: String(PODS_SCHEMA_MIGRATION_CREATED_AT - 1),
        hash: PODS_SCHEMA_MIGRATION_HASH
      })
    ).toThrow("Database schema does not match this Pods build");
    expect(() =>
      schemaIdentityForMigration({
        createdAt: PODS_SCHEMA_MIGRATION_CREATED_AT,
        hash: "0".repeat(64)
      })
    ).toThrow("Database schema does not match this Pods build");
    expect(() =>
      schemaIdentityForMigration({
        createdAt: "not-a-number",
        hash: PODS_SCHEMA_MIGRATION_HASH
      })
    ).toThrow("Database schema does not match this Pods build");
  });
});
