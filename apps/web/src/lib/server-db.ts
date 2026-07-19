import { createPodsRepository } from "@pods/db";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://pods:pods-local-only@127.0.0.1:54329/pods";

const globalDatabase = globalThis as typeof globalThis & {
  podsRepository?: ReturnType<typeof createPodsRepository>;
};

export const podsRepository =
  globalDatabase.podsRepository ?? createPodsRepository(connectionString);

if (process.env.NODE_ENV !== "production") {
  globalDatabase.podsRepository = podsRepository;
}
