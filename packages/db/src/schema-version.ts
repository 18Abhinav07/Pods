export const PODS_SCHEMA_VERSION = "0018_proof_reconciliation_lifecycle";
export const PODS_SCHEMA_MIGRATION_CREATED_AT = 1_785_249_026_116;
export const PODS_SCHEMA_MIGRATION_HASH =
  "c149f0c7e6a433e135c6c77d36ed59cd6ab43cb735d4465f05f5872f403b5c1f";

export function schemaIdentityForMigration(input: {
  createdAt: unknown;
  hash: unknown;
}) {
  if (
    Number(input.createdAt) !== PODS_SCHEMA_MIGRATION_CREATED_AT ||
    input.hash !== PODS_SCHEMA_MIGRATION_HASH
  ) {
    throw new Error("Database schema does not match this Pods build");
  }
  return {
    schemaVersion: PODS_SCHEMA_VERSION,
    migrationHash: PODS_SCHEMA_MIGRATION_HASH
  } as const;
}
