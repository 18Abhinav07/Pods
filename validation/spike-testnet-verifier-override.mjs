import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(new URL("../packages/db/package.json", import.meta.url));
const { Client } = require("pg");
const client = new Client({ connectionString: process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods" });
const [creatorId, memberId, podId] = [randomUUID(), randomUUID(), randomUUID()];
const contractHash = `spike-${randomUUID()}`;
await client.connect();
await client.query("BEGIN");
try {
  await client.query(`CREATE TEMP TABLE pod_verifier_overrides
    (pod_id uuid PRIMARY KEY, contract_hash text NOT NULL, to_verifier text NOT NULL)
    ON COMMIT DROP`);
  await client.query(
    `INSERT INTO users (id, wallet_address, public_key, created_at, updated_at)
     VALUES ($1, $2, 'spike-key', now(), now()), ($3, $4, 'spike-key', now(), now())`,
    [creatorId, `NQ-SPIKE-${creatorId}`, memberId, `NQ-SPIKE-${memberId}`]);
  await client.query(
    `INSERT INTO pods
      (id, creator_user_id, state, template_id, draft_data, contract_data, contract_hash, published_at, created_at, updated_at)
     VALUES ($1, $2, 'active', 'build', '{}', $3::jsonb, $4, now(), now(), now())`,
    [podId, creatorId, JSON.stringify({ settlementMode: "full_refund_alpha",
      verification: { verifier: "pods_team" } }), contractHash]);
  await client.query(
    `INSERT INTO memberships
      (id, pod_id, user_id, admission_source, state, accepted_contract_hash, accepted_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'public_application', 'active', $4, now(), now(), now())`,
    [randomUUID(), podId, memberId, contractHash]);
  const before = await client.query(
    "SELECT contract_data::text, contract_hash FROM pods WHERE id = $1", [podId]);
  await client.query("INSERT INTO pod_verifier_overrides VALUES ($1, $2, 'creator')",
    [podId, contractHash]);
  const projected = await client.query(
    `SELECT COALESCE(o.to_verifier, p.contract_data->'verification'->>'verifier') verifier,
      p.contract_data::text, p.contract_hash, m.accepted_contract_hash
     FROM pods p JOIN memberships m ON m.pod_id = p.id
     LEFT JOIN pod_verifier_overrides o ON o.pod_id = p.id AND o.contract_hash = p.contract_hash
     WHERE p.id = $1`, [podId]);
  const row = projected.rows[0];
  if (row.verifier !== "creator" || row.contract_data !== before.rows[0].contract_data ||
      row.contract_hash !== contractHash || row.accepted_contract_hash !== contractHash) {
    throw new Error("Verifier override mutated or invalidated the frozen contract");
  }
  process.stdout.write("PASS effective creator verifier with frozen hashes unchanged\n");
} finally {
  await client.query("ROLLBACK");
  await client.end();
}
