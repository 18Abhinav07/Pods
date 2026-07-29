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
const pool = new Pool({ connectionString: databaseUrl, max: 4 });
const submissionId = randomUUID();

async function runReviewerTransition() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query<{ stage: string }>(
      `SELECT stage
         FROM proof_case_atomicity_spike
        WHERE submission_id = $1
        FOR UPDATE`,
      [submissionId]
    );
    assert.equal(locked.rows[0]?.stage, "initial_review");
    await client.query(
      `UPDATE proof_case_atomicity_spike
          SET stage = 'appeal_open', version = version + 1
        WHERE submission_id = $1`,
      [submissionId]
    );
    await client.query(
      `INSERT INTO proof_event_atomicity_spike (submission_id, kind, idempotency_key)
       VALUES ($1, 'provisional_rejection', $2)`,
      [submissionId, `review:${submissionId}`]
    );
    await client.query("SELECT pg_sleep(0.15)");
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function runCompetingTimeout() {
  await new Promise((resolve) => setTimeout(resolve, 25));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query<{ stage: string }>(
      `SELECT stage
         FROM proof_case_atomicity_spike
        WHERE submission_id = $1
        FOR UPDATE`,
      [submissionId]
    );
    const stage = locked.rows[0]?.stage;
    if (stage !== "initial_review") {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(
      `UPDATE proof_case_atomicity_spike
          SET stage = 'resolved', submission_state = 'timeout_protected', version = version + 1
        WHERE submission_id = $1`,
      [submissionId]
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await pool.query(`
    CREATE UNLOGGED TABLE IF NOT EXISTS proof_case_atomicity_spike (
      submission_id uuid PRIMARY KEY,
      stage text NOT NULL,
      submission_state text NOT NULL,
      version integer NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`
    CREATE UNLOGGED TABLE IF NOT EXISTS proof_event_atomicity_spike (
      id bigserial PRIMARY KEY,
      submission_id uuid NOT NULL,
      kind text NOT NULL,
      idempotency_key text NOT NULL UNIQUE
    )
  `);
  await pool.query("DELETE FROM proof_event_atomicity_spike WHERE submission_id = $1", [
    submissionId
  ]);
  await pool.query("DELETE FROM proof_case_atomicity_spike WHERE submission_id = $1", [
    submissionId
  ]);
  await pool.query(
    `INSERT INTO proof_case_atomicity_spike (submission_id, stage, submission_state)
     VALUES ($1, 'initial_review', 'reviewing')`,
    [submissionId]
  );

  const [reviewWon, timeoutWon] = await Promise.all([
    runReviewerTransition(),
    runCompetingTimeout()
  ]);
  assert.equal(reviewWon, true);
  assert.equal(timeoutWon, false);

  const provisional = await pool.query<{
    stage: string;
    submission_state: string;
    version: number;
  }>(
    `SELECT stage, submission_state, version
       FROM proof_case_atomicity_spike
      WHERE submission_id = $1`,
    [submissionId]
  );
  assert.deepEqual(provisional.rows[0], {
    stage: "appeal_open",
    submission_state: "reviewing",
    version: 1
  });
  assert.equal(
    (
      await pool.query(
        `SELECT 1
           FROM proof_case_atomicity_spike
          WHERE submission_id = $1
            AND submission_state = 'reviewing'`,
        [submissionId]
      )
    ).rowCount,
    1
  );
  assert.equal(
    (
      await pool.query(
        `SELECT 1
           FROM proof_event_atomicity_spike
          WHERE submission_id = $1`,
        [submissionId]
      )
    ).rowCount,
    1
  );

  await pool.query("BEGIN");
  await pool.query(
    `UPDATE proof_case_atomicity_spike
        SET stage = 'resolved', submission_state = 'rejected', version = version + 1
      WHERE submission_id = $1 AND stage = 'appeal_open'`,
    [submissionId]
  );
  await pool.query(
    `INSERT INTO proof_event_atomicity_spike (submission_id, kind, idempotency_key)
     VALUES ($1, 'rejection_accepted', $2)`,
    [submissionId, `accept:${submissionId}`]
  );
  await pool.query("COMMIT");

  const terminal = await pool.query<{
    stage: string;
    submission_state: string;
    version: number;
  }>(
    `SELECT stage, submission_state, version
       FROM proof_case_atomicity_spike
      WHERE submission_id = $1`,
    [submissionId]
  );
  assert.deepEqual(terminal.rows[0], {
    stage: "resolved",
    submission_state: "rejected",
    version: 2
  });
  assert.equal(
    (
      await pool.query(
        `SELECT 1
           FROM proof_case_atomicity_spike
          WHERE submission_id = $1
            AND submission_state = 'reviewing'`,
        [submissionId]
      )
    ).rowCount,
    0
  );

  console.log(
    JSON.stringify({
      concurrentWinners: 1,
      provisionalState: "reviewing",
      terminalState: "rejected",
      immutableEvents: 2,
      result: "PASS"
    })
  );
} finally {
  await pool.query("DROP TABLE IF EXISTS proof_event_atomicity_spike");
  await pool.query("DROP TABLE IF EXISTS proof_case_atomicity_spike");
  await pool.end();
}
