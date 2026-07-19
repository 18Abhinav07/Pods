import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://pods:pods-local-only@127.0.0.1:54329/pods"
  },
  strict: true,
  verbose: true
});
