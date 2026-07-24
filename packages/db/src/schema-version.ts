export const PODS_SCHEMA_VERSION = "0017_robust_loners";
export const PODS_SCHEMA_MIGRATION_CREATED_AT = 1_784_882_063_333;
export const PODS_SCHEMA_MIGRATION_HASH =
  "97136dbc69adf6a53bbcb077015df750ad185f71c022dbd27253f2bd150bc4cd";

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
