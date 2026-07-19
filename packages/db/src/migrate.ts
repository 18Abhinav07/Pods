import { runPodsMigrations } from "./migration-runner";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";
await runPodsMigrations(connectionString);
process.stdout.write("Pods database migrations applied.\n");
