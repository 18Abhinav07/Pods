import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const requireFromDatabaseWorkspace = createRequire(
  new URL("../packages/db/package.json", import.meta.url)
);
const { Pool } = requireFromDatabaseWorkspace("pg") as typeof import("pg");

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const pool = new Pool({ connectionString: databaseUrl });
const tokenHash = randomUUID().replaceAll("-", "");

try {
  await pool.query(`
    CREATE UNLOGGED TABLE IF NOT EXISTS phase2_invite_spike (
      token_hash text PRIMARY KEY,
      expires_at timestamptz NOT NULL,
      used_at timestamptz,
      accepted_by text
    )
  `);
  await pool.query("DELETE FROM phase2_invite_spike WHERE token_hash = $1", [tokenHash]);
  await pool.query(
    "INSERT INTO phase2_invite_spike (token_hash, expires_at) VALUES ($1, now() + interval '5 minutes')",
    [tokenHash]
  );

  const accept = (userId: string) => pool.query(
    `UPDATE phase2_invite_spike
       SET used_at = now(), accepted_by = $2
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
     RETURNING accepted_by`,
    [tokenHash, userId]
  );
  const attempts = await Promise.all([accept("wallet-a"), accept("wallet-b")]);
  assert.equal(attempts.reduce((count, result) => count + (result.rowCount ?? 0), 0), 1);
  assert.equal((await accept("wallet-c")).rowCount, 0);
  const winner = attempts.flatMap((result) => result.rows)[0]?.accepted_by;
  assert.ok(winner === "wallet-a" || winner === "wallet-b");
  console.log(JSON.stringify({ concurrentWinners: 1, replayWinners: 0, winner }));
} finally {
  await pool.query("DROP TABLE IF EXISTS phase2_invite_spike");
  await pool.end();
}
