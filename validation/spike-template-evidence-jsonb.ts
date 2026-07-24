import { createRequire } from "node:module";

const requireFromDb = createRequire(
  new URL("../packages/db/package.json", import.meta.url)
);
const { Pool } = requireFromDb("pg") as typeof import("pg");

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
const pool = new Pool({ connectionString: databaseUrl });

const payloads = [
  { kind: "fitness", activityType: "Run", completionNote: "Completed the frozen route." },
  { kind: "reading", title: "The Design of Everyday Things", amount: 25, unit: "pages" },
  { kind: "study", topic: "Settlement invariants", durationMinutes: 45, takeaway: "Conservation first." },
  { kind: "build", resultSummary: "Shipped the template evidence contract.", artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42" },
  { kind: "create", lockedGoal: "Finish one poster study", reflection: "The hierarchy now reads clearly." }
] as const;

try {
  await pool.query("BEGIN");
  await pool.query(`
    CREATE TEMP TABLE template_evidence_spike (
      id serial PRIMARY KEY,
      payload jsonb
    ) ON COMMIT DROP
  `);
  for (const payload of payloads) {
    await pool.query(
      "INSERT INTO template_evidence_spike (payload) VALUES ($1::jsonb)",
      [JSON.stringify(payload)]
    );
  }
  await pool.query("INSERT INTO template_evidence_spike (payload) VALUES (NULL)");
  const result = await pool.query<{ kind: string | null }>(
    "SELECT payload->>'kind' AS kind FROM template_evidence_spike ORDER BY id"
  );
  const kinds = result.rows.map((row) => row.kind);
  if (JSON.stringify(kinds) !== JSON.stringify([...payloads.map((item) => item.kind), null])) {
    throw new Error(`Unexpected JSONB round trip: ${JSON.stringify(kinds)}`);
  }
  console.log(JSON.stringify({ payloads: payloads.length, legacyNull: true, kinds }));
  await pool.query("ROLLBACK");
} finally {
  await pool.end();
}
