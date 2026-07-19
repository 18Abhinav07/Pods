import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export async function runPodsMigrations(connectionString: string) {
  const pool = new Pool({ connectionString });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url))
    });
  } finally {
    await pool.end();
  }
}
